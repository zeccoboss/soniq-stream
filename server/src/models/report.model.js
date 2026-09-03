const mongoose = require("mongoose");
const { v4: uuidV4 } = require("uuid");

const reportSchema = new mongoose.Schema(
	{
		uuid: { type: String, default: uuidV4, unique: true, index: true },

		reportedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		targetType: {
			type: String,
			required: true,
			enum: ["Track", "User", "Comment", "Playlist"],
		},
		targetId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			refPath: "targetType",
		},

		reason: {
			type: String,
			required: true,
			enum: [
				"copyright",
				"spam",
				"harassment",
				"explicit-content",
				"impersonation",
				"other",
			],
		},
		description: { type: String, trim: true, maxlength: 1000 },

		status: {
			type: String,
			enum: ["pending", "reviewed", "resolved", "dismissed"],
			default: "pending",
			index: true,
		},

		reviewedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		reviewedAt: { type: Date, default: null },
		resolutionNote: { type: String, trim: true, default: null },
	},
	{ timestamps: true },
);

// One report per user per target — prevents duplicate-spam reporting
reportSchema.index(
	{ reportedBy: 1, targetType: 1, targetId: 1 },
	{ unique: true },
);

module.exports = mongoose.model("Report", reportSchema);
