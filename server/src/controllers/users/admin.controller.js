const User = require("../../models/user.model");
const Track = require("../../models/track.model");
const Playlist = require("../../models/playlist.model");

const getDashboardStats = async (req, res) => {
	try {
		// Run counts in parallel for speed
		const [userCount, trackCount, publicPlaylists] = await Promise.all([
			User.countDocuments(),
			Track.countDocuments(),
			Playlist.countDocuments({
				public: true,
			}),
		]);

		res.json({
			success: true,
			data: {
				totalUsers: userCount,
				totalTracks: trackCount,
				activePublicPlaylists: publicPlaylists,
				serverStatus: "Online",
				platformVersion: "1.0.0-beta",
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch dashboard stats" });
	}
};

// @desc    Get all tracks across the platform for moderation
// @route   GET /api/v1/admin/tracks
const getAllTracks = async (req, res) => {
	try {
		// We use lean() for performance since admins might be looking at thousands of tracks
		const tracks = await Track.find()
			.sort({ createdAt: -1 })
			.populate("user", "username email")
			.lean();

		res.json({ success: true, count: tracks.length, data: tracks });
	} catch (error) {
		res.status(500).json({ message: "Error fetching tracks" });
	}
};

// @desc    Force delete a track (e.g. copyright or TOS violation)
// @route   DELETE /api/v1/admin/tracks/:uuid
const deleteTrackAsAdmin = async (req, res) => {
	try {
		const { uuid } = req.params;
		const track = await Track.findOneAndDelete({ uuid });

		if (!track) return res.status(404).json({ message: "Track not found" });

		// Clean up: Remove the track reference from the User's upload array
		await User.findByIdAndUpdate(track.user, {
			$pull: { uploadsTracksId: track._id },
		});

		// Note: You should also trigger your S3/S3 delete logic here
		res.json({
			success: true,
			message: "Track permanently removed by Admin",
		});
	} catch (error) {
		res.status(500).json({ message: "Delete failed" });
	}
};

// @desc    Change a user's role (e.g. promote to Admin or Artist)
// @route   PATCH /api/v1/admin/users/:uuid/role
const updateUserRole = async (req, res) => {
	try {
		const { uuid } = req.params;
		const { newRole } = req.body; // e.g., 5150

		// Security check: Don't allow changing to a role that doesn't exist
		const validRoles = Object.values(
			require("../../config/roles-list.config"),
		);
		if (!validRoles.includes(Number(newRole))) {
			return res.status(400).json({ message: "Invalid role code" });
		}

		const user = await User.findOneAndUpdate(
			{ uuid },
			{ $set: { roles: [Number(newRole)] } }, // Overwrites current roles
			{ new: true },
		).select("-password");

		if (!user) return res.status(404).json({ message: "User not found" });

		res.json({
			success: true,
			message: `User ${user.username} promoted/demoted`,
			data: user,
		});
	} catch (error) {
		res.status(500).json({ message: "Role update failed" });
	}
};

// @desc    Toggle user active status (Ban/Unban)
// @route   PATCH /api/v1/admin/users/:uuid/status
const toggleUserStatus = async (req, res) => {
	try {
		const { uuid } = req.params;

		// 1. Find user
		const user = await User.findOne({ uuid });
		if (!user) return res.status(404).json({ message: "User not found" });

		// 2. Prevent Admin from banning themselves (Safety Check)
		if (user._id.toString() === req.user.id) {
			return res
				.status(400)
				.json({ message: "You cannot ban your own account" });
		}

		// 3. Toggle status
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
	getDashboardStats,
	getAllTracks,
	deleteTrackAsAdmin,
	updateUserRole,
	toggleUserStatus,
};
