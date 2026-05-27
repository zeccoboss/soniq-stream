const sharp = require("sharp");
const { v4: uuidV4 } = require("uuid");

const ImageModel = require("../../models/image.model");
const UserModel = require("../../models/user.model");
const {
	storeImage,
	deleteObject,
	BUCKETS,
} = require("../../services/s3.service");

// ── Helpers ────────────────────────────────────────────────────────────────────
const VALID_TYPES = ["avatar", "cover"];

// Map route type → user field name
const USER_IMAGE_FIELD = {
	avatar: "avatar",
	cover: "cover",
};

/**
 * Delete an existing image record from S3 + DB.
 * Silent on failure — a failed cleanup should never block a new upload.
 */
const cleanupOldImage = async (imageId) => {
	if (!imageId) return;
	try {
		const image = await ImageModel.findById(imageId);
		if (!image) return;

		await deleteObject({ bucket: BUCKETS.images, key: image.storage.key });
		await ImageModel.findByIdAndDelete(imageId);
	} catch (err) {
		console.error("[ImageUpload] Cleanup of old image failed:", err);
	}
};

// ── PATCH /api/users/me/images ─────────────────────────────────────────────────
// Body (multipart/form-data):
//   type  — "avatar" | "cover"
//   image — the file
async function updateImage(req, res) {
	const { type } = req.body;
	const file = req.file;
	const userId = req.user._id; // Set by your auth middleware

	// ── Validate ───────────────────────────────────────────────────────────────
	if (!VALID_TYPES.includes(type)) {
		return res.status(400).json({
			success: false,
			message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
		});
	}

	if (!file) {
		return res
			.status(400)
			.json({ success: false, message: "No image file provided" });
	}

	try {
		// ── Read dimensions from buffer (no temp file needed) ──────────────────
		const meta = await sharp(file.buffer).metadata();
		if (!meta.width || !meta.height) {
			return res.status(422).json({
				success: false,
				message: "Could not read image dimensions",
			});
		}

		// ── Generate a stable unique name for S3 key ────────────────────────
		const uuid = uuidV4();
		const uniqueName = `${type}-${userId}-${uuid}`;

		// ── Upload new image to S3 ───────────────────────────────────────────
		const storedImage = await storeImage(file, uniqueName);
		if (!storedImage) {
			return res.status(500).json({
				success: false,
				message: "Image upload to storage failed",
			});
		}

		// ── Fetch the user to find the old image reference ─────────────────────
		const user = await UserModel.findById(userId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const userField = USER_IMAGE_FIELD[type];
		const oldImageId = user[userField] ?? null;

		// ── Create DB record for new image ─────────────────────────────────────
		const newImage = await ImageModel.create({
			uuid,
			name: uniqueName,
			user: userId,
			category: type, // "avatar" or "cover" — matches your enum
			format: file.mimetype,
			size: file.size,
			dimensions: { width: meta.width, height: meta.height },
			storage: storedImage,
		});

		// ── Update user reference ──────────────────────────────────────────────
		await UserModel.findByIdAndUpdate(userId, { [userField]: newImage._id });

		// ── Delete old image from S3 + DB (after new one is safely saved) ───
		await cleanupOldImage(oldImageId);

		return res.status(200).json({
			success: true,
			message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
			data: {
				imageId: newImage._id,
				url: newImage.url, // virtual
				dimensions: newImage.dimensions,
				sizeFormatted: newImage.sizeFormatted, // virtual
			},
		});
	} catch (err) {
		console.error("[ImageUpload] Unexpected error:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
}

module.exports = { updateImage };
