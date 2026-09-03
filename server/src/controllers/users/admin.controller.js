const {
	getDashboardStats,
	getUsersFeed,
	getTracksFeed,
	getReportsFeed,
	getAdminOverview,
	resolveReport, // ← add
} = require("../../services/admin");
const {
	sanitizeUserData,
	sanitizeReportData,
} = require("../../services/dto.service");

// @route PATCH /api/v1/admin/reports/:uuid
const updateReportStatus = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { status, resolutionNote } = req.body;

		const report = await resolveReport({
			uuid,
			adminId: req.user._id,
			status,
			resolutionNote,
		});

		res.json({
			success: true,
			message: `Report marked as ${status}`,
			data: sanitizeReportData(report),
		});
	} catch (error) {
		const httpStatus = error.status || 500;
		res.status(httpStatus).json({
			message:
				httpStatus === 500 ? "Failed to update report" : error.message,
		});
	}
};

// @route GET /api/v1/admin/overview
const getOverview = async (req, res) => {
	try {
		const data = await getAdminOverview();

		// Log the overview data for debugging purposes
		// console.log("[Admin] getOverview data:", data);

		res.json({ success: true, data });
	} catch (error) {
		console.error("[Admin] getOverview:", error);
		res.status(500).json({ message: "Failed to fetch admin overview" });
	}
};

// @route GET /api/v1/admin/stats
const getStats = async (req, res) => {
	try {
		const data = await getDashboardStats();
		res.json({ success: true, data });
	} catch (error) {
		console.error("[Admin] getStats:", error);
		res.status(500).json({ message: "Failed to fetch dashboard stats" });
	}
};

// @route GET /api/v1/admin/users
const getUsers = async (req, res) => {
	try {
		const { limit, cursor, order } = req.query;
		const result = await getUsersFeed({ limit, cursor, order });
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("[Admin] getUsers:", error);
		res.status(500).json({ message: "Error fetching users" });
	}
};

// @route GET /api/v1/admin/tracks
const getTracks = async (req, res) => {
	try {
		const { limit, cursor, order } = req.query;
		const result = await getTracksFeed({ limit, cursor, order });
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("[Admin] getTracks:", error);
		res.status(500).json({ message: "Error fetching tracks" });
	}
};

// @route GET /api/v1/admin/reports
const getReports = async (req, res) => {
	try {
		const { limit, cursor } = req.query;
		const result = await getReportsFeed({ limit, cursor });

		// Log the result for debugging purposes
		console.log("[Admin] getReports result:", result);

		res.json({ success: true, ...result });
	} catch (error) {
		console.error("[Admin] getReports:", error);
		res.status(500).json({ message: "Error fetching reports" });
	}
};

// @route DELETE /api/v1/admin/tracks/:uuid
const deleteTrackAsAdmin = async (req, res) => {
	try {
		const { uuid } = req.params;
		const track = await Track.findOneAndDelete({ uuid });

		if (!track) return res.status(404).json({ message: "Track not found" });

		await User.findByIdAndUpdate(track.user, {
			$pull: { uploadsTracksId: track._id },
		});

		// TODO: trigger S3/MinIO object delete for track.storage.key here

		res.json({
			success: true,
			message: "Track permanently removed by Admin",
		});
	} catch (error) {
		res.status(500).json({ message: "Delete failed" });
	}
};

// @route PATCH /api/v1/admin/users/:uuid/role
const updateUserRole = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { newRole } = req.body;

		const validRoles = Object.values(rolesList);
		if (!validRoles.includes(Number(newRole))) {
			return res.status(400).json({ message: "Invalid role code" });
		}

		const user = await User.findOneAndUpdate(
			{ uuid },
			{ $set: { roles: [Number(newRole)] } },
			{ returnDocument: "after" },
		);

		if (!user) return res.status(404).json({ message: "User not found" });

		res.json({
			success: true,
			message: `User ${user.username} promoted/demoted`,
			data: sanitizeUserData(user),
		});
	} catch (error) {
		res.status(500).json({ message: "Role update failed" });
	}
};

// @route PATCH /api/v1/admin/users/:uuid/status
const toggleUserStatus = async (req, res) => {
	try {
		const { uuid } = req.params;

		const user = await User.findOne({ uuid });
		if (!user) return res.status(404).json({ message: "User not found" });

		if (user._id.toString() === req.user._id.toString()) {
			return res
				.status(400)
				.json({ message: "You cannot ban your own account" });
		}

		user.isActive = !user.isActive;
		await user.save();

		res.json({
			success: true,
			message: `User ${user.username} is now ${user.isActive ? "Active" : "Banned"}`,
			isActive: user.isActive,
		});
	} catch (error) {
		res.status(500).json({ message: "Status toggle failed" });
	}
};

module.exports = {
	getOverview,
	getStats,
	getUsers,
	getTracks,
	getReports,
	deleteTrackAsAdmin,
	updateUserRole,
	toggleUserStatus,
	updateReportStatus,
};
