const { v4: uuidV4 } = require("uuid");
const { processTrack } = require("../../metadata/meta-manager.metadata");
const {
	deleteObject,
	BUCKETS,
	getSignedUrl,
} = require("../../services/s3.service");

const TrackModel = require("../../models/track.model");
const ImageModel = require("../../models/image.model");
const Track = require("../../models/track.model");
const Comment = require("../../models/comment.model");
const User = require("../../models/user.model");

// ── GET /api/media/track ───────────────────────────────────────────────────────
// Query params:
//   Pagination : page, limit
//   Filters    : artist, album, genre, year, hasAudio, hasCover, user
//   Search     : q (searches title, artist, album at once)
//   Sort       : sortBy (field), order (asc | desc)
const getAllTracks = async (req, res) => {
	try {
		const {
			limit = 20,
			cursor, // Base64 encoded string: "timestamp_id"
			artist,
			album,
			genre,
			year,
			hasAudio,
			hasCover,
			user,
			q,
			sortBy = "createdAt",
			order = "desc",
		} = req.query;

		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
		const sortOrder = order === "asc" ? 1 : -1;

		// 1. Build Filter
		const filter = {};

		// Helper to escape regex special characters (Security Fix)
		const safeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

		if (artist) filter.artist = { $regex: safeRegex(artist), $options: "i" };
		if (album) filter.album = { $regex: safeRegex(album), $options: "i" };
		if (year) filter.year = parseInt(year);
		if (hasAudio !== undefined) filter.hasAudio = hasAudio === "true";
		if (hasCover !== undefined) filter.hasCover = hasCover === "true";

		if (genre) {
			filter.genre = { $in: genre.split(",").map((g) => g.trim()) };
		}

		if (q) {
			const searchRegex = { $regex: safeRegex(q), $options: "i" };
			filter.$or = [
				{ title: searchRegex },
				{ artist: searchRegex },
				{ album: searchRegex },
			];
		}

		// Visibility & Ownership Logic
		const isOwner =
			user && req.user && user.toString() === req.user._id.toString();
		if (isOwner) {
			filter.user = user;
		} else {
			filter.visibility = "public";
			if (user) filter.user = user;
		}

		// 2. Advanced Cursor Logic (Tie-breaker Fix)
		if (cursor) {
			try {
				// Decode Base64 cursor
				const decodedCursor = Buffer.from(cursor, "base64").toString(
					"ascii",
				);
				const [cursorTime, cursorId] = decodedCursor.split("_");

				const cursorDate = new Date(cursorTime);
				const op = order === "asc" ? "$gt" : "$lt";

				// This logic ensures no records are skipped if they share the same timestamp
				filter.$or = [
					{ createdAt: { [op]: cursorDate } },
					{
						createdAt: cursorDate,
						_id: { [op]: cursorId },
					},
				];
			} catch (e) {
				return res
					.status(400)
					.json({ success: false, message: "Invalid cursor format" });
			}
		}

		// 3. Database Query
		const Tracks = await TrackModel.find(filter)
			.populate(
				"cover",
				"uuid name format dimensions storage.baseUrl storage.key",
			)
			.select("-__v")
			.sort({
				createdAt: sortOrder,
				_id: sortOrder, // Always sort by ID as secondary to ensure stability
			})
			.limit(limitNum + 1)
			.lean(); // Faster performance for read-only ops

		// 4. Pagination Metadata
		const hasNextPage = Tracks.length > limitNum;
		if (hasNextPage) Tracks.pop();

		let nextCursor = null;
		if (hasNextPage) {
			const lastItem = Tracks[Tracks.length - 1];
			// Create a compound string "timestamp_id" and encode it
			const rawCursor = `${lastItem.createdAt.toISOString()}_${lastItem._id}`;
			nextCursor = Buffer.from(rawCursor).toString("base64");
		}

		return res.status(200).json({
			success: true,
			data: Tracks,
			nextCursor,
			hasNextPage,
			count: Tracks.length,
		});
	} catch (err) {
		console.error("[Track] getAllTracks Error:", err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// ── GET /api/media/Track/:id ───────────────────────────────────────────────────
const getTrack = async (req, res) => {
	try {
		const Track = await TrackModel.findOne({
			uuid: req.params.uuid,
		})
			.populate("cover", "storage dimensions format uuidv")
			.lean({ virtuals: true });

		if (!Track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		return res.status(200).json({ success: true, data: Track });
	} catch (err) {
		console.error("[Track] getTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

const uploadTrack = async (req, res) => {
	if (!req.file) {
		return res
			.status(400)
			.json({ success: false, message: "No file uploaded" });
	}

	const userId = req.user._id;

	try {
		// ── Daily upload limit check ───────────────────────────────────────────
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0); // midnight of today in server time

		const uploadedToday = await TrackModel.countDocuments({
			user: userId,
			createdAt: { $gte: startOfDay },
		});

		if (uploadedToday >= 10) {
			return res.status(429).json({
				success: false,
				message:
					"Daily upload limit reached. You can upload up to 10 tracks per day.",
				data: {
					limit: 10,
					used: uploadedToday,
					resetsAt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000), // tomorrow midnight
				},
			});
		}

		// ── Process upload ─────────────────────────────────────────────────────
		const Track = await processTrack(userId, req.file, req.body);

		if (!Track) {
			return res
				.status(500)
				.json({ success: false, message: "Track processing failed" });
		}

		// ── Synchronize User Document ──────────────────────────────────────────
		// Push the processed track's _id directly into the user's uploadsTracksId array
		await User.findByIdAndUpdate(
			userId,
			{ $push: { uploadsTracksId: Track._id } },
			// Swapped out to clear the warning log
			{ returnDocument: "after" },
		);

		return res.status(201).json({
			success: true,
			data: {
				Track,
				uploadsRemaining: 10 - (uploadedToday + 1), // helpful for frontend
			},
		});
	} catch (err) {
		console.error("[Track] uploadTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// ── PATCH /api/media/Track/:id ─────────────────────────────────────────────────
// Only allows editing metadata fields — never storage, user, or uuid
const updateTrack = async (req, res) => {
	const EDITABLE_FIELDS = [
		"title",
		"artist",
		"artists",
		"album",
		"genre",
		"year",
		"category",
		"visibility",
	];

	// Strip out anything the client shouldn't be able to change
	const updates = {};
	for (const field of EDITABLE_FIELDS) {
		if (req.body[field] !== undefined) updates[field] = req.body[field];
	}

	if (Object.keys(updates).length === 0) {
		return res
			.status(400)
			.json({ success: false, message: "No valid fields to update" });
	}

	try {
		const Track = await TrackModel.findOne({ uuid: req.params.uuid });

		if (!Track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		// Ownership check — only the uploader can edit their track
		if (Track.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: "Forbidden" });
		}

		const updated = await TrackModel.findByIdAndUpdate(
			req.params.id,
			{ $set: updates },
			{ new: true, runValidators: true },
		);

		return res.status(200).json({ success: true, data: updated });
	} catch (err) {
		console.error("[Track] updateTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// ── DELETE /api/media/track/:id ────────────────────────────────────────────────
// Hard delete: removes track from S3, cover image from S3 + ImageModel, then TrackModel
const deleteTrack = async (req, res) => {
	try {
		const track = await TrackModel.findOne({ uuid: req.params.uuid });

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		// Ownership check
		if (track.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: "Forbidden" });
		}

		// ── 1. Delete track file from S3 ────────────────────────────────────
		await deleteObject({ bucket: BUCKETS.tracks, key: track.storage.key });

		// ── 2. Delete cover art if it exists ──────────────────────────────────
		if (track.cover) {
			try {
				const coverImage = await ImageModel.findById(track.cover);
				if (coverImage) {
					await deleteObject({
						bucket: BUCKETS.images,
						key: coverImage.storage.key,
					});
					await ImageModel.findByIdAndDelete(track.cover);
				}
			} catch (err) {
				// Don't block the delete if cover cleanup fails
				console.error("[Track] Cover cleanup failed:", err);
			}
		}

		// ── 3. Delete TrackModel record ────────────────────────────────────────
		await TrackModel.findByIdAndDelete(req.params.id);

		return res
			.status(200)
			.json({ success: true, message: "Track deleted successfully" });
	} catch (err) {
		console.error("[Track] deleteTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// File: controllers/media/track.controller.js

const toggleLike = async (req, res) => {
	try {
		const { uuid } = req.params;
		const userId = req.user.id; // From verifyJWT

		// 1. Find the track by UUID to get the MongoDB ID
		const track = await Track.findOne({ uuid });
		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		// 2. Check if user already liked it
		const user = await User.findById(userId);
		const isLiked = user.likedTracks.includes(track._id);

		// 3. Toggle Logic
		const update = isLiked
			? { $pull: { likedTracks: track._id } }
			: { $addToSet: { likedTracks: track._id } };

		await User.findByIdAndUpdate(userId, update);

		res.status(200).json({
			success: true,
			message: isLiked ? "Unliked" : "Liked",
			liked: !isLiked,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

const getTrackMetadata = async (req, res) => {
	try {
		const { uuid } = req.params;

		// Find the track and select only the essential metadata fields
		const track = await Track.findOne({ uuid }).select(
			"title artist album genre duration coverUrl year bpm",
		);

		if (!track) {
			return res.status(404).json({
				success: false,
				message: "Track metadata not found",
			});
		}

		res.status(200).json({
			success: true,
			data: track,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error retrieving metadata",
			error: error.message,
		});
	}
};

const addComment = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { content } = req.body;

		const track = await Track.findOne({ uuid });
		if (!track)
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });

		const newComment = await Comment.create({
			content,
			user: req.user.id,
			track: track._id,
		});

		res.status(201).json({ success: true, data: newComment });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

const incrementShareCount = async (req, res) => {
	try {
		const { uuid } = req.params;

		await Track.findOneAndUpdate(
			{ uuid },
			{ $inc: { shareCount: 1 } },
			// Explicitly setting this ensures no hidden warnings break your flow
			{ returnDocument: "after" },
		);

		res.status(200).json({
			success: true,
			message: "Share link generated and tracked",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

const downloadTrack = async (req, res) => {
	try {
		const { uuid } = req.params;
		const track = await TrackModel.findOne({ uuid });

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		// Generate a temporary signed URL for the user to download
		const downloadUrl = await getSignedUrl({
			bucket: BUCKETS.tracks,
			key: track.storage.key,
			expiresIn: 3600, // URL valid for 1 hour
		});

		return res.status(200).json({
			success: true,
			data: { downloadUrl },
		});
	} catch (err) {
		console.error("[Track] downloadTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// createTrack is intentionally omitted — upload go through uploadTrack
module.exports = {
	getAllTracks,
	getTrack,
	uploadTrack,
	updateTrack,
	deleteTrack,
	toggleLike,
	getTrackMetadata,
	addComment,
	incrementShareCount,
	downloadTrack,
};
