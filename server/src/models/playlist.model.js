const mongoose = require("mongoose");
const { Schema } = mongoose;

const PlaylistSchema = new Schema(
	{
		user: {
			ref: "User",
			required: true,
			index: true,
			type: Schema.Types.ObjectId,
		},
		uuid: { type: String, required: true, unique: true, index: true },
		name: { required: true, type: String, trim: true },
		nameLower: { type: String, index: true }, // normalized for case-insensitive duplicate checks — never sent to the client
		description: { type: String, default: "" },
		visibility: {
			type: String,
			enum: ["public", "private"],
			default: "public",
			index: true,
		},
		cover: {
			type: Schema.Types.ObjectId,
			ref: "Image",
			default: null,
		},
		trackIds: {
			type: [{ type: Schema.Types.ObjectId, ref: "Track" }],
			default: [],
		},
		// Users who've saved this playlist to their own library — the
		// playlist itself is never duplicated, this is a pointer list,
		// same pattern as User.followersId.
		savedByIds: {
			type: [{ type: Schema.Types.ObjectId, ref: "User" }],
			default: [],
		},
	},
	{ timestamps: true },
);

// One name per user, case-insensitive — this is the actual duplicate guard;
// the controller check is a friendlier pre-check, this is the hard backstop.
PlaylistSchema.index({ user: 1, nameLower: 1 }, { unique: true });
PlaylistSchema.index({ user: 1, createdAt: -1 });

PlaylistSchema.virtual("trackCount").get(function () {
	return this.trackIds?.length ?? 0;
});
PlaylistSchema.virtual("savesCount").get(function () {
	return this.savedByIds?.length ?? 0;
});

const PlaylistModel = mongoose.model("Playlist", PlaylistSchema);
module.exports = PlaylistModel;
