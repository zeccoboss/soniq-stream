const mongoose = require("mongoose");
const { Schema } = mongoose;

const ImageSchema = new Schema(
	{
		dimensions: {
			width: { type: Number, required: true },
			height: { type: Number, required: true },
		},
		user: {
			ref: "User",
			required: false,
			index: true,
			type: Schema.Types.ObjectId,
		},
		uuid: { type: String, required: true, unique: true, index: true },
		name: { required: true, type: String },

		category: {
			enum: ["avatar", "cover", "banner", "others"],
			type: String,
			required: true,
		},

		size: { type: Number, required: true },
		storage: {
			key: { type: String, required: true },
			baseUrl: { type: String, required: true },
			type: {
				type: String,
				required: true,
				enum: ["s3", "local", "cloudinary"],
			},
		},

		format: { type: String, default: "image/jpeg", required: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

ImageSchema.virtual("url").get(function () {
	if (
		this.storage?.type === "cloudinary" &&
		typeof this.storage?.baseUrl === "string"
	) {
		return this.storage.baseUrl;
	}
	if (
		typeof this.storage?.baseUrl === "string" &&
		(this.storage.baseUrl.includes("/upload/") ||
			this.storage.baseUrl.includes("res.cloudinary.com"))
	) {
		return this.storage.baseUrl;
	}
	return new URL(this.storage.key, this.storage.baseUrl).href;
});

ImageSchema.virtual("aspectRatio").get(function () {
	if (!this.dimensions?.width || !this.dimensions?.height) return null;
	return this.dimensions.width / this.dimensions.height;
});

ImageSchema.virtual("sizeFormatted").get(function () {
	if (!this.size) return null;

	const kb = this.size / 1024;
	if (kb < 1024) return `${kb.toFixed(2)} KB`;

	const mb = kb / 1024;
	return `${mb.toFixed(2)} MB`;
});

const ImageModel = mongoose.model("Image", ImageSchema);
module.exports = ImageModel;
