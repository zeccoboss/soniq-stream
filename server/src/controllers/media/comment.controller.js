const {
	createComment,
} = require("../../services/comment/create-comment.service");

const postComment = async (req, res) => {
	try {
		const { content } = req.body;
		const { uuid: trackUuid } = req.params;

		if (!content?.trim()) {
			return res
				.status(400)
				.json({ success: false, message: "Comment content is required." });
		}

		const comment = await createComment({
			userId: req.user._id,
			trackUuid,
			content,
		});
		if (!comment) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found." });
		}

		res.status(201).json({
			success: true,
			data: {
				uuid: comment.uuid,
				content: comment.content,
				createdAt: comment.createdAt,
			},
		});
	} catch (err) {
		console.error("[Comment]: postComment failed:", err);
		res.status(500).json({
			success: false,
			message: "Failed to post comment.",
		});
	}
};

module.exports = { postComment };
