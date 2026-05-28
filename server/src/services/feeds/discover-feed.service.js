const TrackModel = require("../../models/track.model");
const { toTrackCard } = require("../../helpers/feed-transformers.helper");

const IMAGE_POPULATE = {
	path: "cover",
	select: "storage",
};

// ── Discover Feed ─────────────────────────────────────
const getDiscoverFeed = async ({ limit = 10 }) => {
	const queryLimit = Math.min(50, Math.max(1, Number(limit)));

	const baseQuery = {
		visibility: "public",
	};

	// Helper function to keep queries dry and consistent
	const fetchTracks = (sortCriteria) =>
		TrackModel.find(baseQuery)
			.sort(sortCriteria)
			.limit(queryLimit)
			.select("-_id") // Excludes the _id field
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true });

	const [newUploads, trending, topTracks, popular] = await Promise.all([
		fetchTracks({ createdAt: -1 }), // Newest
		fetchTracks({ playCount: -1 }), // Trending by plays
		fetchTracks({ likeCount: -1 }), // Top by likes
		fetchTracks({ playCount: -1 }), // Assuming this was meant to be another metric or sorted differently
	]);

	return {
		newUploads: newUploads.map(toTrackCard),
		trending: trending.map(toTrackCard),
		topTracks: topTracks.map(toTrackCard),
		popular: popular.map(toTrackCard),
	};
};

module.exports = {
	getDiscoverFeed,
};
