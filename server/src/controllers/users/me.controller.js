const UserModel = require("../../models/user.model");
const { getLibraryFeed } = require("../../services/feeds/library-feed.service");
const userService = require("../../services/user.service");

const {
	getSettingsFeed,
	updateSettingsFeed,
} = require("../../services/feeds/settings-feed.service");

// @desc    Get complete user profile with images
// @route   GET /api/v1/me
const getMe = async (req, res) => {
	try {
		// req.user comes from verifyJWT middleware (decoded.UserInfo)
		const user = await UserModel.findOne({ uuid: req.user.uuid })
			.populate("avatar banner settings")
			.select("-password -refreshToken");

		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User session not found" });
		res.json({ success: true, data: user });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Get or Create user settings
// @route   GET /api/v1/me/settings
const getSettings = async (req, res) => {
	try {
		const settings = await getSettingsFeed(req.user.id);
		res.json({ success: true, data: settings });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc    Update user settings
// @route   PATCH /api/v1/me/settings
const updateSettings = async (req, res) => {
	try {
		const updated = await updateSettingsFeed(req.user.id, req.body);
		res.json({ success: true, data: updated });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// @desc    Fetch user music library (Liked tracks, playlists, uploads)
// @route   GET /api/v1/me/library
const getMyLibrary = async (req, res) => {
	try {
		const library = await getLibraryFeed(req.user.id);
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

		// req.user.id comes from your Auth Middleware
		const data = await userService.updateRecentSearches(
			req.user.id,
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
		const { searches } = req.body; // Expecting { "searches": ["Artist 1", "Song A"] }

		if (!Array.isArray(searches)) {
			return res
				.status(400)
				.json({ message: "Invalid data format. Expected an array." });
		}

		const updatedList = await userService.syncRecentSearches(
			req.user.id,
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
		// req.user.id is provided by your protect middleware
		const updatedState = await userService.updatePlayerState(
			req.user.id,
			req.body,
		);
		res.status(200).json(updatedState.playerState);
	} catch (error) {
		res.status(500).json({ message: "Failed to sync player state" });
	}
};

// @desc    Get last player state (current track, progress, isPlaying) - called on app launch to resume playback
// @route   GET /api/v1/me/player
const getPlayerState = async (req, res) => {
	try {
		// req.user.id from protect middleware
		const state = await userService.getPlayerState(req.user.id);

		// If no track has ever been played, return a clean empty state
		if (!state.currentTrack) {
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

// src/controllers/user/me.controller.js
const User = require("../../models/user.model");

const fetchLikes = async (req, res) => {
	try {
		// 1. Find the user and populate the likedTracks array directly
		const user = await User.findById(req.user.id)
			.select("likedTracks")
			.populate({
				path: "likedTracks",
				select: "title artist coverUrl duration uuid trackUrl", // Select specific fields for the SPA
			});

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// 2. Return the array of track objects
		res.status(200).json({
			success: true,
			count: user.likedTracks.length,
			data: user.likedTracks,
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
