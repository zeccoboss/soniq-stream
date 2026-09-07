const Notification = require("../../models/notification.model");

const markAsRead = async ({ userId, uuid }) =>
	Notification.findOneAndUpdate(
		{ uuid, recipient: userId },
		{ isRead: true },
		{ new: true },
	);

const markAllAsRead = async ({ userId }) =>
	Notification.updateMany(
		{ recipient: userId, isRead: false },
		{ isRead: true },
	);

module.exports = { markAsRead, markAllAsRead };
