const { createStreamPayload } = require("../services/media.service");

const getImageUrl = (image) => {
	if (!image?.storage) return null;
	if (image.storage.type === "cloudinary" && image.storage.baseUrl) {
		return image.storage.baseUrl;
	}
	if (
		typeof image.storage.baseUrl === "string" &&
		(image.storage.baseUrl.includes("/upload/") ||
			image.storage.baseUrl.includes("res.cloudinary.com"))
	) {
		return image.storage.baseUrl;
	}

	return new URL(image.storage.key, image.storage.baseUrl).href;
};

/**
 * Strips out web domains, extensions, separators, and underscores
 * to make raw metadata look immaculate in the UI.
 */
const cleanTitle = (title) => {
	if (!title) return "Unknown Track";

	let clean = title;

	// 1. Strip common audio extensions (.mp3, .wav, etc.)
	clean = clean.replace(/\.(mp3|wav|m4a|flac|aac|ogg)$/i, "");

	// 2. Remove promo domains attached by separators (e.g., " | TrendyBeatz.com", " || Swahilisongs.com")
	clean = clean.replace(
		/\s*([|\\\-–—]+)\s*([\w\-]+\.[a-z]{2,6}|trendybeatz|swahilisongs|xclusiveloaded|justnaija|tooxclusive).*/i,
		"",
	);

	// 3. Catch loose domain names floating around without explicit separators
	clean = clean.replace(/\b[\w\-]+\.[a-z]{2,6}\b/i, "");

	// 4. Convert file-name underscores into clean spaces (e.g., Weeks_3_4 -> Weeks 3 4)
	clean = clean.replace(/_/g, " ");

	// 5. Clean up duplicate spaces and trailing whitespace
	return clean.replace(/\s+/g, " ").trim();
};

const toTrackPayload = async (track) => ({
	uuid: track.uuid,
	title: cleanTitle(track.title || track.name),
	name: track.name ?? null,
	artist: track.artist?.username || track.artist || "Unknown Artist",
	album: track.album ?? null,
	cover: getImageUrl(track.cover),
	playCount: track.playCount ?? 0,
	plays: track.playCount ?? 0,
	genre: track.genre?.[0] ?? null,
	duration: track.duration ?? 0,

	// Get the stream payload
	media: await createStreamPayload({
		storageKey: track.storage.key,
		expiresIn: 300000,
	}),
});

const toArtistCard = (artist) => ({
	username: artist.username ?? "Unknown Artist",
	uuid: artist.uuid,
	avatar: getImageUrl(artist.avatar),
	uploadsCount: artist.uploadsCount ?? 0,
});

module.exports = {
	toTrackPayload,
	toArtistCard,
	getImageUrl,
};
