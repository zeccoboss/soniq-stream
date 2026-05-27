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

	const [newUploads, trending, topTracks, popular] = await Promise.all([
		TrackModel.find(baseQuery)
			.sort({ createdAt: -1 })
			.limit(queryLimit)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),

		TrackModel.find(baseQuery)
			.sort({ playCount: -1 })
			.limit(queryLimit)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),

		TrackModel.find(baseQuery)
			.sort({ likeCount: -1 })
			.limit(queryLimit)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),

		TrackModel.find(baseQuery)
			.sort({ playCount: -1 })
			.limit(queryLimit)
			.populate(IMAGE_POPULATE)
			.lean({ virtuals: true }),
	]);

	// Clean, unnested key-value structures for frontend mapping
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
