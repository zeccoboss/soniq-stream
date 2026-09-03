const User = require("../../models/user.model");
const { sanitizeUserData } = require("../dto.service");

const getUsersFeed = async ({ limit = 20, cursor, order = "desc" } = {}) => {
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

	const users = await User.find(filter)
		.populate("avatar banner")
		.sort({ createdAt: sortOrder, _id: sortOrder })
		.limit(limitNum + 1);

	const hasNextPage = users.length > limitNum;
	if (hasNextPage) users.pop();

	let nextCursor = null;
	if (hasNextPage) {
		const lastItem = users[users.length - 1];
		nextCursor = Buffer.from(
			`${lastItem.createdAt.toISOString()}_${lastItem._id}`,
		).toString("base64");
	}

	// console.log("getUsersFeed - sanitized users:", sanitizeUserData(users));

	return {
		data: sanitizeUserData(users),
		nextCursor,
		hasNextPage,
		count: users.length,
	};
};

module.exports = { getUsersFeed };
