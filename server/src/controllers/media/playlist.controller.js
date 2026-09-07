const Playlist = require("../../models/playlist.model");
const Image = require("../../models/image.model");
const User = require("../../models/user.model");
const { v4: uuidV4 } = require("uuid");
const { sanitizePlaylistData } = require("../../services/dto.service");

const createPlaylist = async (req, res) => {
	try {
		const { name, visibility, description } = req.body;
		const userId = req.user._id; // Fixed: was req.user.id

		if (!name?.trim()) {
			return res
				.status(400)
				.json({ success: false, message: "Playlist name is required" });
		}

		const nameLower = name.trim().toLowerCase();

		// Friendly pre-check — the unique index on {user, nameLower} is
		// the real backstop against a race between two identical requests.
		const existing = await Playlist.findOne({ user: userId, nameLower });
		if (existing) {
			return res.status(409).json({
				success: false,
				message: "You already have a playlist with this name.",
			});
		}

		const newPlaylist = await Playlist.create({
			user: userId,
			uuid: uuidV4(),
			name: name.trim(),
			nameLower,
			description: description?.trim() || "",
			visibility: visibility === "private" ? "private" : "public",
			cover: null,
		});

		await User.findByIdAndUpdate(userId, {
			$addToSet: { playlistIds: newPlaylist._id },
		});

		res.status(201).json({
			success: true,
			data: sanitizePlaylistData(newPlaylist.toObject()),
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "You already have a playlist with this name.",
			});
		}
		console.error("[Playlist] createPlaylist:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

const updatePlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { name, visibility, description, trackIds } = req.body;
		const userId = req.user._id; // Fixed: was req.user.id

		const updates = {};
		if (description !== undefined) updates.description = description;
		if (visibility !== undefined) updates.visibility = visibility;
		if (trackIds !== undefined) updates.trackIds = trackIds;

		if (name !== undefined) {
			const nameLower = name.trim().toLowerCase();
			const dup = await Playlist.findOne({
				user: userId,
				nameLower,
				uuid: { $ne: uuid },
			});
			if (dup) {
				return res.status(409).json({
					success: false,
					message: "You already have a playlist with this name.",
				});
			}
			updates.name = name.trim();
			updates.nameLower = nameLower;
		}

		const updatedPlaylist = await Playlist.findOneAndUpdate(
			{ uuid, user: userId },
			updates,
			{ new: true, runValidators: true }, // Fixed: was returnDocument: "after" (not a Mongoose option)
		).populate("cover trackIds");

		if (!updatedPlaylist) {
			return res
				.status(404)
				.json({ success: false, message: "Playlist not found" });
		}

		res.status(200).json({
			success: true,
			data: sanitizePlaylistData(updatedPlaylist.toObject()),
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "You already have a playlist with this name.",
			});
		}
		console.error("[Playlist] updatePlaylist:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

const deletePlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;
		const userId = req.user._id; // Fixed: was req.user.id

		const playlist = await Playlist.findOne({ uuid, user: userId });
		if (!playlist) {
			return res
				.status(404)
				.json({ success: false, message: "Playlist not found" });
		}

		if (playlist.cover) {
			await Image.findByIdAndDelete(playlist.cover);
		}

		await Promise.all([
			User.findByIdAndUpdate(userId, {
				$pull: { playlistIds: playlist._id },
			}),
			// Anyone who saved this playlist loses the reference too — it no longer exists.
			User.updateMany(
				{ savedPlaylistIds: playlist._id },
				{ $pull: { savedPlaylistIds: playlist._id } },
			),
			playlist.deleteOne(),
		]);

		res.status(200).json({
			success: true,
			message: "Playlist and cover removed",
		});
	} catch (error) {
		console.error("[Playlist] deletePlaylist:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

const toggleTrackInPlaylist = async (req, res) => {
	try {
		const { playlistUuid, trackId, action } = req.body;
		const userId = req.user._id; // Fixed: was req.user.id

		const update =
			action === "add"
				? { $addToSet: { trackIds: trackId } }
				: { $pull: { trackIds: trackId } };

		const playlist = await Playlist.findOneAndUpdate(
			{ uuid: playlistUuid, user: userId },
			update,
			{ new: true }, // Fixed: was returnDocument: "after"
		).populate("trackIds");

		if (!playlist) {
			return res
				.status(404)
				.json({ success: false, message: "Playlist not found" });
		}

		res.status(200).json({
			success: true,
			data: sanitizePlaylistData(playlist.toObject()),
		});
	} catch (error) {
		console.error("[Playlist] toggleTrackInPlaylist:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// PATCH /playlists/:uuid/save — save/unsave someone else's public playlist.
// Never duplicates the playlist; just a reference in both directions.
const toggleSavePlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;
		const userId = req.user._id;

		const playlist = await Playlist.findOne({ uuid });
		if (!playlist) {
			return res
				.status(404)
				.json({ success: false, message: "Playlist not found" });
		}
		if (String(playlist.user) === String(userId)) {
			return res
				.status(400)
				.json({
					success: false,
					message: "You can't save your own playlist.",
				});
		}
		if (playlist.visibility !== "public") {
			return res
				.status(403)
				.json({ success: false, message: "This playlist is private." });
		}

		const alreadySaved = playlist.savedByIds.some(
			(id) => id.toString() === userId.toString(),
		);

		await Promise.all([
			Playlist.findByIdAndUpdate(
				playlist._id,
				alreadySaved
					? { $pull: { savedByIds: userId } }
					: { $addToSet: { savedByIds: userId } },
			),
			User.findByIdAndUpdate(
				userId,
				alreadySaved
					? { $pull: { savedPlaylistIds: playlist._id } }
					: { $addToSet: { savedPlaylistIds: playlist._id } },
			),
		]);

		res.status(200).json({ success: true, saved: !alreadySaved });
	} catch (error) {
		console.error("[Playlist] toggleSavePlaylist:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// GET /playlists — the logged-in user's library: what they made + what they saved.
// Shape is { owned, saved } rather than a flat array — flagging this since
// whatever Library page consumes it will need to handle both buckets.
const getMyPlaylists = async (req, res) => {
	try {
		const userId = req.user._id;

		const [owned, me] = await Promise.all([
			Playlist.find({ user: userId })
				.populate("cover")
				.sort({ createdAt: -1 })
				.lean(),
			User.findById(userId).select("savedPlaylistIds").lean(),
		]);

		const saved = await Playlist.find({
			_id: { $in: me?.savedPlaylistIds ?? [] },
		})
			.populate("cover")
			.populate({ path: "user", select: "username uuid avatar" })
			.lean();

		res.status(200).json({
			success: true,
			data: {
				owned: sanitizePlaylistData(owned),
				saved: sanitizePlaylistData(saved),
			},
		});
	} catch (error) {
		console.error("[Playlist] getMyPlaylists:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// GET /playlists/:uuid — single playlist, optionalJWT so guests can view public ones
const getPlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;
		const playlist = await Playlist.findOne({ uuid })
			.populate("cover")
			.populate({ path: "user", select: "username uuid avatar" })
			.populate({
				path: "trackIds",
				populate: {
					path: "user cover",
					select: "username uuid avatar storage name",
				},
			})
			.lean();

		if (!playlist) {
			return res
				.status(404)
				.json({ success: false, message: "Playlist not found" });
		}

		const viewerId = req.user?._id ?? null;
		const ownerId = playlist.user?._id ?? playlist.user;
		const isOwner = viewerId ? String(ownerId) === String(viewerId) : false;

		if (playlist.visibility === "private" && !isOwner) {
			return res
				.status(403)
				.json({ success: false, message: "This playlist is private" });
		}

		const hasSaved = viewerId
			? (playlist.savedByIds ?? []).some(
					(id) => id.toString() === viewerId.toString(),
				)
			: false;

		res.status(200).json({
			success: true,
			data: {
				...sanitizePlaylistData(playlist),
				viewer: { isOwner, hasSaved },
			},
		});
	} catch (error) {
		console.error("[Playlist] getPlaylist:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

module.exports = {
	createPlaylist,
	updatePlaylist,
	deletePlaylist,
	toggleTrackInPlaylist,
	toggleSavePlaylist,
	getMyPlaylists,
	getPlaylist,
};
