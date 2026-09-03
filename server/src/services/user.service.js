// services/user.service.js
const UserModel = require("../models/user.model");
const Track = require("../models/track.model");

// Service functions related to user operations (recent searches, player state, etc.)
const updateRecentSearches = async (userId, searchTerm) => {
	await UserModel.findByIdAndUpdate(userId, {
		$pull: { recentSearches: searchTerm },
	});

	return await UserModel.findByIdAndUpdate(
		userId,
		{
			$push: {
				recentSearches: {
					$each: [searchTerm],
					$position: 0,
					$slice: 10,
				},
			},
		},
		{ new: true },
	).select("recentSearches");
};

// Sync recent searches from client to server (called on app launch to merge local and server history)
const syncRecentSearches = async (userId, localArray) => {
	const user = await UserModel.findById(userId); // Fixed: was "User" — undefined in this scope

	const merged = [...localArray, ...user.recentSearches];
	const uniqueItems = [...new Set(merged)].slice(0, 10);

	user.recentSearches = uniqueItems;
	await user.save();

	return uniqueItems;
};

// Update player state (current track, progress, isPlaying) - called on pause or heartbeat
const updatePlayerState = async (user_id, stateData) => {
	const { trackUuid, progressMs, isPlaying } = stateData;

	let trackObjectId = null;

	if (trackUuid) {
		const track = await Track.findOne({ uuid: trackUuid }).select("_id");
		if (track) {
			trackObjectId = track._id;
		}
	}

	return await UserModel.findByIdAndUpdate(
		user_id,
		{
			$set: {
				"playerState.currentTrack": trackObjectId,
				"playerState.progressMs": progressMs,
				"playerState.isPlaying": isPlaying,
				"playerState.lastUpdated": new Date(),
			},
		},
		{ returnDocument: "after" },
	).populate("playerState.currentTrack");
};

// Get last player state (current track, progress, isPlaying) - called on app launch to resume playback
const getPlayerState = async (userId) => {
	const user = await UserModel.findById(userId) // Fixed: was "User"
		.select("playerState")
		.populate({
			path: "playerState.currentTrack",
			select: "title artist coverUrl duration trackUrl",
		});

	if (!user) throw new Error("User not found");

	return user.playerState;
};

// Lightweight username search — used by /users/search, returns an array for sanitizeUserSearchResult
const searchUsersByUsername = async ({ q, limit = 10 }) => {
	if (!q || q.trim().length < 2) return [];

	const safeRegex = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const limitNum = Math.min(25, Math.max(1, parseInt(limit) || 10));

	return UserModel.find({ username: { $regex: safeRegex, $options: "i" } })
		.select("uuid username displayName avatar isVerified")
		.limit(limitNum)
		.lean();
};

module.exports = {
	syncRecentSearches,
	updateRecentSearches,
	updatePlayerState,
	getPlayerState,
	searchUsersByUsername,
};
