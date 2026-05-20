const { selectCover, parseBuffer } = require("music-metadata");
const { v4: uuidv4 } = require("uuid");
const { storeTrack, storeTrackCover } = require("../services/s3.service");
const ImageModel = require("../models/image.model");
const TrackModel = require("../models/track.model");
const sharp = require("sharp");
const appConfig = require("../config/app.config");

const isProduction = process.env.NODE_ENV === "production";

// ── Private helpers ──────────────────────────────────────────────────────────

/**
 * Generate a unique name with a human-readable timestamp prefix.
 */
const generateUniqueName = (prefix) => {
	const now = new Date();
	const date = now.toDateString().replace(/ /g, "-");
	const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
	return `${appConfig.appName}-${prefix}-${uuidv4()}-${date}-${time}`;
};

/**
 * Upload the cover art embedded in track metadata to Cloudinary/S3,
 * then create and return an ImageModel record.
 */
const processTrackCover = async (user, common) => {
	const cover = selectCover(common.picture);
	if (!cover?.data) return null;

	let dimensions = { width: 0, height: 0 };
	try {
		const meta = await sharp(cover.data).metadata();
		if (meta.width && meta.height) {
			dimensions = { width: meta.width, height: meta.height };
		}
	} catch (err) {
		console.warn(
			"[MetaManager] Could not read cover dimensions:",
			err.message,
		);
	}

	const coverName = generateUniqueName("Cover");
	cover.fileName = coverName;

	const storedKey = await storeTrackCover(cover);
	if (!storedKey) return null;

	// Determine DB payload structure based on whether it's a Cloudinary URL or MinIO key
	const isCloudinaryUrl =
		storedKey.startsWith("http://") || storedKey.startsWith("https://");

	const storagePayload = {
		key: isCloudinaryUrl ? `soniq_stream/covers/${coverName}` : storedKey,
		baseUrl: isCloudinaryUrl
			? storedKey
			: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
		type: isProduction ? "cloudinary" : "s3",
	};

	try {
		const image = await ImageModel.create({
			uuid: uuidv4(),
			user,
			name: coverName,
			category: "cover",
			format: cover.format ?? "image/jpeg",
			size: Buffer.byteLength(cover.data),
			dimensions,
			storage: storagePayload,
		});
		return image._id;
	} catch (err) {
		console.error("[MetaManager] ImageModel.create failed:", err);
		return null;
	}
};

/**
 * Shape raw music-metadata output into a clean TrackModel payload.
 */
const buildTrackPayload = (file, trackKey, coverId, metadata) => {
	const { common, format } = metadata;

	// Track endpoint switches between Backblaze API and local MinIO link
	const trackBaseUrl = isProduction
		? process.env.B2_ENDPOINT
		: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000";

	return {
		uuid: uuidv4(),
		size: String(file.size),
		name: file.originalname ?? null,
		artist: common.artist ?? null,
		artists: common.artists ?? [],
		album: common.album ?? null,
		bitrate: format.bitrate ?? null,
		codec: format.codec ?? null,
		duration: format.duration ?? null,
		hasAudio: format.hasAudio ?? true,
		hasVideo: format.hasVideo ?? false,
		hasCover: !!coverId,
		title: common.title ?? null,
		sampleRate: format.sampleRate ?? null,
		year: common.year ?? null,
		format: file.mimetype ?? "track/mpeg",
		cover: coverId ?? null,
		videoId: null,
		storage: {
			key: trackKey,
			baseUrl: trackBaseUrl,
			type: "s3",
		},
	};
};

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Full pipeline: parse → upload cover → upload track → save to DB.
 */
const processTrack = async (userId, file) => {
	if (!file || typeof file !== "object") {
		console.error("[MetaManager] Invalid file object");
		return null;
	}

	// ── 1. Parse metadata from buffer ─────────────────────────────────────────
	let metadata;
	try {
		metadata = await parseBuffer(file.buffer, { mimeType: file.mimetype });
	} catch (err) {
		console.error("[MetaManager] parseBuffer failed:", err);
		return null;
	}

	// ── 2. Upload cover art (non-blocking if absent) ───────────────────────────
	const coverId = await processTrackCover(userId, metadata.common);

	// ── 3. Upload track to S3/B2 ───────────────────────────────────────────────
	const trackName = generateUniqueName("Track");
	const trackKey = await storeTrack(file, trackName);

	if (!trackKey) {
		console.error("[MetaManager] Track upload to S3 failed — aborting");
		return null;
	}

	// ── 4. Build payload and persist ──────────────────────────────────────────
	const payload = buildTrackPayload(file, trackKey, coverId, metadata);

	try {
		const track = await TrackModel.create({ ...payload, user: userId });
		return track;
	} catch (err) {
		console.error("[MetaManager] TrackModel.create failed:", err);
		return null;
	}
};

module.exports = { processTrack };
