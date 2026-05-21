const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidV4 } = require("uuid");

const SettingsSchema = new Schema(
	{
		user: {
			ref: "User",
			required: true,
			index: true,
			type: Schema.Types.ObjectId,
		},
		uuid: {
			type: String,
			required: true,
			unique: true,
			default: () => uuidV4(),
		},
		// ── Appearance ──
		theme: {
			type: String,
			enum: ["light", "dark", "system"],
			default: "system",
			lowercase: true,
		},
		accentColor: { type: String, default: "#1DB954" }, // SoniqStream Green

		// ── Track/Video Quality ──
		preferredTrackQuality: {
			type: String,
			enum: ["low", "normal", "high", "auto"],
			default: "auto",
		},
		preferredVideoQuality: {
			type: String,
			enum: ["low", "normal", "high", "auto"],
			default: "auto",
		},

		// ── Localization ──
		region: { type: String, default: "Nigeria" },
		language: { type: String, default: "English" },

		// ── Privacy ──
		visibility: {
			type: String,
			enum: ["public", "private"],
			default: "public",
		},
		privacy: {
			showProfilePicture: { type: Boolean, default: true },
			showRecentPlays: { type: Boolean, default: true },
			showPlaylists: { type: Boolean, default: true },
			showListeningActivity: { type: Boolean, default: true },
		},

		// ── Social & Notifications ──
		socialLinks: {
			instagram: { type: String, default: "" },
			x: { type: String, default: "" },
			website: { type: String, default: "" },
		},
		notifications: {
			email: { type: Boolean, default: true },
			push: { type: Boolean, default: true },
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Settings", SettingsSchema);
