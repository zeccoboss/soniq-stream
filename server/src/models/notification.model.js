const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const NotificationSchema = new mongoose.Schema(
	{
		uuid: {
			type: String,
			default: uuidv4,
			unique: true,
			index: true,
		},
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		actor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null, // null for "system" notifications
		},
		type: {
			type: String,
			enum: ["follow", "like", "upload", "comment", "system"],
			required: true,
		},
		// Polymorphic target — same pattern as report.model.js
		targetType: {
			type: String,
			enum: ["Track", "User", "Comment", "Playlist", null],
			default: null,
		},
		targetId: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "targetType",
			default: null,
		},
		message: {
			type: String, // free-text copy, used mainly for "system" type
			default: null,
		},
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},
	},
	{ timestamps: true },
);

// Hot path: "give me this user's notifications, newest first" / unread count
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
