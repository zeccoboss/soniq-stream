const Comment = require("../../models/comment.model");
const Track = require("../../models/track.model");
const { createNotification } = require("../notification");

const createComment = async ({ userId, trackUuid, content }) => {
	const track = await Track.findOne({ uuid: trackUuid }).select(
		"_id uuid user",
	);
	if (!track) return null;

	const comment = await Comment.create({
		user: userId,
		track: track._id,
		content,
	});

	// Notify the track owner — createNotification already no-ops if owner === commenter
	await createNotification({
		recipient: track.user,
		actor: userId,
		type: "comment",
		targetType: "Comment",
		targetId: comment._id,
	});

	return comment;
};

module.exports = { createComment };
