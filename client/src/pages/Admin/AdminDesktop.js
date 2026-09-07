import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Admin.styles.css";
import { fmt, initials, getMediaUrl, timeAgo } from "./admin.helpers.js";

/**
 * AdminDesktop — Desktop admin view
 *
 * States: skeleton | content | error
 *
 * Tabs (URL driven via ?tab=overview|users|tracks|reports):
 *   overview → platform-wide stats + recent activity (PREVIEW slices)
 *   users    → full paginated user list, search, ban/unban
 *   tracks   → full paginated track list, moderation, remove, flag
 *   reports  → full paginated flagged content queue
 *
 * IMPORTANT — data source per tab:
 *   overview tab  → recentUsers / recentTracks / recentReports (preview slices)
 *   users tab     → users.list   (full paginated bucket from AdminPage)
 *   tracks tab    → tracks.list  (full paginated bucket from AdminPage)
 *   reports tab   → reports.list (full paginated bucket from AdminPage)
 * These are NOT interchangeable — using the preview slices on the
 * dedicated tabs is what was causing "empty tab after fetch" bugs.
 *
 * Public/private ID convention: every row/action uses `.uuid`
 * (never internal `_id`) for hrefs, data-uuid attrs, and API calls.
 *
 * Data shape:
 *   platformStats   { totalUsers, totalTracks, totalPlays, activeToday }
 *   recentUsers     [{ uuid, username, displayName, avatar, isVerified, isBanned, joinedAt }]
 *   recentTracks    [{ uuid, title, artist, cover, genre, plays, flagged, uploadedAt }]
 *   recentReports   [{ uuid, ... }]
 *   users           { list: [...], nextCursor, hasNextPage }
 *   tracks          { list: [...], nextCursor, hasNextPage }
 *   reports         { list: [...], nextCursor, hasNextPage }
 *
 * `avatar` / `cover` may arrive either as a plain URL string or as a
 * populated object (`{ storage, name, uuid, url }`) depending on the
 * populate chain used server-side — getMediaUrl() normalizes both.
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data
 * @returns {Promise<Element>}
 */
export const AdminDesktop = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root.addClass("admin-section", "main-sections").setId("admin-section");

	const tab = ctx?.query?.tab ?? "overview";
	const {
		platformStats = {},
		recentUsers = [],
		recentTracks = [],
		recentReports = [],
		reports = { list: [] },
		tracks = { list: [] },
		users = { list: [] },
	} = data;

	const usersList = users.list ?? [];
	const tracksList = tracks.list ?? [];
	const reportsList = reports.list ?? [];

	// ── Header ───────────────────────────────────────────────
	const header = () => {
		// On the reports tab we have the real paginated count; everywhere
		// else fall back to the overview preview count. Use `||`, not `??`,
		// since a fetched-but-empty list (0) should still fall back.
		const reportBadgeCount = reportsList.length || recentReports.length;

		return buildNode(`
			<header class="admin-header">
				<div class="admin-header-left">
					<div class="admin-badge">
						<i class="bi bi-shield-fill-check"></i> Admin
					</div>
					<h1 class="admin-page-title">Control Panel</h1>
				</div>
				<nav class="admin-tabs">
					<a href="/admin?tab=overview"
						class="admin-tab ${!tab || tab === "overview" ? "active" : ""}"
						data-tab="overview">
						<i class="bi bi-grid-1x2"></i> Overview
					</a>
					<a href="/admin?tab=users"
						class="admin-tab ${tab === "users" ? "active" : ""}"
						data-tab="users">
						<i class="bi bi-people"></i> Users
					</a>
					<a href="/admin?tab=tracks"
						class="admin-tab ${tab === "tracks" ? "active" : ""}"
						data-tab="tracks">
						<i class="bi bi-music-note-list"></i> Tracks
					</a>
					<a href="/admin?tab=reports"
						class="admin-tab ${tab === "reports" ? "active" : ""}"
						data-tab="reports">
						<i class="bi bi-flag"></i> Reports
						${reportBadgeCount ? `<span class="admin-tab-badge">${reportBadgeCount}</span>` : ""}
					</a>
				</nav>
			</header>
		`);
	};

	// ── Skeleton ─────────────────────────────────────────────
	const skeletonState = () =>
		buildNode(`
			<div class="admin-scroll" data-content="skeleton">
				<div class="admin-scroll-inner">
					<div class="admin-stats-grid">
						${[1, 2, 3, 4]
							.map(
								() => `
							<div class="admin-stat-card admin-sk-card">
								<div class="admin-sk admin-sk--stat-icon"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:6px">
									<div class="admin-sk admin-sk--text-sm" style="width:60%"></div>
									<div class="admin-sk admin-sk--text-lg"></div>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>
					<div class="admin-sk-card-wrap">
						<div class="admin-sk admin-sk--text-sm" style="width:100px;margin-bottom:14px"></div>
						${[1, 2, 3, 4, 5]
							.map(
								() => `
							<div class="admin-sk-row">
								<div class="admin-sk admin-sk--avatar"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:5px">
									<div class="admin-sk admin-sk--text-md"></div>
									<div class="admin-sk admin-sk--text-sm" style="width:45%"></div>
								</div>
								<div class="admin-sk admin-sk--text-sm" style="width:60px"></div>
							</div>
						`,
							)
							.join("")}
					</div>
				</div>
			</div>
		`);

	// ── Error ────────────────────────────────────────────────
	const errorState = () =>
		buildNode(`
			<div class="admin-scroll admin-state-centered" data-content="error">
				<div class="admin-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="admin-error-title">Couldn't load admin panel</h3>
				<p class="admin-error-sub">Check your connection and try again.</p>
				<button class="admin-retry-btn" id="admin-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Retry
				</button>
			</div>
		`);

	// ── Overview tab ─────────────────────────────────────────
	const overviewTab = () => `
		<div class="admin-tab-view admin-desktop-overview" data-tab="overview">

			<!-- Platform stats -->
			<div class="admin-stats-grid">
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--blue">
						<i class="bi bi-people-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Total Users</span>
						<span class="admin-stat-num">${fmt(platformStats.totalUsers)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--purple">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Total Tracks</span>
						<span class="admin-stat-num">${fmt(platformStats.totalTracks)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--green">
						<i class="bi bi-play-circle-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Total Plays</span>
						<span class="admin-stat-num">${fmt(platformStats.totalPlays)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--yellow">
						<i class="bi bi-lightning-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Active Today</span>
						<span class="admin-stat-num">${fmt(platformStats.activeToday)}</span>
					</div>
				</div>
			</div>

			<!-- Recent users (preview slice — NOT the full users.list) -->
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-person-plus"></i> Recent Signups
					</span>
					<a href="/admin?tab=users" class="admin-panel-action">
						View all <i class="bi bi-arrow-right"></i>
					</a>
				</div>
				<div class="admin-user-list">
					${recentUsers
						.slice(0, 5)
						.map((u) => {
							const avatarUrl = getMediaUrl(u.avatar);
							return `
						<div class="admin-user-row" data-uuid="${u.uuid ?? ""}">
							<div class="admin-user-avatar">
								<img src="${avatarUrl || defaultAvatar}" alt="${u.username}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback" style="${avatarUrl ? "" : "display:grid"}">${initials(u.displayName ?? u.username)}</div>
							</div>
							<div class="admin-user-info">
								<span class="admin-user-name">${u.displayName ?? u.username}</span>
								<span class="admin-user-handle">@${u.username}</span>
							</div>
							<div class="admin-user-badges">
								${u.isVerified ? `<span class="admin-badge-pill admin-badge-pill--blue"><i class="bi bi-patch-check-fill"></i> Verified</span>` : ""}
								${u.isBanned ? `<span class="admin-badge-pill admin-badge-pill--red"><i class="bi bi-slash-circle"></i> Banned</span>` : ""}
							</div>
							<span class="admin-user-date">${timeAgo(u.joinedAt)}</span>
							<div class="admin-row-actions">
								<button class="admin-action-btn" data-action="view-user" data-uuid="${u.uuid ?? ""}"
									title="View profile">
									<i class="bi bi-eye"></i>
								</button>
								<button class="admin-action-btn ${u.isBanned ? "admin-action-btn--green" : "admin-action-btn--red"}"
									data-action="${u.isBanned ? "unban" : "ban"}" data-uuid="${u.uuid ?? ""}"
									title="${u.isBanned ? "Unban user" : "Ban user"}">
									<i class="bi bi-${u.isBanned ? "check-circle" : "slash-circle"}"></i>
								</button>
							</div>
						</div>
					`;
						})
						.join("")}
				</div>
			</div>

		</div>
	`;

	// ── Users tab ────────────────────────────────────────────
	// Uses the full paginated `usersList` (users.list), not recentUsers.
	const usersTab = () => `
		<div class="admin-tab-view" data-tab="users">
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-people"></i> All Users
						<span class="admin-count-badge">${usersList.length}</span>
					</span>
					<div class="admin-search-wrap">
						<i class="bi bi-search admin-search-icon"></i>
						<input type="search" class="admin-search-input" id="admin-user-search"
							placeholder="Search username or email..." />
					</div>
				</div>
				<div class="admin-user-list" id="admin-users-list">
					${usersList
						.map((u) => {
							const avatarUrl = getMediaUrl(u.avatar);
							return `
						<div class="admin-user-row" data-uuid="${u.uuid ?? ""}">
							<div class="admin-user-avatar">
								<img src="${avatarUrl || defaultAvatar}" alt="${u.username}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback" style="${avatarUrl ? "" : "display:grid"}">${initials(u.displayName ?? u.username)}</div>
							</div>
							<div class="admin-user-info">
								<span class="admin-user-name">${u.displayName ?? u.username}</span>
								<span class="admin-user-handle">@${u.username}</span>
							</div>
							<div class="admin-user-badges">
								${u.isVerified ? `<span class="admin-badge-pill admin-badge-pill--blue"><i class="bi bi-patch-check-fill"></i></span>` : ""}
								${u.isBanned ? `<span class="admin-badge-pill admin-badge-pill--red"><i class="bi bi-slash-circle"></i> Banned</span>` : ""}
							</div>
							<span class="admin-user-date">${timeAgo(u.joinedAt)}</span>
							<div class="admin-row-actions">
								<button class="admin-action-btn" data-action="view-user" data-uuid="${u.uuid ?? ""}" title="View">
									<i class="bi bi-eye"></i>
								</button>
								<button class="admin-action-btn ${u.isBanned ? "admin-action-btn--green" : "admin-action-btn--red"}"
									data-action="${u.isBanned ? "unban" : "ban"}" data-uuid="${u.uuid ?? ""}"
									title="${u.isBanned ? "Unban" : "Ban"}">
									<i class="bi bi-${u.isBanned ? "check-circle" : "slash-circle"}"></i>
								</button>
								<button class="admin-action-btn admin-action-btn--red"
									data-action="delete-user" data-uuid="${u.uuid ?? ""}" title="Delete">
									<i class="bi bi-trash"></i>
								</button>
							</div>
						</div>
					`;
						})
						.join("")}
				</div>
			</div>
		</div>
	`;

	// ── Tracks tab ───────────────────────────────────────────
	// Uses the full paginated `tracksList` (tracks.list), not recentTracks.
	const tracksTab = () => `
		<div class="admin-tab-view" data-tab="tracks">
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-music-note-list"></i> All Tracks
						<span class="admin-count-badge">${tracksList.length}</span>
					</span>
					<div class="admin-search-wrap">
						<i class="bi bi-search admin-search-icon"></i>
						<input type="search" class="admin-search-input" id="admin-track-search"
							placeholder="Search track or artist..." />
					</div>
				</div>
				<div class="admin-track-list" id="admin-tracks-list">
					${tracksList
						.map((t) => {
							const coverUrl = getMediaUrl(t.cover);
							return `
						<div class="admin-track-row ${t.flagged ? "admin-track-row--flagged" : ""}"
							data-uuid="${t.uuid ?? ""}">
							<div class="admin-track-cover">
								<img src="${coverUrl || defaultAvatar}" alt="${t.title}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback" style="${coverUrl ? "" : "display:grid"}">${initials(t.title)}</div>
							</div>
							<div class="admin-track-info">
								<span class="admin-track-title">${t.title}</span>
								<span class="admin-track-artist">${t.artist ?? "—"}</span>
							</div>
							<span class="admin-genre-badge">${t.genre ?? "—"}</span>
							<span class="admin-track-plays">
								<i class="bi bi-play-fill"></i> ${fmt(t.plays)}
							</span>
							${t.flagged ? `<span class="admin-flag-badge"><i class="bi bi-flag-fill"></i> Flagged</span>` : ""}
							<span class="admin-user-date">${timeAgo(t.uploadedAt)}</span>
							<div class="admin-row-actions">
								<button class="admin-action-btn" data-action="play-track" data-uuid="${t.uuid ?? ""}" title="Play">
									<i class="bi bi-play"></i>
								</button>
								<button class="admin-action-btn admin-action-btn--red"
									data-action="remove-track" data-uuid="${t.uuid ?? ""}" title="Remove">
									<i class="bi bi-trash"></i>
								</button>
							</div>
						</div>
					`;
						})
						.join("")}
				</div>
			</div>
		</div>
	`;

	// ── Reports tab ──────────────────────────────────────────
	const reportsTab = () => `
		<div class="admin-tab-view" data-tab="reports">
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-flag"></i> Flagged Content
						${reportsList.length ? `<span class="admin-count-badge admin-count-badge--red">${reportsList.length}</span>` : ""}
					</span>
				</div>
				${
					!reportsList.length
						? `
					<div class="admin-empty">
						<i class="bi bi-check-circle admin-empty-icon"></i>
						<p class="admin-empty-title">No reports</p>
						<p class="admin-empty-sub">All clear — no flagged content to review.</p>
					</div>
				`
						: `
					<div class="admin-report-list" id="admin-reports-list">
						${reportsList
							.map((r) => {
								// Prefer the public-facing uuid for the reported target.
								// r.targetId (internal _id) is kept only as a fallback until
								// the report DTO is confirmed to always populate targetUuid.
								const targetType = String(
									r.targetType ?? r.type ?? "",
								).toLowerCase();
								const targetRef =
									r.targetUuid ?? r.targetId?.uuid ?? "";
								return `
							<div class="admin-report-row" data-uuid="${r.uuid ?? ""}">
								<div class="admin-report-icon">
									<i class="bi bi-${targetType === "track" ? "music-note" : "person"}"></i>
								</div>
								<div class="admin-report-info">
									<span class="admin-report-title">${r.targetTitle ?? "—"}</span>
									<span class="admin-report-reason">${r.reason ?? "—"}</span>
									<span class="admin-report-meta">
										Reported by @${r.reportedBy ?? "unknown"} · ${timeAgo(r.createdAt)}
									</span>
								</div>
								<div class="admin-row-actions">
									<button class="admin-action-btn" data-action="view-report" data-uuid="${r.uuid ?? ""}" title="View">
										<i class="bi bi-eye"></i>
									</button>
									<button class="admin-action-btn admin-action-btn--green"
										data-action="dismiss-report" data-uuid="${r.uuid ?? ""}" title="Dismiss">
										<i class="bi bi-check-lg"></i>
									</button>
									<button class="admin-action-btn admin-action-btn--red"
										data-action="remove-reported" data-uuid="${targetRef}" data-target-type="${targetType}" title="Remove content">
										<i class="bi bi-trash"></i>
									</button>
								</div>
							</div>
						`;
							})
							.join("")}
					</div>
				`
				}
			</div>
		</div>
	`;

	// ── Pick tab content ──────────────────────────────────────
	const getTabContent = () => {
		switch (tab) {
			case "users":
				return usersTab();
			case "tracks":
				return tracksTab();
			case "reports":
				return reportsTab();
			default:
				return overviewTab();
		}
	};

	// ── Content state ─────────────────────────────────────────
	const contentState = () =>
		buildNode(`
			<div class="admin-scroll" data-content="content">
				<div class="admin-scroll-inner">
					${getTabContent()}
				</div>
			</div>
		`);

	// ── State router ──────────────────────────────────────────
	const getStateView = (s) => {
		switch (s) {
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
