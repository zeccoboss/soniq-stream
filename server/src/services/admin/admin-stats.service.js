const User = require("../../models/user.model");
const Track = require("../../models/track.model");
const Playlist = require("../../models/playlist.model");

const getDashboardStats = async () => {
	const [userCount, trackCount, publicPlaylists] = await Promise.all([
		User.countDocuments(),
		Track.countDocuments(),
		Playlist.countDocuments({ public: true }),
	]);

	return {
		totalUsers: userCount,
		totalTracks: trackCount,
		activePublicPlaylists: publicPlaylists,
		serverStatus: "Online",
		platformVersion: "1.0.0-beta",
	};
};

module.exports = { getDashboardStats };
