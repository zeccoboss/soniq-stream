const { selectCover, parseBuffer } = require("music-metadata");
const { v4: uuidV4 } = require("uuid");
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
	return `${appConfig.appName}-${prefix}-${uuidV4()}-${date}-${time}`;
};

/**
 * Upload the cover art embedded in track metadata to Cloudinary/S3,
 * then create and return an ImageModel record.
 */
const processTrackCover = async (user, common) => {
	const pictures = Array.isArray(common?.picture) ? common.picture : null;
	if (!pictures?.length) return null;

	const cover = selectCover(pictures);
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

	const storedImage = await storeTrackCover(cover);
	if (!storedImage) return null;

	try {
		const image = await ImageModel.create({
			uuid: uuidV4(),
			user,
			name: coverName,
			category: "cover",
			format: cover.format ?? "image/jpeg",
			size: Buffer.byteLength(cover.data),
			dimensions,
			storage: storedImage,
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
const buildTrackPayload = (file, trackKey, coverId, metadata, data = {}) => {
	const common = metadata?.common ?? {};
	const format = metadata?.format ?? {};

	// Track endpoint switches between Backblaze API and local MinIO link
	const trackBaseUrl = isProduction
		? process.env.B2_ENDPOINT
		: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000";

	// Clean utility to convert any incoming format into a safe array
	const reqGenres = Array.isArray(data.genre)
		? data.genre
		: data.genre
			? [data.genre]
			: [];
	const metaGenres = Array.isArray(common.genre)
		? common.genre
		: common.genre
			? [common.genre]
			: [];

	// Combine them into a single flat array with unique values
	const combinedGenres = [...new Set([...reqGenres, ...metaGenres])];

	return {
		uuid: uuidV4(),
		size: String(file.size),
		name: file.originalname ?? null,
		artist: common.artist ?? null,
		artists: common.artists ?? [],
		album: common.album ?? null,
		bitrate: format.bitrate ?? null,
		codec: format.codec ?? null,
		duration: Number.isFinite(format.duration)
			? Math.round(format.duration)
			: null,
		hasAudio: format.hasAudio ?? false,
		hasVideo: format.hasVideo ?? false,
		hasCover: !!coverId,
		title: common.title ?? file.originalname ?? null,
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
		genre: combinedGenres.length > 0 ? combinedGenres : ["Unknown"],
		visibility: data.visibility ?? "public",
	};
};

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Full pipeline: parse → upload cover → upload track → save to DB.
 */
const processTrack = async (userId, file, data) => {
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

	// ── 4. Build payload and persist (Passing 'data' down here) ──────────────
	const payload = buildTrackPayload(file, trackKey, coverId, metadata, data);

	try {
		const track = await TrackModel.create({ ...payload, user: userId });
		return track;
	} catch (err) {
		console.error("[MetaManager] TrackModel.create failed:", err);
		return null;
	}
};

module.exports = { processTrack };
