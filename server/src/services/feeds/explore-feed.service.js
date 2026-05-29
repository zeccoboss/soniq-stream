const TrackModel = require("../../models/track.model");
const UserModel = require("../../models/user.model");

const {
	toTrackPayload,
	toArtistCard,
} = require("../../helpers/feed-transformers.helper");

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
		{ name: "Afrobeats", icon: "bi-boombox", colorClass: "genre-afrobeats" },
		{ name: "Hip Hop", icon: "bi-vinyl", colorClass: "genre-hiphop" },
		{
			name: "Amapiano",
			icon: "bi-music-note-beamed",
			colorClass: "genre-amapiano",
		},
		{ name: "R&B", icon: "bi-disc", colorClass: "genre-rnb" },
	];

	const [trendingArtists, newThisWeek, trendingTracks] = await Promise.all([
		// Trending Artists
		UserModel.find({ verified: true })
			.sort({ uploadsCount: -1 })
			.limit(10)
			.select("username uuid uploadsCount avatar -_id") // Added -_id
			.populate(AVATAR_POPULATE)
			.lean({ virtuals: true }),

		// New This Week
		TrackModel.find({ visibility: "public" })
			.sort({ createdAt: -1 })
			.limit(10)
			.select("-_id") // Added -_id
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),

		// Trending Tracks
		TrackModel.find({ visibility: "public" })
			.sort({ playCount: -1 })
			.limit(10)
			.select("-_id") // Added -_id
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),
	]);

	return {
		genres,
		trendingArtists: trendingArtists.map(toArtistCard),
		newThisWeek: await await Promise.all(newThisWeek.map(toTrackPayload)),
		trendingTracks: await Promise.all(trendingTracks.map(toTrackPayload)),
		activeFilter: "all",
	};
};

module.exports = {
	getExploreFeed,
};
