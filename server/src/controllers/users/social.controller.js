const User = require("../../models/user.model");
const { createNotification } = require("../../services/notification");

const followUser = async (req, res) => {
	try {
		const { targetUuid } = req.params;
		const myId = req.user._id; // Fixed: was req.user.id (undefined per verifyJWT payload)

		const targetUser = await User.findOne({ uuid: targetUuid });
		if (!targetUser)
			return res.status(404).json({ message: "User not found" });

		if (targetUser._id.toString() === myId.toString()) {
			return res.status(400).json({ message: "You cannot follow yourself" });
		}

		await User.findByIdAndUpdate(myId, {
			$addToSet: { followingId: targetUser._id },
		});

		await User.findByIdAndUpdate(targetUser._id, {
			$addToSet: { followersId: myId },
		});

		// No-ops automatically if recipient === actor (already guarded above, belt & suspenders)
		await createNotification({
			recipient: targetUser._id,
			actor: myId,
			type: "follow",
		});

		res.json({
			success: true,
			message: `Now following ${targetUser.username}`,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const unfollowUser = async (req, res) => {
	try {
		const { targetUuid } = req.params;
		const myId = req.user._id; // Fixed: was req.user.id

		const targetUser = await User.findOne({ uuid: targetUuid });
		if (!targetUser)
			return res.status(404).json({ message: "User not found" });

		await User.findByIdAndUpdate(myId, {
			$pull: { followingId: targetUser._id },
		});

		await User.findByIdAndUpdate(targetUser._id, {
			$pull: { followersId: myId },
		});

		res.json({ success: true, message: `Unfollowed ${targetUser.username}` });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = { followUser, unfollowUser };
