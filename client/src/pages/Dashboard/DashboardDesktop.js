import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Dashboard.styles.css";

/**
 * DashboardDesktop — Desktop dashboard view
 *
 * States:
 *   skeleton → initial load
 *   content  → data loaded
 *   error    → failed to fetch
 *
 * Data shape:
 *   user           { username, displayName, avatar, plan }
 *   stats          { plays, upload, followers, likes }
 *   recentUploads  [{ id, title, cover, plays, likes, genre, uploadedAt }]
 *   topTrack       { id, title, cover, plays, likes } | null
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data
 * @returns {Promise<Element>}
 */
export const DashboardDesktop = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root.addClass("dash-section", "main-sections").setId("dash-section");

	const { user = {}, stats = {}, recentUploads = [], topTrack = null } = data;

	// ── Helpers ──────────────────────────────────────────────
	const fmt = (n = 0) => Number(n).toLocaleString();
	const initials = (str = "?") => str.trim().slice(0, 2).toUpperCase();

	// ── Header ───────────────────────────────────────────────
	const header = () =>
		buildNode(`
			<header class="dash-header">
				<div class="dash-header-left">
					<h1 class="dash-page-title">Dashboard</h1>
					<p class="dash-page-sub">Your artist overview</p>
				</div>
				<a href="/upload" class="dash-upload-btn">
					<i class="bi bi-cloud-upload"></i> Upload Track
				</a>
			</header>
		`);

	// ── Skeleton ─────────────────────────────────────────────
	const skeletonState = () =>
		buildNode(`
			<div class="dash-scroll" data-content="skeleton">
				<div class="dash-scroll-inner">
					<!-- Artist card skeleton -->
					<div class="dash-artist-card dash-sk-card">
						<div class="dash-sk dash-sk--avatar"></div>
						<div style="flex:1;display:flex;flex-direction:column;gap:7px">
							<div class="dash-sk dash-sk--text-lg"></div>
							<div class="dash-sk dash-sk--text-sm" style="width:40%"></div>
						</div>
					</div>
					<!-- Stat cards skeleton -->
					<div class="dash-stats-grid">
						${[1, 2, 3, 4]
							.map(
								() => `
							<div class="dash-stat-card dash-sk-card">
								<div class="dash-sk dash-sk--stat-icon"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:6px">
									<div class="dash-sk dash-sk--text-sm" style="width:60%"></div>
									<div class="dash-sk dash-sk--text-lg"></div>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>
					<!-- Table skeleton -->
					<div class="dash-sk-card" style="padding:20px;border-radius:var(--radius-md);background:var(--glass);border:1px solid var(--glass-border)">
						<div class="dash-sk dash-sk--text-sm" style="width:120px;margin-bottom:16px"></div>
						${[1, 2, 3, 4, 5]
							.map(
								() => `
							<div class="dash-sk-row">
								<div class="dash-sk dash-sk--track-cover"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:5px">
									<div class="dash-sk dash-sk--text-md"></div>
									<div class="dash-sk dash-sk--text-sm" style="width:45%"></div>
								</div>
								<div class="dash-sk dash-sk--text-sm" style="width:50px"></div>
								<div class="dash-sk dash-sk--text-sm" style="width:50px"></div>
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
			<div class="dash-scroll dash-state-centered" data-content="error">
				<div class="dash-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="dash-error-title">Couldn't load dashboard</h3>
				<p class="dash-error-sub">Check your connection and try again.</p>
				<button class="dash-retry-btn" id="dash-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Retry
				</button>
			</div>
		`);

	// ── Content ───────────────────────────────────────────────
	const contentState = () =>
		buildNode(`
			<div class="dash-scroll" data-content="content">
				<div class="dash-scroll-inner">

					<!-- ── Artist identity card ── -->
					<div class="dash-artist-card">
						<div class="dash-artist-avatar">
							<img
								src="${user.avatar || defaultAvatar}"
								alt="${user.displayName ?? user.username}"
								class="dash-artist-img"
								onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
							/>
							<div class="dash-artist-fallback">
								${initials(user.displayName ?? user.username ?? "?")}
							</div>
						</div>
						<div class="dash-artist-info">
							<h2 class="dash-artist-name">${user.displayName ?? user.username ?? "—"}</h2>
							<p class="dash-artist-handle">@${user.username ?? "—"}</p>
							<span class="dash-artist-plan dash-plan--${(user.plan ?? "free").toLowerCase()}">
								<i class="bi bi-${user.plan === "Pro" ? "lightning-fill" : "person-fill"}"></i>
								${user.plan ?? "Free"} plan
							</span>
						</div>
						<div class="dash-artist-actions">
							<a href="/profile" class="dash-btn-ghost">
								<i class="bi bi-person"></i> View Profile
							</a>
							<a href="/settings" class="dash-btn-ghost">
								<i class="bi bi-gear"></i> Settings
							</a>
						</div>
					</div>

					<!-- ── Stats grid ── -->
					<div class="dash-stats-grid">
						<div class="dash-stat-card">
							<div class="dash-stat-icon dash-stat-icon--blue">
								<i class="bi bi-play-circle-fill"></i>
							</div>
							<div class="dash-stat-body">
								<span class="dash-stat-label">Total Plays</span>
								<span class="dash-stat-num" id="dash-stat-plays">${fmt(stats.plays)}</span>
							</div>
						</div>
						<div class="dash-stat-card">
							<div class="dash-stat-icon dash-stat-icon--purple">
								<i class="bi bi-cloud-upload-fill"></i>
							</div>
							<div class="dash-stat-body">
								<span class="dash-stat-label">upload</span>
								<span class="dash-stat-num" id="dash-stat-upload">${fmt(stats.upload)}</span>
							</div>
						</div>
						<div class="dash-stat-card">
							<div class="dash-stat-icon dash-stat-icon--green">
								<i class="bi bi-people-fill"></i>
							</div>
							<div class="dash-stat-body">
								<span class="dash-stat-label">Followers</span>
								<span class="dash-stat-num" id="dash-stat-followers">${fmt(stats.followers)}</span>
							</div>
						</div>
						<div class="dash-stat-card">
							<div class="dash-stat-icon dash-stat-icon--red">
								<i class="bi bi-heart-fill"></i>
							</div>
							<div class="dash-stat-body">
								<span class="dash-stat-label">Total Likes</span>
								<span class="dash-stat-num" id="dash-stat-likes">${fmt(stats.likes)}</span>
							</div>
						</div>
					</div>

					<!-- ── Top track highlight ── -->
					${
						topTrack
							? `
						<div class="dash-top-track">
							<div class="dash-sec-head">
								<span class="dash-sec-title">
									<i class="bi bi-trophy-fill dash-trophy"></i> Top Track
								</span>
							</div>
							<div class="dash-top-card">
								<div class="dash-top-cover">
									<img
										src="${topTrack.cover || defaultAvatar}"
										alt="${topTrack.title}"
										class="dash-top-img"
										onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
									/>
									<div class="dash-top-fallback">
										${initials(topTrack.title)}
									</div>
								</div>
								<div class="dash-top-info">
									<h3 class="dash-top-title">${topTrack.title}</h3>
									<div class="dash-top-metas">
										<span class="dash-top-meta">
											<i class="bi bi-play-fill"></i> ${fmt(topTrack.plays)} plays
										</span>
										<span class="dash-top-meta">
											<i class="bi bi-heart-fill"></i> ${fmt(topTrack.likes)} likes
										</span>
									</div>
								</div>
								<a href="/player?track=${topTrack.id}" class="dash-top-play">
									<i class="bi bi-play-fill"></i>
								</a>
							</div>
						</div>
					`
							: ""
					}

					<!-- ── Recent upload table ── -->
					<div class="dash-upload-section">
						<div class="dash-sec-head">
							<span class="dash-sec-title">
								<i class="bi bi-clock-history"></i> Recent upload
							</span>
							<a href="/library" class="dash-sec-action">
								View all <i class="bi bi-arrow-right"></i>
							</a>
						</div>

						${
							!recentUploads.length
								? `
							<div class="dash-empty">
								<i class="bi bi-cloud-upload dash-empty-icon"></i>
								<p class="dash-empty-title">No upload yet</p>
								<p class="dash-empty-sub">Upload your first track to see it here.</p>
								<a href="/upload" class="dash-btn-accent">
									<i class="bi bi-upload"></i> Upload Now
								</a>
							</div>
						`
								: `
							<div class="dash-table">
								<div class="dash-table-head">
									<span class="dash-th" style="flex:1">Track</span>
									<span class="dash-th dash-th--center">Genre</span>
									<span class="dash-th dash-th--right">
										<i class="bi bi-play"></i> Plays
									</span>
									<span class="dash-th dash-th--right">
										<i class="bi bi-heart"></i> Likes
									</span>
									<span class="dash-th dash-th--right">Uploaded</span>
									<span class="dash-th" style="width:32px"></span>
								</div>
								<div class="dash-table-body" id="dash-upload-list">
									${recentUploads
										.map(
											(t) => `
										<div class="dash-table-row" data-id="${t.id ?? ""}">
											<div class="dash-td dash-td--track">
												<div class="dash-track-cover">
													<img
														src="${t.cover || defaultAvatar}"
														alt="${t.title}"
														class="dash-track-img"
														onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
													/>
													<div class="dash-track-fallback">${initials(t.title)}</div>
												</div>
												<span class="dash-track-title">${t.title}</span>
											</div>
											<div class="dash-td dash-td--center">
												<span class="dash-genre-badge">${t.genre ?? "—"}</span>
											</div>
											<div class="dash-td dash-td--right dash-td--num">${fmt(t.plays)}</div>
											<div class="dash-td dash-td--right dash-td--num">${fmt(t.likes)}</div>
											<div class="dash-td dash-td--right dash-td--muted">
												${
													t.uploadedAt
														? new Date(
																t.uploadedAt,
															).toLocaleDateString("en-GB", {
																day: "numeric",
																month: "short",
															})
														: "—"
												}
											</div>
											<div class="dash-td">
												<button class="dash-row-more" data-id="${t.id ?? ""}"
													aria-label="More options">
													<i class="bi bi-three-dots-vertical"></i>
												</button>
											</div>
										</div>
									`,
										)
										.join("")}
								</div>
							</div>
						`
						}
					</div>

				</div>
			</div>
		`);

	// ── State router ─────────────────────────────────────────
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
