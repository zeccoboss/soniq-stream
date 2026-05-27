const {
	getDiscoverFeed,
	getExploreFeed,
	getForYouFeed,
	getPublicProfile,
	getLibraryFeed,
	getFollowingFeed,
} = require("../../services/feeds");

const getDiscover = async (req, res) => {
	try {
		const data = await getDiscoverFeed({
			cursor: req.query.cursor,
			limit: req.query.limit,
		});

		return res.status(200).json({
			success: true,
			...data,
		});
	} catch (err) {
		console.error("[Feed] Discover Error:", err);

		return res.status(500).json({
			success: false,
			message: "Failed to load discover feed",
		});
	}
};

const getExplore = async (req, res) => {
	const data = await getExploreFeed(req.query);
	res.json({
		success: true,
		...data,
	});
};

const getForYou = async (req, res) => {
	try {
		const userId = req.user?._id || null;

		const data = await getForYouFeed(userId);

		return res.status(200).json({
			success: true,
			...data,
		});
	} catch (err) {
		console.error("[ForYou Feed Error]", err);

		return res.status(500).json({
			success: false,
			message: "Failed to load For You feed",
		});
	}
};

const getLibrary = async (req, res) => {
	const data = await getLibraryFeed(req.user._id);

	res.json({
		success: true,
		...data,
	});
};

const getProfile = async (req, res) => {
	const data = await getPublicProfile(req.params.userId, req.user?._id);

	res.json({
		success: true,
		...data,
	});
};

const getFollowing = async (req, res) => {
	try {
		const { cursor } = req.query; // This is the timestamp from the frontend
		const limit = 10;

		const feed = await getFollowingFeed(req.user.id, cursor, limit);

		res.status(200).json({
			success: true,
			data: feed,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = {
	getDiscover,
	getExplore,
	getForYou,
	getLibrary,
	getProfile,
	getFollowing,
};
