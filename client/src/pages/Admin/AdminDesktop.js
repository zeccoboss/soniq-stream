import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Admin.styles.css";

/**
 * AdminDesktop — Desktop admin view
 *
 * States: skeleton | content | error
 *
 * Tabs (URL driven via ?tab=overview|users|tracks|reports):
 *   overview → platform-wide stats + recent activity
 *   users    → user list, search, ban/unban
 *   tracks   → track moderation, remove, flag
 *   reports  → flagged content queue
 *
 * Data shape:
 *   tab             string
 *   platformStats   { totalUsers, totalTracks, totalPlays, activeToday }
 *   recentUsers     [{ id, username, displayName, avatar, isVerified, isBanned, joinedAt }]
 *   recentTracks    [{ id, title, artist, cover, genre, plays, flagged, uploadedAt }]
 *   reports         [{ id, type, reason, targetId, targetTitle, reportedBy, createdAt }]
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
		reports = [],
	} = data;

	const fmt = (n = 0) => Number(n).toLocaleString();
	const initials = (str = "?") => str.trim().slice(0, 2).toUpperCase();
	const timeAgo = (dateStr) => {
		if (!dateStr) return "—";
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	};

	// ── Header ───────────────────────────────────────────────
	const header = () =>
		buildNode(`
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
						${reports.length ? `<span class="admin-tab-badge">${reports.length}</span>` : ""}
					</a>
				</nav>
			</header>
		`);

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
		<div class="admin-tab-view" data-tab="overview">

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

			<!-- Recent users -->
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
						.map(
							(u) => `
						<div class="admin-user-row" data-id="${u.id ?? ""}">
							<div class="admin-user-avatar">
								<img src="${u.avatar || defaultAvatar}" alt="${u.username}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback">${initials(u.displayName ?? u.username)}</div>
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
								<button class="admin-action-btn" data-action="view-user" data-id="${u.id ?? ""}"
									title="View profile">
									<i class="bi bi-eye"></i>
								</button>
								<button class="admin-action-btn ${u.isBanned ? "admin-action-btn--green" : "admin-action-btn--red"}"
									data-action="${u.isBanned ? "unban" : "ban"}" data-id="${u.id ?? ""}"
									title="${u.isBanned ? "Unban user" : "Ban user"}">
									<i class="bi bi-${u.isBanned ? "check-circle" : "slash-circle"}"></i>
								</button>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</div>

		</div>
	`;

	// ── Users tab ────────────────────────────────────────────
	const usersTab = () => `
		<div class="admin-tab-view" data-tab="users">
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-people"></i> All Users
						<span class="admin-count-badge">${recentUsers.length}</span>
					</span>
					<div class="admin-search-wrap">
						<i class="bi bi-search admin-search-icon"></i>
						<input type="search" class="admin-search-input" id="admin-user-search"
							placeholder="Search username or email..." />
					</div>
				</div>
				<div class="admin-user-list" id="admin-users-list">
					${recentUsers
						.map(
							(u) => `
						<div class="admin-user-row" data-id="${u.id ?? ""}">
							<div class="admin-user-avatar">
								<img src="${u.avatar || defaultAvatar}" alt="${u.username}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback">${initials(u.displayName ?? u.username)}</div>
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
								<button class="admin-action-btn" data-action="view-user" data-id="${u.id ?? ""}" title="View">
									<i class="bi bi-eye"></i>
								</button>
								<button class="admin-action-btn ${u.isBanned ? "admin-action-btn--green" : "admin-action-btn--red"}"
									data-action="${u.isBanned ? "unban" : "ban"}" data-id="${u.id ?? ""}"
									title="${u.isBanned ? "Unban" : "Ban"}">
									<i class="bi bi-${u.isBanned ? "check-circle" : "slash-circle"}"></i>
								</button>
								<button class="admin-action-btn admin-action-btn--red"
									data-action="delete-user" data-id="${u.id ?? ""}" title="Delete">
									<i class="bi bi-trash"></i>
								</button>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</div>
		</div>
	`;

	// ── Tracks tab ───────────────────────────────────────────
	const tracksTab = () => `
		<div class="admin-tab-view" data-tab="tracks">
			<div class="admin-panel">
				<div class="admin-panel-head">
					<span class="admin-panel-title">
						<i class="bi bi-music-note-list"></i> All Tracks
						<span class="admin-count-badge">${recentTracks.length}</span>
					</span>
					<div class="admin-search-wrap">
						<i class="bi bi-search admin-search-icon"></i>
						<input type="search" class="admin-search-input" id="admin-track-search"
							placeholder="Search track or artist..." />
					</div>
				</div>
				<div class="admin-track-list" id="admin-tracks-list">
					${recentTracks
						.map(
							(t) => `
						<div class="admin-track-row ${t.flagged ? "admin-track-row--flagged" : ""}"
							data-id="${t.id ?? ""}">
							<div class="admin-track-cover">
								<img src="${t.cover || defaultAvatar}" alt="${t.title}"
									class="admin-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
								<div class="admin-avatar-fallback">${initials(t.title)}</div>
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
								<button class="admin-action-btn" data-action="play-track" data-id="${t.id ?? ""}" title="Play">
									<i class="bi bi-play"></i>
								</button>
								<button class="admin-action-btn admin-action-btn--red"
									data-action="remove-track" data-id="${t.id ?? ""}" title="Remove">
									<i class="bi bi-trash"></i>
								</button>
							</div>
						</div>
					`,
						)
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
						${reports.length ? `<span class="admin-count-badge admin-count-badge--red">${reports.length}</span>` : ""}
					</span>
				</div>
				${
					!reports.length
						? `
					<div class="admin-empty">
						<i class="bi bi-check-circle admin-empty-icon"></i>
						<p class="admin-empty-title">No reports</p>
						<p class="admin-empty-sub">All clear — no flagged content to review.</p>
					</div>
				`
						: `
					<div class="admin-report-list" id="admin-reports-list">
						${reports
							.map(
								(r) => `
							<div class="admin-report-row" data-id="${r.id ?? ""}">
								<div class="admin-report-icon">
									<i class="bi bi-${r.type === "track" ? "music-note" : "person"}"></i>
								</div>
								<div class="admin-report-info">
									<span class="admin-report-title">${r.targetTitle ?? "—"}</span>
									<span class="admin-report-reason">${r.reason ?? "—"}</span>
									<span class="admin-report-meta">
										Reported by @${r.reportedBy ?? "unknown"} · ${timeAgo(r.createdAt)}
									</span>
								</div>
								<div class="admin-row-actions">
									<button class="admin-action-btn" data-action="view-report" data-id="${r.id ?? ""}" title="View">
										<i class="bi bi-eye"></i>
									</button>
									<button class="admin-action-btn admin-action-btn--green"
										data-action="dismiss-report" data-id="${r.id ?? ""}" title="Dismiss">
										<i class="bi bi-check-lg"></i>
									</button>
									<button class="admin-action-btn admin-action-btn--red"
										data-action="remove-reported" data-id="${r.targetId ?? ""}" title="Remove content">
										<i class="bi bi-trash"></i>
									</button>
								</div>
							</div>
						`,
							)
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
