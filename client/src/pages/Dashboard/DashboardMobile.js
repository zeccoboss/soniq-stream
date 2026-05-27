import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Dashboard.styles.css";

/**
 * DashboardMobile — Mobile dashboard view
 *
 * Same states and data shape as DashboardDesktop.
 * Vertical stacked layout — no table, track rows instead.
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data
 * @returns {Promise<Element>}
 */
export const DashboardMobile = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root
		.addClass("dash-section-mobile", "main-sections")
		.setId("dash-section-mobile");

	const { user = {}, stats = {}, recentUploads = [], topTrack = null } = data;

	const fmt = (n = 0) => Number(n).toLocaleString();
	const initials = (str = "?") => str.trim().slice(0, 2).toUpperCase();

	// ── Header ───────────────────────────────────────────────
	const header = () =>
		buildNode(`
			<header class="dash-mob-header">
				<div class="dash-mob-header-left">
					<h1 class="dash-page-title">Dashboard</h1>
					<p class="dash-page-sub">Your artist overview</p>
				</div>
				<a href="/upload" class="dash-mob-upload-btn" aria-label="Upload track">
					<i class="bi bi-cloud-upload"></i>
				</a>
			</header>
		`);

	// ── Skeleton ─────────────────────────────────────────────
	const skeletonState = () =>
		buildNode(`
			<div class="dash-mob-scroll" data-content="skeleton">

				<!-- Artist card skeleton -->
				<div class="dash-mob-artist-card dash-sk-card">
					<div class="dash-sk dash-sk--avatar-mob"></div>
					<div style="flex:1;display:flex;flex-direction:column;gap:6px">
						<div class="dash-sk dash-sk--text-lg-mob"></div>
						<div class="dash-sk dash-sk--text-sm-mob" style="width:45%"></div>
					</div>
				</div>

				<!-- Stats grid skeleton -->
				<div class="dash-mob-stats-grid">
					${[1, 2, 3, 4]
						.map(
							() => `
						<div class="dash-stat-card dash-sk-card">
							<div class="dash-sk dash-sk--stat-icon-mob"></div>
							<div style="display:flex;flex-direction:column;gap:5px">
								<div class="dash-sk dash-sk--text-sm-mob" style="width:60px"></div>
								<div class="dash-sk dash-sk--text-lg-mob" style="width:50px"></div>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>

				<!-- Track rows skeleton -->
				<div class="dash-mob-sec">
					<div class="dash-sk dash-sk--text-sm-mob" style="width:100px;margin-bottom:12px"></div>
					${[1, 2, 3, 4]
						.map(
							() => `
						<div class="dash-sk-row">
							<div class="dash-sk dash-sk--track-cover-mob"></div>
							<div style="flex:1;display:flex;flex-direction:column;gap:5px">
								<div class="dash-sk dash-sk--text-md-mob"></div>
								<div class="dash-sk dash-sk--text-sm-mob" style="width:50%"></div>
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
			<div class="dash-mob-scroll dash-state-centered" data-content="error">
				<div class="dash-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="dash-error-title">Couldn't load dashboard</h3>
				<p class="dash-error-sub">Check your connection and try again.</p>
				<button class="dash-retry-btn" id="dash-mob-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Retry
				</button>
			</div>
		`);

	// ── Content ───────────────────────────────────────────────
	const contentState = () =>
		buildNode(`
			<div class="dash-mob-scroll" data-content="content">

				<!-- ── Artist identity card ── -->
				<div class="dash-mob-artist-card">
					<div class="dash-artist-avatar dash-artist-avatar--mob">
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
							${user.plan ?? "Free"}
						</span>
					</div>
					<a href="/profile" class="dash-mob-profile-link" aria-label="View profile">
						<i class="bi bi-chevron-right"></i>
					</a>
				</div>

				<!-- ── Stats grid (2×2) ── -->
				<div class="dash-mob-stats-grid">
					<div class="dash-stat-card">
						<div class="dash-stat-icon dash-stat-icon--blue">
							<i class="bi bi-play-circle-fill"></i>
						</div>
						<div class="dash-stat-body">
							<span class="dash-stat-label">Plays</span>
							<span class="dash-stat-num">${fmt(stats.plays)}</span>
						</div>
					</div>
					<div class="dash-stat-card">
						<div class="dash-stat-icon dash-stat-icon--purple">
							<i class="bi bi-cloud-upload-fill"></i>
						</div>
						<div class="dash-stat-body">
							<span class="dash-stat-label">upload</span>
							<span class="dash-stat-num">${fmt(stats.upload)}</span>
						</div>
					</div>
					<div class="dash-stat-card">
						<div class="dash-stat-icon dash-stat-icon--green">
							<i class="bi bi-people-fill"></i>
						</div>
						<div class="dash-stat-body">
							<span class="dash-stat-label">Followers</span>
							<span class="dash-stat-num">${fmt(stats.followers)}</span>
						</div>
					</div>
					<div class="dash-stat-card">
						<div class="dash-stat-icon dash-stat-icon--red">
							<i class="bi bi-heart-fill"></i>
						</div>
						<div class="dash-stat-body">
							<span class="dash-stat-label">Likes</span>
							<span class="dash-stat-num">${fmt(stats.likes)}</span>
						</div>
					</div>
				</div>

				<!-- ── Top track ── -->
				${
					topTrack
						? `
					<div class="dash-mob-sec">
						<div class="dash-sec-head">
							<span class="dash-sec-title">
								<i class="bi bi-trophy-fill dash-trophy"></i> Top Track
							</span>
						</div>
						<div class="dash-mob-top-card">
							<div class="dash-track-cover dash-track-cover--lg">
								<img
									src="${topTrack.cover || defaultAvatar}"
									alt="${topTrack.title}"
									class="dash-track-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
								/>
								<div class="dash-track-fallback">${initials(topTrack.title)}</div>
							</div>
							<div class="dash-top-info">
								<h3 class="dash-top-title">${topTrack.title}</h3>
								<div class="dash-top-metas">
									<span class="dash-top-meta">
										<i class="bi bi-play-fill"></i> ${fmt(topTrack.plays)}
									</span>
									<span class="dash-top-meta">
										<i class="bi bi-heart-fill"></i> ${fmt(topTrack.likes)}
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

				<!-- ── Recent upload ── -->
				<div class="dash-mob-sec">
					<div class="dash-sec-head">
						<span class="dash-sec-title">
							<i class="bi bi-clock-history"></i> Recent upload
						</span>
						<a href="/library" class="dash-sec-action">
							All <i class="bi bi-arrow-right"></i>
						</a>
					</div>

					${
						!recentUploads.length
							? `
						<div class="dash-empty">
							<i class="bi bi-cloud-upload dash-empty-icon"></i>
							<p class="dash-empty-title">No upload yet</p>
							<p class="dash-empty-sub">Your uploaded tracks will appear here.</p>
							<a href="/upload" class="dash-btn-accent">
								<i class="bi bi-upload"></i> Upload Now
							</a>
						</div>
					`
							: `
						<div class="dash-track-list" id="dash-mob-upload-list">
							${recentUploads
								.map(
									(t) => `
								<div class="dash-track-row" data-id="${t.id ?? ""}">
									<div class="dash-track-cover">
										<img
											src="${t.cover || defaultAvatar}"
											alt="${t.title}"
											class="dash-track-img"
											onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
										/>
										<div class="dash-track-fallback">${initials(t.title)}</div>
									</div>
									<div class="dash-track-meta">
										<span class="dash-track-title">${t.title}</span>
										<div class="dash-track-stats">
											<span class="dash-track-stat">
												<i class="bi bi-play-fill"></i> ${fmt(t.plays)}
											</span>
											<span class="dash-track-stat">
												<i class="bi bi-heart-fill"></i> ${fmt(t.likes)}
											</span>
											<span class="dash-genre-badge">${t.genre ?? "—"}</span>
										</div>
									</div>
									<button class="dash-row-more" data-id="${t.id ?? ""}"
										aria-label="More options">
										<i class="bi bi-three-dots-vertical"></i>
									</button>
								</div>
							`,
								)
								.join("")}
						</div>
					`
					}
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
