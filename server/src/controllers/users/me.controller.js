const UserModel = require("../../models/user.model");
const { getLibraryFeed } = require("../../services/feeds/library-feed.service");
const userService = require("../../services/user.service");
const { sanitizeUserData } = require("../../services/dto.service");
const {
	getSettingsFeed,
	updateSettingsFeed,
} = require("../../services/feeds/settings-feed.service");

// @desc    Get complete user profile with images and settings
// @route   GET /api/v1/me
const getMe = async (req, res) => {
	try {
		const lookup = req.user?.uuid
			? { uuid: req.user.uuid }
			: req.user?._id
				? { _id: req.user._id }
				: null;

		if (!lookup) {
			return res
				.status(401)
				.json({ success: false, message: "Invalid session payload" });
		}

		const user = await UserModel.findOne(lookup)
			.populate("avatar banner settings")
			.select("-password -refreshToken");
		// .lean({ virtuals: true });

		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User session not found" });

		res.json({ success: true, data: sanitizeUserData(user) });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Get or Create user settings
// @route   GET /api/v1/me/settings
const getSettings = async (req, res) => {
	try {
		const settings = await getSettingsFeed(req.user._id);
		res.json({ success: true, data: settings });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Update user settings
// @route   PATCH /api/v1/me/settings
const updateSettings = async (req, res) => {
	try {
		const updated = await updateSettingsFeed(req.user._id, req.body);
		res.json({ success: true, data: updated });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// @desc    Fetch user music library (Liked tracks, playlists, upload)
// @route   GET /api/v1/me/library
const getMyLibrary = async (req, res) => {
	try {
		const userId = req.user?._id;
		if (!userId) {
			return res
				.status(401)
				.json({ success: false, message: "Invalid session payload" });
		}
		const library = await getLibraryFeed(userId);
		res.json({ success: true, data: library });
	} catch (error) {
		res.status(500).json({ success: false, message: "Library fetch failed" });
	}
};

// @desc    Add a recent search term
// @route   POST /api/v1/me/searches
const addRecentSearch = async (req, res) => {
	try {
		const { searchTerm } = req.body;

		if (!searchTerm || searchTerm.trim() === "") {
			return res.status(400).json({ message: "Search term is required" });
		}

		const data = await userService.updateRecentSearches(
			req.user._id, // Fixed: was req.user.id
			searchTerm.trim(),
		);

		res.status(200).json(data.recentSearches);
	} catch (error) {
		res.status(500).json({
			message: "Server error updating history",
			error: error.message,
		});
	}
};

// @desc    Sync recent searches from client to server (called on app launch to merge local and server history)
// @route   POST /api/v1/me/searches/sync
const syncSearches = async (req, res) => {
	try {
		const { searches } = req.body;

		if (!Array.isArray(searches)) {
			return res
				.status(400)
				.json({ message: "Invalid data format. Expected an array." });
		}

		const updatedList = await userService.syncRecentSearches(
			req.user._id, // Fixed: was req.user.id
			searches,
		);
		res.status(200).json(updatedList);
	} catch (error) {
		res.status(500).json({ message: "Sync failed", error: error.message });
	}
};

// @desc    Save player state (current track, progress, isPlaying) - called on pause or heartbeat
// @route   PATCH /api/v1/me/player
const savePlayerState = async (req, res) => {
	try {
		const updatedState = await userService.updatePlayerState(
			req.user._id,
			req.body,
		);
		res.status(200).json(updatedState.playerState);
	} catch (error) {
		console.error("[Me] savePlayerState:", error);
		res.status(500).json({ message: "Failed to sync player state" });
	}
};

// @desc    Get last player state (current track, progress, isPlaying) - called on app launch to resume playback
// @route   GET /api/v1/me/player
const getPlayerState = async (req, res) => {
	try {
		const state = await userService.getPlayerState(req.user._id); // Fixed: was req.user.id

		// Fixed: guard against state itself being null/undefined, not just state.currentTrack
		if (!state?.currentTrack) {
			return res.status(200).json({ message: "No active player state" });
		}

		res.status(200).json(state);
	} catch (error) {
		res.status(500).json({
			message: "Error fetching player state",
			error: error.message,
		});
	}
};

// @desc    Fetch the current user's liked tracks
// @route   GET /api/v1/me/likes
const fetchLikes = async (req, res) => {
	try {
		const user = await UserModel.findById(req.user._id) // Fixed: was req.user.id, and re-declared "User"
			.select("likedTracksIds") // Fixed: schema field is likedTracksIds, not likedTracks
			.populate({
				path: "likedTracksIds",
				// NOTE: verify these field names against the real Track schema —
				// storage.key/cover-as-relation is the pattern used everywhere else.
				select: "title artist coverUrl duration uuid trackUrl",
			});

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		res.status(200).json({
			success: true,
			count: user.likedTracksIds.length,
			data: user.likedTracksIds,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch liked tracks",
			error: error.message,
		});
	}
};

module.exports = {
	addRecentSearch,
	getMe,
	getSettings,
	updateSettings,
	getMyLibrary,
	syncSearches,
	savePlayerState,
	getPlayerState,
	fetchLikes,
};
