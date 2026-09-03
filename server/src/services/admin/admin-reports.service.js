// admin-reports.service.js
const Report = require("../../models/report.model");
const { sanitizeReportData } = require("../dto.service");

// Pure inclusion — sensitive fields are safe by omission, never listed here
const SAFE_USER_FIELDS = "username uuid email avatar isVerified";

const getReportsFeed = async ({
	limit = 20,
	cursor,
	status,
	order = "desc",
} = {}) => {
	const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
	const sortOrder = order === "asc" ? 1 : -1;
	const filter = {};

	if (status) filter.status = status;

	if (cursor) {
		const decodedCursor = Buffer.from(cursor, "base64").toString("ascii");
		const [cursorTime, cursorId] = decodedCursor.split("_");
		const cursorDate = new Date(cursorTime);
		const op = order === "asc" ? "$gt" : "$lt";

		filter.$and = [
			{
				$or: [
					{ createdAt: { [op]: cursorDate } },
					{ createdAt: cursorDate, _id: { [op]: cursorId } },
				],
			},
		];
	}

	const reports = await Report.find(filter)
		.sort({ createdAt: sortOrder, _id: sortOrder })
		.limit(limitNum + 1)
		.populate("reportedBy", SAFE_USER_FIELDS)
		.populate({ path: "targetId", select: SAFE_USER_FIELDS }) // fine for User targets; harmless extra fields ignored for Track/Comment/Playlist
		.populate("reviewedBy", SAFE_USER_FIELDS)
		.lean();

	const hasNextPage = reports.length > limitNum;
	if (hasNextPage) reports.pop();

	let nextCursor = null;
	if (hasNextPage) {
		const lastItem = reports[reports.length - 1];
		nextCursor = Buffer.from(
			`${lastItem.createdAt.toISOString()}_${lastItem._id}`,
		).toString("base64");
	}

	return {
		data: sanitizeReportData(reports),
		nextCursor,
		hasNextPage,
		count: reports.length,
	};
};

const resolveReport = async ({ uuid, adminId, status, resolutionNote }) => {
	const VALID_STATUSES = ["reviewed", "resolved", "dismissed"];
	if (!VALID_STATUSES.includes(status)) {
		const err = new Error("Invalid status value");
		err.status = 400;
		throw err;
	}

	const report = await Report.findOneAndUpdate(
		{ uuid },
		{
			$set: {
				status,
				reviewedBy: adminId,
				reviewedAt: new Date(),
				resolutionNote: resolutionNote ?? null,
			},
		},
		{ new: true },
	)
		.populate("reportedBy", SAFE_USER_FIELDS)
		.populate({ path: "targetId", select: SAFE_USER_FIELDS })
		.populate("reviewedBy", SAFE_USER_FIELDS);

	if (!report) {
		const err = new Error("Report not found");
		err.status = 404;
		throw err;
	}

	return report;
};

module.exports = { getReportsFeed, resolveReport };
