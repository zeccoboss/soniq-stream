const TrackModel = require("../../models/track.model");
const UserModel = require("../../models/user.model");
const RecentPlayModel = require("../../models/recent-plays-model");

const { toTrackCard } = require("../../helpers/feed-transformers.helper");

const getForYouFeed = async (userId) => {
	// Shared projection to exclude _id
	const noId = "-_id";

	// ── Guest users ─────────────────────────────
	if (!userId) {
		const popularRightNow = await TrackModel.find({ visibility: "public" })
			.sort({ playCount: -1 })
			.limit(10)
			.select(noId)
			.populate({ path: "cover", select: noId });

		return {
			isLoggedIn: false,
			hasEnoughData: false,
			recentPlays: [],
			liked: [],
			genreRecs: [],
			popularRightNow: popularRightNow.map(toTrackCard),
			topGenre: null,
		};
	}

	// ── Recent Plays ─────────────────────────────
	const recentDocs = await RecentPlayModel.find({ userId })
		.sort({ updatedAt: -1 })
		.limit(10)
		.select(noId)
		.populate({
			path: "TrackId",
			select: noId,
			populate: { path: "cover", select: noId },
		});

	const recentPlays = recentDocs.map((doc) => doc.TrackId).filter(Boolean);

	// ── User Likes ───────────────────────────────
	const user = await UserModel.findById(userId)
		.select(noId)
		.populate({
			path: "likedTracksIds",
			select: noId,
			populate: { path: "cover", select: noId },
		});

	const likedTracksIds = user?.likedTracksIds || [];

	// ── Determine Top Genre (Logic unchanged) ──────────────────────
	const genreMap = {};
	for (const track of [...recentPlays, ...likedTracksIds]) {
		for (const genre of track.genre || []) {
			genreMap[genre] = (genreMap[genre] || 0) + 1;
		}
	}

	let topGenre = null;
	if (Object.keys(genreMap).length) {
		topGenre = Object.entries(genreMap).sort((a, b) => b[1] - a[1])[0][0];
	}

	// ── Genre Recommendations ────────────────────
	let genreRecs = [];
	if (topGenre) {
		genreRecs = await TrackModel.find({
			visibility: "public",
			genre: topGenre,
		})
			.sort({ playCount: -1 })
			.limit(10)
			.select(noId)
			.populate({ path: "cover", select: noId });
	}

	// ── Popular Fallback ─────────────────────────
	const popularRightNow = await TrackModel.find({ visibility: "public" })
		.sort({ playCount: -1 })
		.limit(10)
		.select(noId)
		.populate({ path: "cover", select: noId });

	return {
		isLoggedIn: true,
		hasEnoughData: recentPlays.length > 0 || likedTracksIds.length > 0,
		recentPlays: recentPlays.map(toTrackCard),
		liked: likedTracksIds.map(toTrackCard),
		genreRecs: genreRecs.map(toTrackCard),
		popularRightNow: popularRightNow.map(toTrackCard),
		topGenre,
	};
};

module.exports = { getForYouFeed };
