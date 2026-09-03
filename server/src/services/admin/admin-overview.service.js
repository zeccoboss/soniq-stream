const { getDashboardStats } = require("./admin-stats.service");
const { getUsersFeed } = require("./admin-users.service");
const { getTracksFeed } = require("./admin-tracks.service");
const { getReportsFeed } = require("./admin-reports.service");

const getAdminOverview = async () => {
	const [stats, users, tracks, reports] = await Promise.all([
		getDashboardStats(),
		getUsersFeed({ limit: 5 }),
		getTracksFeed({ limit: 5 }),
		getReportsFeed({ limit: 5 }),
	]);

	// console.log("Users:", await users.data);

	return {
		stats,
		recentUsers: users.data,
		recentTracks: tracks.data,
		recentReports: reports.data,
	};
};

module.exports = { getAdminOverview };
