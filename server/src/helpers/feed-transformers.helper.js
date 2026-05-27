const toTrackCard = (track) => ({
	id: track._id,
	title: track.title,
	artist: track.artist,
	cover: getImageUrl(track.cover),
	plays: track.playCount ?? 0,
	genre: track.genre?.[0] ?? null,
	duration: track.duration ?? 0,
});

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

const toArtistCard = (artist) => ({
	username: artist.username ?? "Unknown Artist",
	uuid: artist.uuid,

	avatar: getImageUrl(artist.avatar),

	uploadsCount: artist.uploadsCount ?? 0,
});

module.exports = {
	toTrackCard,
	toArtistCard,
	getImageUrl,
};
