const TrackModel = require("../../models/track.model");
const UserModel = require("../../models/user.model");
const RecentPlayModel = require("../../models/recent-plays-model");

const {
	toTrackCard,
	toArtistCard,
} = require("../../helpers/feed-transformers.helper");
const { rolesList } = require("../../config/roles-list.config");

const IMAGE_POPULATE = {
	path: "cover",
	select: "storage",
};

const AVATAR_POPULATE = {
	path: "avatar",
	select: "storage",
};

// ── Explore Feed ─────────────────────────────────────
const getExploreFeed = async () => {
	const genres = [
		{
			name: "Afrobeats",
			icon: "bi-boombox",
			colorClass: "genre-afrobeats",
		},
		{
			name: "Hip Hop",
			icon: "bi-vinyl",
			colorClass: "genre-hiphop",
		},
		{
			name: "Amapiano",
			icon: "bi-music-note-beamed",
			colorClass: "genre-amapiano",
		},
		{
			name: "R&B",
			icon: "bi-disc",
			colorClass: "genre-rnb",
		},
	];

	const [trendingArtists, newThisWeek, trendingTracks] = await Promise.all([
		UserModel.find({ verified: true })
			.sort({ uploadsCount: -1 })
			.limit(10)
			.select("username uuid uploadsCount avatar")
			.populate(AVATAR_POPULATE)
			.lean({ virtuals: true }),

		TrackModel.find({ visibility: "public" })
			.sort({ createdAt: -1 })
			.limit(10)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),

		TrackModel.find({ visibility: "public" })
			.sort({ playCount: -1 })
			.limit(10)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),
	]);

	return {
		genres,
		trendingArtists: trendingArtists.map(toArtistCard),
		newThisWeek: newThisWeek.map(toTrackCard),
		trendingTracks: trendingTracks.map(toTrackCard),
		activeFilter: "all",
	};
};

module.exports = {
	getExploreFeed,
};
