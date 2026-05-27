import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Admin.styles.css";

/**
 * AdminMobile — Mobile admin view
 *
 * Same tabs and data shape as AdminDesktop.
 * Tab nav sits below the header as a horizontal scroll row.
 * Tables collapse into card rows.
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data
 * @returns {Promise<Element>}
 */
export const AdminMobile = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root
		.addClass("admin-section-mobile", "main-sections")
		.setId("admin-section-mobile");

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
			<header class="admin-mob-header">
				<div class="admin-mob-header-top">
					<div class="admin-mob-title-group">
						<div class="admin-badge">
							<i class="bi bi-shield-fill-check"></i> Admin
						</div>
						<h1 class="admin-page-title">Control Panel</h1>
					</div>
				</div>
				<nav class="admin-mob-tabs">
					<a href="/admin?tab=overview"
						class="admin-mob-tab ${!tab || tab === "overview" ? "active" : ""}"
						data-tab="overview">
						<i class="bi bi-grid-1x2"></i> Overview
					</a>
					<a href="/admin?tab=users"
						class="admin-mob-tab ${tab === "users" ? "active" : ""}"
						data-tab="users">
						<i class="bi bi-people"></i> Users
					</a>
					<a href="/admin?tab=tracks"
						class="admin-mob-tab ${tab === "tracks" ? "active" : ""}"
						data-tab="tracks">
						<i class="bi bi-music-note-list"></i> Tracks
					</a>
					<a href="/admin?tab=reports"
						class="admin-mob-tab ${tab === "reports" ? "active" : ""}"
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
			<div class="admin-mob-scroll" data-content="skeleton">
				<!-- Stats grid -->
				<div class="admin-mob-stats-grid">
					${[1, 2, 3, 4]
						.map(
							() => `
						<div class="admin-stat-card admin-sk-card">
							<div class="admin-sk admin-sk--stat-icon-mob"></div>
							<div style="display:flex;flex-direction:column;gap:5px">
								<div class="admin-sk admin-sk--text-sm-mob" style="width:55px"></div>
								<div class="admin-sk admin-sk--text-lg-mob" style="width:45px"></div>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
				<!-- Rows -->
				<div class="admin-mob-sec">
					<div class="admin-sk admin-sk--text-sm-mob" style="width:100px;margin-bottom:12px"></div>
					${[1, 2, 3, 4]
						.map(
							() => `
						<div class="admin-sk-row">
							<div class="admin-sk admin-sk--avatar-mob"></div>
							<div style="flex:1;display:flex;flex-direction:column;gap:5px">
								<div class="admin-sk admin-sk--text-md-mob"></div>
								<div class="admin-sk admin-sk--text-sm-mob" style="width:50%"></div>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</div>
		`);

	// ── Error ────────────────────────────────────────────────
	const errorState = () =>
		buildNode(`
			<div class="admin-mob-scroll admin-state-centered" data-content="error">
				<div class="admin-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="admin-error-title">Couldn't load admin panel</h3>
				<p class="admin-error-sub">Check your connection and try again.</p>
				<button class="admin-retry-btn" id="admin-mob-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Retry
				</button>
			</div>
		`);

	// ── Overview tab ─────────────────────────────────────────
	const overviewTab = () => `
		<div class="admin-tab-view" data-tab="overview">
			<!-- Stats 2x2 grid -->
			<div class="admin-mob-stats-grid">
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--blue">
						<i class="bi bi-people-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Users</span>
						<span class="admin-stat-num">${fmt(platformStats.totalUsers)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--purple">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Tracks</span>
						<span class="admin-stat-num">${fmt(platformStats.totalTracks)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--green">
						<i class="bi bi-play-circle-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Plays</span>
						<span class="admin-stat-num">${fmt(platformStats.totalPlays)}</span>
					</div>
				</div>
				<div class="admin-stat-card">
					<div class="admin-stat-icon admin-stat-icon--yellow">
						<i class="bi bi-lightning-fill"></i>
					</div>
					<div class="admin-stat-body">
						<span class="admin-stat-label">Active</span>
						<span class="admin-stat-num">${fmt(platformStats.activeToday)}</span>
					</div>
				</div>
			</div>

			<!-- Recent signups -->
			<div class="admin-mob-sec">
				<div class="admin-mob-sec-head">
					<span class="admin-panel-title">
						<i class="bi bi-person-plus"></i> Recent Signups
					</span>
					<a href="/admin?tab=users" class="admin-panel-action">
						All <i class="bi bi-arrow-right"></i>
					</a>
				</div>
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
							<span class="admin-user-handle">@${u.username} · ${timeAgo(u.joinedAt)}</span>
						</div>
						<div class="admin-row-actions">
							${
								u.isBanned
									? `<button class="admin-action-btn admin-action-btn--green"
										data-action="unban" data-id="${u.id ?? ""}" title="Unban">
										<i class="bi bi-check-circle"></i>
									</button>`
									: `<button class="admin-action-btn admin-action-btn--red"
										data-action="ban" data-id="${u.id ?? ""}" title="Ban">
										<i class="bi bi-slash-circle"></i>
									</button>`
							}
						</div>
					</div>
				`,
					)
					.join("")}
			</div>
		</div>
	`;

	// ── Users tab ────────────────────────────────────────────
	const usersTab = () => `
		<div class="admin-tab-view" data-tab="users">
			<div class="admin-mob-sec">
				<div class="admin-mob-search-wrap">
					<i class="bi bi-search admin-search-icon"></i>
					<input type="search" class="admin-search-input" id="admin-mob-user-search"
						placeholder="Search username..." />
				</div>
				<div id="admin-mob-users-list">
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
								<span class="admin-user-name">
									${u.displayName ?? u.username}
									${u.isVerified ? `<i class="bi bi-patch-check-fill admin-verified-icon"></i>` : ""}
									${u.isBanned ? `<span class="admin-badge-pill admin-badge-pill--red">Banned</span>` : ""}
								</span>
								<span class="admin-user-handle">@${u.username} · ${timeAgo(u.joinedAt)}</span>
							</div>
							<div class="admin-row-actions">
								<button class="admin-action-btn" data-action="view-user" data-id="${u.id ?? ""}" title="View">
									<i class="bi bi-eye"></i>
								</button>
								<button class="admin-action-btn ${u.isBanned ? "admin-action-btn--green" : "admin-action-btn--red"}"
									data-action="${u.isBanned ? "unban" : "ban"}" data-id="${u.id ?? ""}">
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
			<div class="admin-mob-sec">
				<div class="admin-mob-search-wrap">
					<i class="bi bi-search admin-search-icon"></i>
					<input type="search" class="admin-search-input" id="admin-mob-track-search"
						placeholder="Search track..." />
				</div>
				<div id="admin-mob-tracks-list">
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
								<span class="admin-track-title">
									${t.title}
									${t.flagged ? `<i class="bi bi-flag-fill admin-flag-icon"></i>` : ""}
								</span>
								<span class="admin-track-artist">
									${t.artist ?? "—"} ·
									<i class="bi bi-play-fill"></i> ${fmt(t.plays)} ·
									${timeAgo(t.uploadedAt)}
								</span>
							</div>
							<div class="admin-row-actions">
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
			<div class="admin-mob-sec">
				${
					!reports.length
						? `
					<div class="admin-empty">
						<i class="bi bi-check-circle admin-empty-icon"></i>
						<p class="admin-empty-title">No reports</p>
						<p class="admin-empty-sub">All clear — nothing to review.</p>
					</div>
				`
						: `
					<div id="admin-mob-reports-list">
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
										@${r.reportedBy ?? "unknown"} · ${timeAgo(r.createdAt)}
									</span>
								</div>
								<div class="admin-row-actions">
									<button class="admin-action-btn admin-action-btn--green"
										data-action="dismiss-report" data-id="${r.id ?? ""}" title="Dismiss">
										<i class="bi bi-check-lg"></i>
									</button>
									<button class="admin-action-btn admin-action-btn--red"
										data-action="remove-reported" data-id="${r.targetId ?? ""}" title="Remove">
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
			<div class="admin-mob-scroll" data-content="content">
				${getTabContent()}
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
