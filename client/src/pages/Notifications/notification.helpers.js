/**
 * notification.helpers.js
 * Pure functions — no DOM, no state. Consumed by both
 * NotificationDesktop/Mobile (rendering) and notification.events.js.
 */

// ── Per-type presentation ────────────────────────────────────
// icon: bootstrap-icons class, si: shared si-* colour token from Settings.styles.css
export const NOTIF_META = {
	follow: { icon: "bi-person-plus-fill", si: "si-blue" },
	like: { icon: "bi-heart-fill", si: "si-pink" },
	upload: { icon: "bi-cloud-upload-fill", si: "si-green" },
	comment: { icon: "bi-chat-fill", si: "si-purple" },
	system: { icon: "bi-bell-fill", si: "si-yellow" },
};

const escapeHtml = (str = "") =>
	str.replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c],
	);

/**
 * Build the display copy for a notification.
 * Actor name is bolded inline via a span the CSS styles — safe because
 * we escape it ourselves rather than trusting raw HTML from the server.
 *
 * @param {Object} n - shaped notification from the API (see notification.controller.js toPublicNotification)
 * @returns {{ icon: string, si: string, html: string }}
 */
export const buildNotificationCopy = (n) => {
	const meta = NOTIF_META[n.type] ?? NOTIF_META.system;
	const actorName = n.actor?.username
		? `<span class="notif-actor">${escapeHtml(n.actor.username)}</span>`
		: "Someone";
	const label = n.target?.label
		? `<span class="notif-target">"${escapeHtml(n.target.label)}"</span>`
		: "your track";

	switch (n.type) {
		case "follow":
			return { ...meta, html: `${actorName} started following you` };
		case "like":
			return { ...meta, html: `${actorName} liked ${label}` };
		case "comment":
			return { ...meta, html: `${actorName} commented on ${label}` };
		case "upload":
			return { ...meta, html: `${actorName} uploaded ${label}` };
		case "system":
		default:
			return { ...meta, html: escapeHtml(n.message ?? "New notification") };
	}
};

/**
 * Compact relative time — "now", "5m", "3h", "2d", then falls back to a date.
 * @param {string|Date} dateInput
 */
export const formatRelativeTime = (dateInput) => {
	const date = new Date(dateInput);
	const diffMs = Date.now() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);

	if (diffSec < 10) return "now";
	if (diffSec < 60) return `${diffSec}s`;

	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m`;

	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h`;

	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d`;

	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
};

/**
 * Where clicking a notification should navigate.
 * Returns null when there's nowhere sensible to go (e.g. system messages).
 * @param {Object} n
 * @returns {string|null}
 */
export const resolveNotificationLink = (n) => {
	if (!n.target?.uuid) return null;
	switch (n.target.type) {
		case "Track":
			return `/track/${n.target.uuid}`;
		case "User":
			return `/profile/${n.target.uuid}`;
		case "Comment":
			return null; // no standalone comment view yet
		case "Playlist":
			return `/playlist/${n.target.uuid}`;
		default:
			return null;
	}
};
