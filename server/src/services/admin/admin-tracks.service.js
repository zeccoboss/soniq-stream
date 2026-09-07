const Track = require("../../models/track.model");
const { sanitizeTrackData } = require("../dto.service");

const getTracksFeed = async ({ limit = 20, cursor, order = "desc" } = {}) => {
	const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
	const sortOrder = order === "asc" ? 1 : -1;
	const filter = {};

	if (cursor) {
		const decodedCursor = Buffer.from(cursor, "base64").toString("ascii");
		const [cursorTime, cursorId] = decodedCursor.split("_");
		const cursorDate = new Date(cursorTime);
		const op = order === "asc" ? "$gt" : "$lt";

		filter.$or = [
			{ createdAt: { [op]: cursorDate } },
			{ createdAt: cursorDate, _id: { [op]: cursorId } },
		];
	}

	const tracks = await Track.find(filter)
		.sort({ createdAt: sortOrder, _id: sortOrder })
		.limit(limitNum + 1)
		.populate({
			path: "user",
			select: "username email uuid avatar",
			populate: { path: "avatar", select: "storage name uuid" },
		})
		.populate("cover", "storage name uuid dimensions");

	const hasNextPage = tracks.length > limitNum;
	if (hasNextPage) tracks.pop();

	let nextCursor = null;
	if (hasNextPage) {
		const lastItem = tracks[tracks.length - 1];
		nextCursor = Buffer.from(
			`${lastItem.createdAt.toISOString()}_${lastItem._id}`,
		).toString("base64");
	}

	return {
		data: sanitizeTrackData(tracks),
		nextCursor,
		hasNextPage,
		count: tracks.length,
	};
};

// Kept separate from the paginated feed — admin delete-by-force still needs a direct lookup+delete,
// which stays in the controller since it's a mutation, not a read feed.

module.exports = { getTracksFeed };
