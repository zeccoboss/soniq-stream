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
