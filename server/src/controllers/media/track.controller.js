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
const { createStreamPayload } = require("../../services/media.service");
const { sanitizeTrackData } = require("../../services/dto.service");

// ── GET /api/media/track ───────────────────────────────────────────────────────
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
		const andConditions = []; // search + cursor both need $or — combine via $and instead of overwriting

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
			andConditions.push({
				$or: [
					{ title: searchRegex },
					{ artist: searchRegex },
					{ album: searchRegex },
				],
			});
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
				const decodedCursor = Buffer.from(cursor, "base64").toString(
					"ascii",
				);
				const [cursorTime, cursorId] = decodedCursor.split("_");

				const cursorDate = new Date(cursorTime);
				const op = order === "asc" ? "$gt" : "$lt";

				// Fixed: was overwriting filter.$or (search) — now combined via $and
				andConditions.push({
					$or: [
						{ createdAt: { [op]: cursorDate } },
						{ createdAt: cursorDate, _id: { [op]: cursorId } },
					],
				});
			} catch (e) {
				return res
					.status(400)
					.json({ success: false, message: "Invalid cursor format" });
			}
		}

		if (andConditions.length) filter.$and = andConditions;

		// 3. Database Query
		const tracks = await TrackModel.find(filter)
			.populate({
				path: "user",
				select: "username uuid avatar",
				populate: { path: "avatar", select: "storage name uuid" },
			})
			.populate(
				"cover",
				"uuid name format dimensions storage.baseUrl storage.key",
			)
			.select("-__v")
			.sort({
				createdAt: sortOrder,
				_id: sortOrder,
			})
			.limit(limitNum + 1)
			.lean();

		// 4. Pagination Metadata
		const hasNextPage = tracks.length > limitNum;
		if (hasNextPage) tracks.pop();

		let nextCursor = null;
		if (hasNextPage) {
			const lastItem = tracks[tracks.length - 1];
			const rawCursor = `${lastItem.createdAt.toISOString()}_${lastItem._id}`;
			nextCursor = Buffer.from(rawCursor).toString("base64");
		}

		return res.status(200).json({
			success: true,
			data: sanitizeTrackData(tracks), // strips _id/__v before it reaches the frontend
			nextCursor,
			hasNextPage,
			count: tracks.length,
		});
	} catch (err) {
		console.error("[Track] getAllTracks Error:", err);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// ── GET /api/media/track/:uuid ───────────────────────────────────────────────────
const getTrack = async (req, res) => {
	try {
		const track = await TrackModel.findOne({ uuid: req.params.uuid })
			.populate({
				path: "user",
				select: "username uuid avatar",
				populate: { path: "avatar", select: "storage name uuid" },
			})
			.populate("cover", "storage dimensions format uuid")
			.lean({ virtuals: true });

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		return res
			.status(200)
			.json({ success: true, data: sanitizeTrackData(track) });
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
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

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
					resetsAt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
				},
			});
		}

		const track = await processTrack(userId, req.file, req.body);

		if (!track) {
			return res
				.status(500)
				.json({ success: false, message: "Track processing failed" });
		}

		await User.findByIdAndUpdate(
			userId,
			{ $push: { uploadsTracksId: track._id } },
			{ returnDocument: "after" },
		);

		return res.status(201).json({
			success: true,
			data: {
				track: sanitizeTrackData(track),
				uploadsRemaining: 10 - (uploadedToday + 1),
			},
		});
	} catch (err) {
		console.error("[Track] uploadTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// ── PATCH /api/media/track/:uuid ─────────────────────────────────────────────────
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
		const track = await TrackModel.findOne({ uuid: req.params.uuid });

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		if (track.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: "Forbidden" });
		}

		// Fixed: was req.params.id (undefined) — use the doc's own _id
		const updated = await TrackModel.findByIdAndUpdate(
			track._id,
			{ $set: updates },
			{ new: true, runValidators: true },
		);

		return res
			.status(200)
			.json({ success: true, data: sanitizeTrackData(updated) });
	} catch (err) {
		console.error("[Track] updateTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

// ── DELETE /api/media/track/:uuid ────────────────────────────────────────────────
const deleteTrack = async (req, res) => {
	try {
		const track = await TrackModel.findOne({ uuid: req.params.uuid });

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		if (track.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: "Forbidden" });
		}

		await deleteObject({ bucket: BUCKETS.tracks, key: track.storage.key });

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
				console.error("[Track] Cover cleanup failed:", err);
			}
		}

		// Fixed: was req.params.id (undefined) — use the doc's own _id
		await TrackModel.findByIdAndDelete(track._id);

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

const toggleLike = async (req, res) => {
	try {
		const { uuid } = req.params;
		const userId = req.user._id; // Fixed: was req.user.id (undefined per verifyJWT payload)

		const track = await Track.findOne({ uuid });
		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		const user = await User.findById(userId);
		// Fixed: schema field is likedTracksIds, not likedTracks
		const isLiked = user.likedTracksIds.includes(track._id);

		const update = isLiked
			? { $pull: { likedTracksIds: track._id } }
			: { $addToSet: { likedTracksIds: track._id } };

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

		// NOTE: verify "coverUrl" is a real field on your Track schema —
		// every other query in this file treats cover as a populated relation.
		const track = await Track.findOne({ uuid }).select(
			"title artist album genre duration coverUrl year bpm storage",
		);

		if (!track) {
			return res.status(404).json({
				success: false,
				message: "Track metadata not found",
			});
		}

		track.media = await createStreamPayload({
			storageKey: track.storage?.key,
		});

		res.status(200).json({
			success: true,
			data: sanitizeTrackData(track),
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
			user: req.user._id, // Fixed: was req.user.id
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

		const downloadUrl = await getSignedUrl({
			bucket: BUCKETS.tracks,
			key: track.storage.key,
			expiresIn: 3600,
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
