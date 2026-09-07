import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import { LIBRARY_SECTIONS } from "./library.helpers.js";

/**
 * LibraryDesktop — Desktop library view component
 * @async
 * @param {Object} props
 * @param {string} props.state - "loading" | "auth" | "empty" | "content" | "error"
 * @param {string|null} props.section - drill-in section from ?section= query,
 *   or null for the overview (hero cards + playlists preview)
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
const LibraryDesktop = async ({ state, section = null, ctx }) => {
	const root = new CreateElement("section");
	root.addClass("library-section", "main-sections").setId("library-section");

	const header = () =>
		buildNode(`
			<header class="lib-header">
				<div class="lib-header-top">
					<h2 class="lib-page-title">Library</h2>
					<div class="lib-header-actions">
						<button class="lib-header-btn" id="lib-new-playlist-btn">
							<i class="bi bi-plus-lg"></i> New Playlist
						</button>
						<button class="lib-header-btn lib-header-btn--icon" id="lib-more-btn">
							<i class="bi bi-three-dots"></i>
						</button>
					</div>
				</div>
				<nav class="lib-filter-tabs" id="lib-filter-tabs">
					<a href="/library" class="lib-filter-tab ${!section ? "active" : ""}">All</a>
					<a href="/library?section=liked" class="lib-filter-tab ${section === "liked" ? "active" : ""}">Liked Songs</a>
					<a href="/library?section=upload" class="lib-filter-tab ${section === "upload" ? "active" : ""}">Uploaded</a>
					<a href="/library?section=playlists" class="lib-filter-tab ${section === "playlists" ? "active" : ""}">Playlists</a>
					<a href="/library?section=following" class="lib-filter-tab ${section === "following" ? "active" : ""}">Following</a>
					<a href="/library?section=recent" class="lib-filter-tab ${section === "recent" ? "active" : ""}">Recently Played</a>
				</nav>
			</header>
		`);

	// ── Overview: hero cards + a playlist preview only — no more stacked full lists ──
	const overviewState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section active-sub-section" id="lib-content" data-content="content">
				<div class="lib-scroll" data-scroll-container>
					<div class="lib-content">

						<div class="lib-hero-cards" id="lib-hero-cards">
							<a href="/library?section=liked" class="lib-hero-card">
								<div class="lib-hero-cover lhc-liked"><i class="bi bi-heart-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Liked Songs</p>
									<p class="lib-hero-sub" id="lib-liked-meta">— songs</p>
								</div>
								<span class="lib-hero-play"><i class="bi bi-chevron-right"></i></span>
							</a>
							<a href="/library?section=upload" class="lib-hero-card">
								<div class="lib-hero-cover lhc-upload"><i class="bi bi-cloud-upload-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">My Uploads</p>
									<p class="lib-hero-sub" id="lib-upload-meta">— tracks</p>
								</div>
								<span class="lib-hero-play"><i class="bi bi-chevron-right"></i></span>
							</a>
							<a href="/library?section=recent" class="lib-hero-card">
								<div class="lib-hero-cover lhc-recent"><i class="bi bi-clock-history"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Recently Played</p>
									<p class="lib-hero-sub" id="lib-recent-meta">— songs</p>
								</div>
								<span class="lib-hero-play"><i class="bi bi-chevron-right"></i></span>
							</a>
							<a href="/library?section=following" class="lib-hero-card">
								<div class="lib-hero-cover lhc-recent"><i class="bi bi-people-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Following</p>
									<p class="lib-hero-sub" id="lib-following-meta">— artists</p>
								</div>
								<span class="lib-hero-play"><i class="bi bi-chevron-right"></i></span>
							</a>
						</div>

						<div id="lib-playlists-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your Playlists</span>
								<a href="/library?section=playlists" class="lib-sec-link">See all <i class="bi bi-arrow-right"></i></a>
							</div>
							<div class="lib-playlist-grid" id="lib-playlist-grid">
								<div class="lib-playlist-card lib-playlist-card--add" id="lib-create-playlist-btn">
									<div class="lib-playlist-cover lib-playlist-cover--add"><i class="bi bi-plus-lg"></i></div>
									<p class="lib-playlist-title" style="color: var(--text-3)">New Playlist</p>
									<p class="lib-playlist-sub">Create</p>
								</div>
							</div>
						</div>

					</div>
				</div>
			</section>
		`);

	// ── Section detail: full content for one category, with a back link ──
	const sectionDetailState = () => {
		const meta = LIBRARY_SECTIONS[section] ?? {
			title: "Library",
			icon: "bi-music-note-list",
		};
		const isPlaylists = section === "playlists";
		const isFollowing = section === "following";

		return buildNode(`
			<section class="lib-sub-section sub-section active-sub-section" id="lib-section-detail" data-content="content">
				<div class="lib-scroll" data-scroll-container>
					<a href="/library" class="lib-back-btn"><i class="bi bi-arrow-left"></i> Library</a>
					<div class="lib-section-detail-head">
						<div class="lib-hero-cover lhc-liked"><i class="bi ${meta.icon}"></i></div>
						<h2 class="lib-page-title">${meta.title}</h2>
					</div>

					${
						isPlaylists
							? `<div class="lib-playlist-grid" id="lib-section-detail-grid"></div>`
							: isFollowing
								? `<div class="lib-artist-row" id="lib-section-detail-artists" style="flex-wrap:wrap"></div>`
								: `<div class="lib-track-list" id="lib-section-detail-list"></div>`
					}
				</div>
			</section>
		`);
	};

	const authGate = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-auth-gate" data-content="auth">
				<div class="lib-auth-icon"><i class="bi bi-collection-play"></i></div>
				<h3 class="lib-auth-title">Your library awaits</h3>
				<p class="lib-auth-sub">
					Log in to access your liked songs, playlists, uploads, and followed artists.
				</p>
				<div class="lib-auth-btns">
					<a href="/auth/login" class="lib-btn-accent">Login</a>
					<a href="/auth/register" class="lib-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const emptyState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-empty" data-content="empty">
				<div class="lib-empty-icon"><i class="bi bi-vinyl"></i></div>
				<h3 class="lib-empty-title">Your library is empty</h3>
				<p class="lib-empty-sub">
					Start liking songs, creating playlists, or following artists to build your library.
				</p>
				<a href="/search" class="lib-btn-accent"><i class="bi bi-search"></i> Discover music</a>
			</section>
		`);

	const loadingState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-loading" data-content="loading">
				<div class="lib-scroll">
					<div class="lib-content">
						<div class="lib-hero-cards">
							${[1, 2, 3]
								.map(
									() => `
								<div class="lib-hero-card lib-skeleton-card">
									<div class="lib-skeleton lib-skeleton--cover-sm"></div>
									<div class="lib-hero-info">
										<div class="lib-skeleton lib-skeleton--text-md"></div>
										<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:6px;width:60%"></div>
									</div>
									<div class="lib-skeleton lib-skeleton--circle-sm"></div>
								</div>
							`,
								)
								.join("")}
						</div>
						<div>
							<div class="lib-skeleton lib-skeleton--text-md" style="width:120px;margin-bottom:12px"></div>
							<div class="lib-playlist-grid">
								${[1, 2, 3, 4]
									.map(
										() => `
									<div class="lib-playlist-card">
										<div class="lib-skeleton lib-skeleton--cover-sq"></div>
										<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:8px"></div>
										<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:50%"></div>
									</div>
								`,
									)
									.join("")}
							</div>
						</div>
					</div>
				</div>
			</section>
		`);

	const errorState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-error" data-content="error">
				<div class="lib-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="lib-error-title">Couldn't load library</h3>
				<p class="lib-error-sub">Something went wrong. Check your connection and try again.</p>
				<button class="lib-btn-accent" id="lib-retry-btn"><i class="bi bi-arrow-clockwise"></i> Try Again</button>
			</section>
		`);

	const getStateView = (state) => {
		switch (state) {
			case "auth":
				return authGate();
			case "empty":
				return emptyState();
			case "content":
				return section ? sectionDetailState() : overviewState();
			case "error":
				return errorState();
			default:
				return loadingState();
		}
	};

	root.append(header(), getStateView(state));
	return root.getElement();
};

export { LibraryDesktop };
