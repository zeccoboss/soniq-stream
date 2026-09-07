const Notification = require("../../models/notification.model");

const getUnreadCount = async (userId) =>
	Notification.countDocuments({ recipient: userId, isRead: false });

module.exports = { getUnreadCount };
