import { notificationService } from "@zecco/services/api/notification.service.js";
import { router } from "@zecco/routes/router.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { resolveNotificationLink } from "./notification.helpers.js";

/**
 * notificationEvents — wires interactions for both Desktop and Mobile views.
 * Delegated listeners on `root` so they survive re-renders without rebinding.
 *
 * @param {Element} root
 * @param {Object} ctx
 * @param {Array}   ctx.notifications
 * @param {Function} ctx.setState           - (state, extra?) => void, re-renders
 * @param {Function} ctx.updateNotification - (uuid, patch) => void, local state mutation
 * @param {Function} ctx.loadMore           - () => Promise<void>
 * @param {boolean}  ctx.hasNextPage
 * @param {boolean}  ctx.isLoadingMore
 */
export const notificationEvents = (
	root,
	{
		notifications,
		setState,
		updateNotification,
		loadMore,
		hasNextPage,
		isLoadingMore,
	},
) => {
	// ── Mark all as read ─────────────────────────────────────
	const markAllBtn = root.querySelector("[data-notif-mark-all]");
	markAllBtn?.addEventListener("click", async () => {
		markAllBtn.disabled = true;
		try {
			await notificationService.markAllAsRead();
			notifications.forEach((n) => {
				updateNotification(n.uuid, { isRead: true });
			});
		} catch (err) {
			toast({
				message: err.message || "Couldn't mark notifications as read.",
				type: "error",
			});
		} finally {
			markAllBtn.disabled = false;
		}
	});

	// ── Click a notification row ─────────────────────────────
	root.querySelectorAll("[data-notif-uuid]").forEach((row) => {
		row.addEventListener("click", async () => {
			const uuid = row.dataset.notifUuid;
			const notif = notifications.find((n) => n.uuid === uuid);
			if (!notif) return;

			if (!notif.isRead) {
				updateNotification(uuid, { isRead: true }); // optimistic
				notificationService.markAsRead(uuid).catch(() => {
					updateNotification(uuid, { isRead: false }); // revert on failure
				});
			}

			const link = resolveNotificationLink(notif);
			if (link) router.navigate(link);
		});
	});

	// ── Load more ─────────────────────────────────────────────
	const loadMoreBtn = root.querySelector("[data-notif-load-more]");
	loadMoreBtn?.addEventListener("click", async () => {
		if (isLoadingMore) return;
		await loadMore();
	});

	// ── Retry (error state) ───────────────────────────────────
	root.querySelector("[data-notif-retry]")?.addEventListener("click", () => {
		setState("skeleton");
	});
};
