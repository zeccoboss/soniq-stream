const {
	createNotification,
	getNotifications,
	markAsRead,
	markAllAsRead,
	getUnreadCount,
} = require("../../services/notification");

// Never leak Mongo _id — actor/target are shaped down to uuid + display fields.
const toPublicNotification = (n) => ({
	uuid: n.uuid,
	type: n.type,
	message: n.message,
	isRead: n.isRead,
	createdAt: n.createdAt,
	actor: n.actor
		? {
				uuid: n.actor.uuid,
				username: n.actor.username,
				avatar: n.actor.avatar ?? null,
			}
		: null,
	target: n.targetId
		? {
				type: n.targetType,
				uuid: n.targetId.uuid,
				label:
					n.targetId.title ??
					n.targetId.name ??
					n.targetId.username ??
					n.targetId.content?.slice(0, 60) ??
					null,
			}
		: null,
});

const getMyNotifications = async (req, res) => {
	try {
		const { cursor, limit } = req.query;
		const { notifications, nextCursor } = await getNotifications({
			userId: req.user._id,
			cursor,
			limit: limit ? Number(limit) : undefined,
		}).populate({
			path: "targetId",
			select: "uuid title name username content",
		});
		res.status(200).json({
			success: true,
			data: notifications.map(toPublicNotification),
			nextCursor,
		});
	} catch (err) {
		console.error("[Notification]: getMyNotifications failed:", err);
		res.status(500).json({
			success: false,
			message: "Failed to load notifications.",
		});
	}
};

const getMyUnreadCount = async (req, res) => {
	try {
		const count = await getUnreadCount(req.user._id);
		res.status(200).json({ success: true, data: { count } });
	} catch (err) {
		console.error("[Notification]: getMyUnreadCount failed:", err);
		res.status(500).json({
			success: false,
			message: "Failed to load unread count.",
		});
	}
};

const readNotification = async (req, res) => {
	try {
		const updated = await markAsRead({
			userId: req.user._id,
			uuid: req.params.uuid,
		});
		if (!updated) {
			return res
				.status(404)
				.json({ success: false, message: "Notification not found." });
		}
		res.status(200).json({
			success: true,
			data: toPublicNotification(updated),
		});
	} catch (err) {
		console.error("[Notification]: readNotification failed:", err);
		res.status(500).json({
			success: false,
			message: "Failed to update notification.",
		});
	}
};

const readAllNotifications = async (req, res) => {
	try {
		await markAllAsRead({ userId: req.user._id });
		res.status(200).json({ success: true });
	} catch (err) {
		console.error("[Notification]: readAllNotifications failed:", err);
		res.status(500).json({
			success: false,
			message: "Failed to update notifications.",
		});
	}
};

module.exports = {
	getMyNotifications,
	getMyUnreadCount,
	readNotification,
	readAllNotifications,
	createNotification, // re-exported so other controllers can trigger notifications directly
};
