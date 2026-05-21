const mongoose = require("mongoose");
const { rolesList } = require("../config/roles-list.config");
const { Schema } = mongoose;

// Helper to limit the genres array to a maximum of 5
function genreLimit(val) {
	return val.length > 0 && val.length <= 5;
}

const userSchema = new Schema(
	{
		uuid: { type: String, required: true, unique: true, index: true },

		// Split fullname into first and last to match the frontend payload
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },

		username: {
			type: String,
			required: true, // Updated to required since frontend enforces it
			unique: true,
			trim: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
			lowercase: true,
			trim: true,
		},
		password: { type: String, required: true },

		// ── New Registration Fields ──────────────────────────────
		dob: { type: Date, required: true },
		gender: {
			type: String,
			enum: ["male", "female", "other", "prefer-not"],
			required: true,
		},
		country: {
			type: String,
			required: true,
			uppercase: true,
			trim: true, // Stores "NG", "US", etc.
		},
		genres: {
			type: [String],
			validate: [genreLimit, "You must select between 1 and 5 genres."],
			required: true,
		},
		termsAccepted: {
			type: Boolean,
			required: true,
			// Custom validator to ensure they actually passed 'true'
			validate: [(val) => val === true, "User must accept terms of service"],
		},
		// ─────────────────────────────────────────────────────────

		roles: { type: [Number], default: [rolesList.User], required: true },
		bio: { type: String, default: null },
		verified: { type: Boolean, default: false, index: true },
		refreshToken: { default: null, type: String },
		isActive: { type: Boolean, default: true },

		playerState: {
			currentTrack: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Track",
				default: null,
			},
			progressMs: { type: Number, default: 0 },
			isPlaying: { type: Boolean, default: false },
			lastUpdated: { type: Date, default: Date.now },
		},
		avatar: {
			type: Schema.Types.ObjectId,
			ref: "Image",
		},
		banner: {
			type: Schema.Types.ObjectId,
			ref: "Image",
		},
		settingsId: {
			type: Schema.Types.ObjectId,
			ref: "Settings",
			default: null,
		},

		// Fixed syntax: flat array of ObjectIds
		followingId: [{ type: Schema.Types.ObjectId, ref: "User" }],
		followersId: [{ type: Schema.Types.ObjectId, ref: "User" }],
		authProviders: {
			type: [String],
			enum: ["local", "google", "github"],
			default: ["local"],
		},
		uploadsTracksId: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		likedTracksIds: [{ type: Schema.Types.ObjectId, ref: "Track" }],
		// Fixed syntax: flat array of ObjectIds
		playlistIds: [{ type: Schema.Types.ObjectId, ref: "Playlist" }],
		recentPlaysIds: [{ type: Schema.Types.ObjectId, ref: "RecentPlay" }],

		// Verifying email
		verificationToken: { type: String, default: null },
		verificationTokenExpiry: { type: Date, default: null },
		lastUserVerificationSentAt: { type: Date, default: null },

		// Verifying password
		passwordVerificationToken: { type: String, default: null },
		passwordVerificationTokenExpiry: { type: Date, default: null },
		lastPasswordVerificationSentAt: { type: Date, default: null },
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: (_doc, ret) => {
				delete ret._id;
				delete ret.__v;
				// Optionally delete password here so it never leaks in JSON responses
				delete ret.password;
				return ret;
			},
		},
	},
);

// Virtual for fullname (to support any existing backend code that relies on user.fullname)
userSchema.virtual("fullname").get(function () {
	return `${this.firstName} ${this.lastName}`.trim();
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
