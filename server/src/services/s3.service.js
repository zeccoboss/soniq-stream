const {
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cloudinary = require("cloudinary").v2;
const s3Client = require("../config/s3.config");

const isProduction = process.env.NODE_ENV === "production";

// Configure Cloudinary if we are in production
if (isProduction) {
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	});
}

// Dynamically handle bucket references between S3 and B2
const BUCKETS = {
	images: isProduction ? process.env.B2_IMAGES_BUCKET_NAME : "images",
	tracks: isProduction ? process.env.B2_TRACKS_BUCKET_NAME : "tracks",
};
/**
 * Upload a buffer to S3 compatible storage (S3 or Backblaze B2).
 */
const uploadObject = async ({ bucket, key, buffer, mimeType }) => {
	try {
		await s3Client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: buffer,
				ContentType: mimeType,
				ContentLength: buffer.length,
			}),
		);
		return key;
	} catch (err) {
		console.error(
			`[Storage] Upload failed — bucket: ${bucket}, key: ${key}`,
			err,
		);
		return null;
	}
};

/**
 * Delete an object from storage (handles both B2/S3 and Cloudinary).
 */
const deleteObject = async ({ bucket, key }) => {
	try {
		// If it's an image in production, delete it from Cloudinary
		if (isProduction && bucket === BUCKETS.images) {
			// Cloudinary expects the public_id without the folder prefix or extension
			// You may need a helper here depending on how you save keys in your DB
			await cloudinary.uploader.destroy(key);
			return true;
		}

		// Otherwise, handle regular S3 deletion
		await s3Client.send(
			new DeleteObjectCommand({ Bucket: bucket, Key: key }),
		);
		return true;
	} catch (err) {
		console.error(
			`[Storage] Delete failed — bucket: ${bucket}, key: ${key}`,
			err,
		);
		return false;
	}
};

/**
 * Helper to upload memory buffers straight to Cloudinary
 */
const uploadToCloudinary = (buffer, folder, filename) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{ folder, public_id: filename },
			(error, result) => {
				if (error) return reject(error);
				resolve({
					secureUrl: result.secure_url,
					publicId: result.public_id,
				});
			},
		);
		uploadStream.end(buffer);
	});
};

/**
 * Store a track cover image.
 */
const storeTrackCover = async (cover) => {
	if (!cover || typeof cover !== "object") return null;

	const ext = (cover.format || "image/jpeg").split("/")[1] || "jpeg";
	const filename = cover.fileName;

	if (isProduction) {
		try {
			const uploaded = await uploadToCloudinary(
				Buffer.from(cover.data),
				"soniq_stream/covers",
				filename,
			);
			return {
				key: uploaded.publicId,
				baseUrl: uploaded.secureUrl,
				type: "cloudinary",
			};
		} catch (err) {
			console.error("[Cloudinary] Cover upload failed", err);
			return null;
		}
	}

	// Local Fallback to S3 — Unified explicit path structure
	const key = `${filename}.${ext}`;

	const uploadedKey = await uploadObject({
		bucket: BUCKETS.images,
		key,
		buffer: Buffer.from(cover.data),
		mimeType: cover.format ?? "image/jpeg",
	});

	if (!uploadedKey) return null;
	return {
		key: `${BUCKETS.images}/${uploadedKey}`, // Returns "images/filename.jpeg"
		baseUrl: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
		type: "s3",
	};
};

/**
 * Store a user image (avatar or cover photo).
 */
const storeImage = async (file, uniqueName) => {
	if (!file || typeof file !== "object") return null;

	if (isProduction) {
		try {
			const folder =
				file.fieldname === "avatar"
					? "soniq_stream/avatars"
					: "soniq_stream/banners";
			const uploaded = await uploadToCloudinary(
				file.buffer,
				folder,
				uniqueName,
			);
			return {
				key: uploaded.publicId,
				baseUrl: uploaded.secureUrl,
				type: "cloudinary",
			};
		} catch (err) {
			console.error("[Cloudinary] Image upload failed", err);
			return null;
		}
	}

	// Local Fallback to S3
	const ext = file.mimetype.slice(file.mimetype.indexOf("/") + 1);
	const key = `${uniqueName}.${ext}`;
	const uploadedKey = await uploadObject({
		bucket: BUCKETS.images,
		key,
		buffer: file.buffer,
		mimeType: file.mimetype,
	});
	if (!uploadedKey) return null;
	return {
		key: uploadedKey,
		baseUrl: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
		type: "s3",
	};
};

/**
 * Store a track audio file (Always stays on S3/S3/B2).
 */
const storeTrack = async (file, trackName) => {
	if (!file || typeof file !== "object") return null;

	const ext = file.originalname.slice(file.originalname.lastIndexOf(".") + 1);
	const key = `${trackName}.${ext}`;

	return uploadObject({
		bucket: BUCKETS.tracks,
		key,
		buffer: file.buffer,
		mimeType: file.mimetype ?? "audio/mpeg",
	});
};

/**
 * Generate a short-lived presigned URL for direct access.
 */
const getPresignedUrl = async ({ bucket, key, expiresIn = 60 }) => {
	try {
		const command = new GetObjectCommand({ Bucket: bucket, Key: key });
		return await getSignedUrl(s3Client, command, { expiresIn });
	} catch (err) {
		console.error(
			`[Storage] Presigned URL failed — bucket: ${bucket}, key: ${key}`,
			err,
		);
		return null;
	}
};

module.exports = {
	uploadObject,
	deleteObject,
	storeTrackCover,
	storeTrack,
	storeImage,
	getSignedUrl: getPresignedUrl,
	BUCKETS,
};
