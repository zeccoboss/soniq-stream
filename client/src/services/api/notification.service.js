import { BaseService } from "./base.service.js";
import { ENDPOINTS } from "./endpoints.js";

class NotificationService extends BaseService {
	/**
	 * @param {Object} [opts]
	 * @param {string} [opts.cursor] - ISO date of the last item already seen
	 * @param {number} [opts.limit]
	 * @param {AbortSignal} [opts.signal]
	 */
	getNotifications({ cursor, limit, signal } = {}) {
		return this.get(ENDPOINTS.NOTIFICATIONS.BASE, {
			params: { cursor, limit },
			signal,
		});
	}

	getUnreadCount({ signal } = {}) {
		return this.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, { signal });
	}

	markAsRead(uuid) {
		return this.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(uuid));
	}

	markAllAsRead() {
		return this.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
	}
}

export const notificationService = new NotificationService();
