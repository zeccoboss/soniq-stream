const Notification = require("../../models/notification.model");

/**
 * Cursor-paginated list, newest first.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.cursor] - createdAt ISO of the last item already seen
 * @param {number} [params.limit=20]
 */
const getNotifications = async ({ userId, cursor, limit = 20 }) => {
	const query = { recipient: userId };
	if (cursor) query.createdAt = { $lt: new Date(cursor) };

	const notifications = await Notification.find(query)
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate({ path: "actor", select: "uuid username avatar" })
		.populate({ path: "targetId", select: "uuid title name username" }) // resolves via refPath
		.lean();

	const nextCursor =
		notifications.length === limit
			? notifications[notifications.length - 1].createdAt
			: null;

	return { notifications, nextCursor };
};

module.exports = { getNotifications };
