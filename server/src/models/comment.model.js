const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const commentSchema = new mongoose.Schema(
	{
		uuid: {
			type: String,
			default: uuidv4,
			unique: true,
			index: true,
		},
		content: { type: String, required: true, trim: true },
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		track: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Track",
			required: true,
		},
	},
	{ timestamps: true },
);

commentSchema.index({ track: 1, createdAt: -1 }); // hot path: comments for a track, newest first

module.exports = mongoose.model("Comment", commentSchema);
