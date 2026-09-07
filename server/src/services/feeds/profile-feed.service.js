const User = require("../../models/user.model");
const Image = require("../../models/image.model");

/**
 * Fetches the public profile data for a specific user.
 * @param {string} identifier - Can be the user's uuid or username.
 * @returns {Promise<Object>} The public profile data.
 */
const getPublicProfile = async (identifier, viewerId = null) => {
	try {
		const query =
			identifier.length > 30
				? { uuid: identifier }
				: { username: identifier };

		const profile = await User.findOne(query)
			.select(
				"uuid firstName lastName username displayName bio followersId followingId avatar banner uploadsTracksId playlistIds",
			)
			.populate("avatar banner")
			.populate({
				path: "uploadsTracksId",
				select: "title artist duration avatar uuid",
				match: { visibility: "public" },
				populate: { path: "avatar", select: "storage name" },
			})
			.populate({
				path: "playlistIds",
				select: "name uuid cover trackIds visibility",
				match: { visibility: "public" },
				populate: { path: "cover", select: "storage name" },
			});

		if (!profile) {
			const err = new Error("Profile not found");
			err.status = 404;
			throw err;
		}

		const isOwnProfile = viewerId
			? String(profile._id) === String(viewerId)
			: false;
		const viewerIsFollowing =
			viewerId && !isOwnProfile
				? profile.followersId.some(
						(id) => id.toString() === viewerId.toString(),
					)
				: false;

		return {
			identity: {
				uuid: profile.uuid,
				fullname: profile.fullname,
				displayName: profile.displayName || profile.fullname,
				username: profile.username,
				bio: profile.bio,
				avatar: profile.avatar?.url || null,
				banner: profile.banner?.url || null,
			},
			stats: {
				followersCount: profile.followersId?.length || 0,
				followingCount: profile.followingId?.length || 0,
				totalUploads: profile.uploadsTracksId?.length || 0,
			},
			viewer: {
				isOwnProfile,
				isFollowing: viewerIsFollowing,
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

module.exports = { getPublicProfile };

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
