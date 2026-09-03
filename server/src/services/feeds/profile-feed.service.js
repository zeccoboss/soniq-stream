const User = require("../../models/user.model");
const Image = require("../../models/image.model");

/**
 * Fetches the public profile data for a specific user.
 * @param {string} identifier - Can be the user's uuid or username.
 * @returns {Promise<Object>} The public profile data.
 */
const getPublicProfile = async (identifier) => {
	try {
		// 1. Find user by UUID or Username (useful for custom profile URLs)
		const query =
			identifier.length > 30
				? { uuid: identifier }
				: { username: identifier };

		const profile = await User.findOne(query)
			.select(
				"fullname username bio followersId followingId avatar banner uploadsTracksId playlistIds",
			)
			.populate("avatar banner")
			.populate({
				path: "uploadsTracksId",
				select: "title artist duration avatar uuid",
				match: { visibility: "public" }, // Only show public upload
				populate: { path: "avatar", select: "storage name" },
			})
			.populate({
				path: "playlistIds",
				select: "name trackIds public uuid",
				match: { public: true }, // Only show public playlists
			});

		if (!profile) {
			throw new Error("Profile not found");
		}

		console.log("Profile found:", profile);

		// 2. Format the data to focus on social stats and public content
		return {
			identity: {
				fullname: profile.fullname,
				username: profile.username,
				bio: profile.bio,
				avatar: profile.avatar?.url || null,
				cover: profile.cover?.url || null,
				banner: profile.banner?.url || null,
			},
			stats: {
				followersCount: profile.followersId?.length || 0,
				followingCount: profile.followingId?.length || 0,
				totalUploads: profile.uploadsTracksId?.length || 0,
			},
			content: {
				publicTracks: profile.uploadsTracksId || [],
				publicPlaylists: profile.playlistIds || [],
			},
		};
	} catch (error) {
		console.error("Profile Service Error:", error.message);
		throw error;
	}
};

const searchUsersByUsername = async ({ q, limit = 10 }) => {
	if (!q || q.trim().length < 2) return [];

	const safeRegex = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const limitNum = Math.min(25, Math.max(1, parseInt(limit) || 10));

	return User.find({ username: { $regex: safeRegex, $options: "i" } })
		.select("uuid username displayName avatar isVerified")
		.limit(limitNum)
		.lean();
};

module.exports = {
	getPublicProfile,
	searchUsersByUsername,
};
