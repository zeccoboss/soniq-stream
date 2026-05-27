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
				"fullname username bio followersId followingId avatar cover banner uploadsTracksId playlistIds",
			)
			.populate("avatar cover banner")
			.populate({
				path: "uploadsTracksId",
				select: "title artist duration cover uuid",
				match: { visibility: "public" }, // Only show public upload
				populate: { path: "cover", select: "storage name" },
			})
			.populate({
				path: "playlistIds",
				select: "name trackIds public uuid",
				match: { public: true }, // Only show public playlists
			});

		if (!profile) {
			throw new Error("Profile not found");
		}

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

/**
 * Fetches or initializes a user's private settings.
 * @param {string} userId - The database ID of the authenticated user.
 * @returns {Promise<Object>} The user's settings object.
 */
const getSettingsFeed = async (userId) => {
	try {
		const user = await User.findById(userId).select("settings");

		if (!user) {
			throw new Error("User not found");
		}

		// Fallback: If settings don't exist yet for the user, return a default schema structure
		if (!user.settings) {
			user.settings = {
				theme: "dark",
				notifications: { email: true, push: false },
				streamingQuality: "high",
			};
			await user.save();
		}

		return user.settings;
	} catch (error) {
		console.error("Get Settings Service Error:", error.message);
		throw error;
	}
};

/**
 * Updates a user's settings.
 * @param {string} userId - The database ID of the authenticated user.
 * @param {Object} newSettings - The partial or complete settings payload to update.
 * @returns {Promise<Object>} The updated settings object.
 */
const updateSettingsFeed = async (userId, newSettings) => {
	try {
		const user = await User.findById(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Merge existing settings with new updates, handling nested objects like 'notifications'
		user.settings = {
			...user.settings,
			...newSettings,
			notifications: {
				...user.settings?.notifications,
				...newSettings?.notifications,
			},
		};

		await user.save();
		return user.settings;
	} catch (error) {
		console.error("Update Settings Service Error:", error.message);
		throw error;
	}
};

module.exports = {
	getPublicProfile,
	getSettingsFeed,
	updateSettingsFeed, // <-- Now properly exported for your controller to use!
};
