const User = require("../../models/user.model");
const Track = require("../../models/track.model");
const Playlist = require("../../models/playlist.model");

/**
 * Fetches the complete personal library for the authenticated user.
 * Groups content into Liked Tracks, Created Playlists, and Personal upload.
 * * @param {string} userId - The MongoDB _id of the user
 * @returns {Promise<Object>} The structured library data
 */
const getLibraryFeed = async (userId) => {
	try {
		// 1. Fetch the user and deep-populate the nested media references
		const userLibrary = await User.findById(userId)
			.select("likedTracksIds playlistIds uploadsTracksId")
			.populate({
				path: "likedTracksIds",
				select: "title artist duration cover uuid",
				populate: {
					path: "cover",
					select: "storage name dimensions", // Virtual 'url' will be included
				},
			})
			.populate({
				path: "playlistIds",
				select: "name uuid trackIds public",
				// Note: If playlists eventually get covers, populate them here
			})
			.populate({
				path: "uploadsTracksId",
				select: "title artist duration format size cover uuid",
				populate: {
					path: "cover",
					select: "storage name",
				},
			});

		if (!userLibrary) {
			throw new Error("User library context not found");
		}

		// 2. Structure the data for the SoniqStream UI
		// We format this to make it easy for the frontend to map over tabs
		return {
			summary: {
				totalLiked: userLibrary.likedTracksIds?.length || 0,
				totalPlaylists: userLibrary.playlistIds?.length || 0,
				totalUploads: userLibrary.uploadsTracksId?.length || 0,
			},
			sections: {
				likedTracks: userLibrary.likedTracksIds || [],
				playlists: userLibrary.playlistIds || [],
				upload: userLibrary.uploadsTracksId || [],
			},
			lastUpdated: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Library Service Error:", error.message);
		throw error;
	}
};

module.exports = {
	getLibraryFeed,
};
