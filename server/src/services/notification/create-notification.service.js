const Notification = require("../../models/notification.model");

/**
 * Create a notification. No-ops if recipient === actor
 * (never notify a user about their own action).
 *
 * @param {Object} params
 * @param {string} params.recipient
 * @param {string} [params.actor]
 * @param {"follow"|"like"|"upload"|"comment"|"system"} params.type
 * @param {"Track"|"User"|"Comment"|"Playlist"} [params.targetType]
 * @param {string} [params.targetId]
 * @param {string} [params.message]
 */
const createNotification = async ({
	recipient,
	actor = null,
	type,
	targetType = null,
	targetId = null,
	message = null,
}) => {
	if (!recipient || !type) {
		console.error("[Notification]: recipient and type are required.");
		return null;
	}
	if (actor && String(actor) === String(recipient)) return null;

	return Notification.create({
		recipient,
		actor,
		type,
		targetType,
		targetId,
		message,
	});
};

module.exports = { createNotification };
