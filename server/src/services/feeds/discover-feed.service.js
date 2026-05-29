const TrackModel = require("../../models/track.model");
const { toTrackPayload } = require("../../helpers/feed-transformers.helper");

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
		newUploads: await Promise.all(newUploads.map(toTrackPayload)),
		trending: await Promise.all(trending.map(toTrackPayload)),
		topTracks: await Promise.all(topTracks.map(toTrackPayload)),
		popular: await Promise.all(popular.map(toTrackPayload)),
	};
};

module.exports = {
	getDiscoverFeed,
};
