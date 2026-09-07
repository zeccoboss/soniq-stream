import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import {
	buildNotificationCopy,
	formatRelativeTime,
} from "./notification.helpers.js";
import "./Notification.styles.css";

/**
 * NotificationDesktop — Desktop notifications view
 *
 * @async
 * @param {Object} props
 * @param {string} props.state - "skeleton" | "auth" | "empty" | "content" | "error"
 * @param {Array}  props.notifications
 * @param {boolean} props.hasNextPage
 * @param {boolean} props.isLoadingMore
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const NotificationDesktop = async ({
	state,
	notifications = [],
	hasNextPage = false,
	isLoadingMore = false,
	ctx,
}) => {
	const root = new CreateElement("section");
	root
		.addClass("notif-section", "main-sections")
		.setId("notification-section");

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const header = () =>
		buildNode(`
			<header class="notif-header">
				<div>
					<h2 class="notif-title">Notifications</h2>
					<p class="notif-sub">${unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
				</div>
				${
					unreadCount > 0
						? `<button class="notif-mark-all-btn" data-notif-mark-all>
							<i class="bi bi-check2-all"></i> Mark all as read
						</button>`
						: ""
				}
			</header>
		`);

	const row = (n) => {
		const { icon, si, html } = buildNotificationCopy(n);
		return `
			<div class="notif-item ${n.isRead ? "" : "notif-item--unread"}" data-notif-uuid="${n.uuid}">
				<div class="notif-item-icon ${si}"><i class="bi ${icon}"></i></div>
				<div class="notif-item-avatar">
					<img src="${n.actor?.avatar?.storage?.baseUrl ?? defaultAvatar}" alt="" onerror="this.src='${defaultAvatar}'" />
				</div>
				<div class="notif-item-body">
					<p class="notif-item-text">${html}</p>
					<span class="notif-item-time">${formatRelativeTime(n.createdAt)}</span>
				</div>
				${n.isRead ? "" : `<span class="notif-unread-dot" aria-hidden="true"></span>`}
			</div>
		`;
	};

	const contentState = () =>
		buildNode(`
			<section class="notif-sub-section" id="notif-content" data-content="content">
				<div class="notif-list">
					${notifications.map(row).join("")}
				</div>
				${
					hasNextPage
						? `<button class="notif-load-more-btn" data-notif-load-more ${isLoadingMore ? "disabled" : ""}>
							${isLoadingMore ? "Loading..." : "Load more"}
						</button>`
						: ""
				}
			</section>
		`);

	const emptyState = () =>
		buildNode(`
			<section class="notif-sub-section notif-sub-section--centered" id="notif-empty" data-content="empty">
				<div class="notif-empty-icon"><i class="bi bi-bell-slash"></i></div>
				<h3 class="notif-empty-title">Nothing here yet</h3>
				<p class="notif-empty-sub">
					When people follow you, like or comment on your tracks, you'll see it here.
				</p>
			</section>
		`);

	const authGate = () =>
		buildNode(`
			<section class="notif-sub-section notif-sub-section--centered" id="notif-auth" data-content="auth">
				<div class="notif-auth-icon"><i class="bi bi-bell-fill"></i></div>
				<h3 class="notif-auth-title">Stay in the loop</h3>
				<p class="notif-auth-sub">Log in to see your notifications.</p>
				<div class="notif-auth-btns">
					<a href="/auth/login" class="notif-btn-accent">Login</a>
					<a href="/auth/register" class="notif-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const errorState = () =>
		buildNode(`
			<section class="notif-sub-section notif-sub-section--centered" id="notif-error" data-content="error">
				<div class="notif-error-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
				<h3 class="notif-error-title">Something went wrong</h3>
				<p class="notif-error-sub">We couldn't load your notifications.</p>
				<button class="notif-btn-accent" data-notif-retry>Try Again</button>
			</section>
		`);

	const skeletonState = () =>
		buildNode(`
			<section class="notif-sub-section" id="notif-skeleton" data-content="skeleton">
				<div class="notif-list">
					${[1, 2, 3, 4, 5, 6]
						.map(
							() => `
						<div class="notif-item" style="pointer-events:none">
							<div class="notif-sk notif-sk--icon"></div>
							<div class="notif-sk notif-sk--avatar"></div>
							<div style="flex:1;display:flex;flex-direction:column;gap:6px">
								<div class="notif-sk notif-sk--text-lg"></div>
								<div class="notif-sk notif-sk--text-sm" style="width:60px"></div>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</section>
		`);

	const getStateView = (state) => {
		switch (state) {
			case "auth":
				return authGate();
			case "empty":
				return emptyState();
			case "content":
				return contentState();
			case "error":
				return errorState();
			default:
				return skeletonState();
		}
	};

	root.append(header(), getStateView(state));
	return root.getElement();
};
