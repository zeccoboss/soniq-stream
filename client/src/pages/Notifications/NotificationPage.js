import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { NotificationDesktop } from "./NotificationDesktop.js";
import { NotificationMobile } from "./NotificationMobile.js";
import { notificationEvents } from "./notification.events.js";
import { notificationService } from "@zecco/services/api/notification.service.js";
import { store } from "@zecco/store/index.js";

const POLL_INTERVAL_MS = 30_000;

/**
 * NotificationPage — orchestrator
 *
 * Route: /notifications (outlet: "main")
 *
 * State machine:
 *   skeleton → initial fetch in flight
 *   auth     → not logged in
 *   empty    → logged in, zero notifications
 *   content  → has notifications
 *   error    → fetch failed
 *
 * Polling: while the tab is visible, re-fetch the first page every 30s
 * to catch new notifications without a hard refresh. Paused via the
 * Page Visibility API so it doesn't run in background tabs.
 *
 * @async
 * @param {Object} ctx - Router context
 * @returns {Promise<Element>}
 */
export const NotificationPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "notification-page-root";

	let state = "skeleton";
	let notifications = [];
	let nextCursor = null;
	let isLoadingMore = false;
	let isMounted = true;
	let pollTimer = null;

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? NotificationMobile : NotificationDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({
			state,
			notifications,
			hasNextPage: !!nextCursor,
			isLoadingMore,
			ctx,
		});
		root.replaceChildren(view);
		notificationEvents(root, {
			notifications,
			setState,
			updateNotification,
			loadMore,
			hasNextPage: !!nextCursor,
			isLoadingMore,
		});
	};

	const setState = async (newState) => {
		state = newState;
		if (newState === "skeleton") await fetchInitial();
		else await render();
	};

	// ── Local state mutation (optimistic mark-as-read) ────────
	const updateNotification = (uuid, patch) => {
		const idx = notifications.findIndex((n) => n.uuid === uuid);
		if (idx === -1) return;
		notifications[idx] = { ...notifications[idx], ...patch };
		render();
	};

	// ── Data fetching ──────────────────────────────────────────
	const fetchInitial = async () => {
		state = "skeleton";
		await render();

		try {
			const res = await notificationService.getNotifications({ limit: 20 });
			if (!isMounted) return;

			notifications = res?.data ?? [];
			nextCursor = res?.nextCursor ?? null;
			state = notifications.length ? "content" : "empty";
		} catch (err) {
			if (!isMounted) return;
			state = "error";
		}
		await render();
	};

	const loadMore = async () => {
		if (!nextCursor || isLoadingMore) return;
		isLoadingMore = true;
		await render();

		try {
			const res = await notificationService.getNotifications({
				cursor: nextCursor,
				limit: 20,
			});
			if (!isMounted) return;

			notifications = [...notifications, ...(res?.data ?? [])];
			nextCursor = res?.nextCursor ?? null;
		} catch {
			// Load-more failures are silent — the button just stays available to retry.
		} finally {
			isLoadingMore = false;
			if (isMounted) await render();
		}
	};

	// ── Background poll for new notifications ──────────────────
	// Refreshes the first page only, while the tab is visible.
	// Preserves already-read local state for items still present.
	const pollForNew = async () => {
		if (document.hidden || state === "error") return;
		try {
			const res = await notificationService.getNotifications({ limit: 20 });
			if (!isMounted || !res?.data) return;

			const readMap = new Map(notifications.map((n) => [n.uuid, n.isRead]));
			notifications = res.data.map((n) => ({
				...n,
				isRead: readMap.has(n.uuid)
					? readMap.get(n.uuid) || n.isRead
					: n.isRead,
			}));
			nextCursor = res.nextCursor ?? null;
			state = notifications.length ? "content" : "empty";
			await render();
		} catch {
			// Silent — a failed background poll shouldn't disrupt the page.
		}
	};

	const startPolling = () => {
		pollTimer = setInterval(pollForNew, POLL_INTERVAL_MS);
	};

	// ── Boot ─────────────────────────────────────────────────
	if (!store.isLoggedIn) {
		state = "auth";
		await render();
	} else {
		await fetchInitial();
		startPolling();
	}

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		if (pollTimer) clearInterval(pollTimer);
	};

	return root;
};
