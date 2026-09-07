const User = require("../../models/user.model");
const { createNotification } = require("../notification");

const followUser = async ({ followerId, targetUuid }) => {
	const target = await User.findOne({ uuid: targetUuid }).select("_id");
	if (!target) return null;

	if (String(target._id) === String(followerId)) {
		const err = new Error("You can't follow yourself.");
		err.status = 400;
		throw err;
	}

	await Promise.all([
		User.findByIdAndUpdate(followerId, {
			$addToSet: { followingId: target._id },
		}),
		User.findByIdAndUpdate(target._id, {
			$addToSet: { followersId: followerId },
		}),
	]);

	await createNotification({
		recipient: target._id,
		actor: followerId,
		type: "follow",
	});

	return { following: true };
};

const unfollowUser = async ({ followerId, targetUuid }) => {
	const target = await User.findOne({ uuid: targetUuid }).select("_id");
	if (!target) return null;

	await Promise.all([
		User.findByIdAndUpdate(followerId, {
			$pull: { followingId: target._id },
		}),
		User.findByIdAndUpdate(target._id, {
			$pull: { followersId: followerId },
		}),
	]);

	return { following: false };
};

const isFollowing = async ({ followerId, targetId }) => {
	const me = await User.findById(followerId).select("followingId");
	return me.followingId.some((id) => id.toString() === targetId.toString());
};

module.exports = { followUser, unfollowUser, isFollowing };
