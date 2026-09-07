const { createNotification } = require("./create-notification.service");
const { getNotifications } = require("./get-notifications.service");
const { markAsRead, markAllAsRead } = require("./mark-read.service");
const { getUnreadCount } = require("./unread-count.service");

module.exports = {
	createNotification,
	getNotifications,
	markAsRead,
	markAllAsRead,
	getUnreadCount,
};
