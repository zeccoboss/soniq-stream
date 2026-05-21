const Playlist = require("../../models/playlist.model");
const Image = require("../../models/image.model");
const { v4: uuidV4 } = require("uuid");

/**
 * @desc    Create a new playlist with an automatic default cover record
 * @route   POST /api/v1/playlists
 */
const createPlaylist = async (req, res) => {
	try {
		const { name, visibility, description } = req.body;
		const userId = req.user.id; // From verifyJWT middleware

		// 1. Create a default Image document for the playlist cover
		// This allows you to update the physical file later without changing IDs
		const defaultCover = await Image.create({
			user: userId,
			uuid: uuidV4(),
			name: `${name} Cover`,
			category: "cover",
			dimensions: { width: 500, height: 500 }, // Standard cover size
			size: 0, // Placeholder until an actual file is uploaded
			format: "image/png",
			storage: {
				key: "default-playlist.png", // Your fallback storage key
				baseUrl:
					process.env.STORAGE_BASE_URL || "http://localhost:5000/public/",
				type: "local",
			},
		});

		// 2. Create the Playlist and link the new Image ID
		const newPlaylist = await Playlist.create({
			user: userId,
			uuid: uuidV4(),
			name,
			description,
			visibility: visibility || "public",
			cover: defaultCover._id, // Storing the ID as requested
		});

		res.status(201).json({
			success: true,
			data: await newPlaylist.populate("cover"),
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

/**
 * @desc    Update playlist details or track list
 */
const updatePlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { name, visibility, description, trackIds } = req.body;

		const updatedPlaylist = await Playlist.findOneAndUpdate(
			{ uuid, user: req.user.id },
			{ name, visibility, description, trackIds },
			{ new: true, runValidators: true },
		).populate("cover");

		if (!updatedPlaylist)
			return res.status(404).json({ message: "Playlist not found" });

		res.status(200).json({ success: true, data: updatedPlaylist });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

/**
 * @desc    Remove a playlist and its associated cover record
 */
const deletePlaylist = async (req, res) => {
	try {
		const { uuid } = req.params;

		const playlist = await Playlist.findOne({ uuid, user: req.user.id });
		if (!playlist)
			return res.status(404).json({ message: "Playlist not found" });

		// Clean up the associated Image record
		await Image.findByIdAndDelete(playlist.cover);
		await playlist.deleteOne();

		res.status(200).json({
			success: true,
			message: "Playlist and cover removed",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

/**
 * @desc    Add or Remove track (Utility methods)
 */
const toggleTrackInPlaylist = async (req, res) => {
	try {
		const { playlistUuid, trackId, action } = req.body; // action: 'add' or 'remove'
		const update =
			action === "add"
				? { $addToSet: { trackIds: trackId } }
				: { $pull: { trackIds: trackId } };

		const playlist = await Playlist.findOneAndUpdate(
			{ uuid: playlistUuid, user: req.user.id },
			update,
			{ new: true },
		).populate("trackIds");

		res.status(200).json({ success: true, data: playlist });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = {
	createPlaylist,
	updatePlaylist,
	deletePlaylist,
	toggleTrackInPlaylist,
};
