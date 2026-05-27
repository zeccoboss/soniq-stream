/** biome-ignore-all assist/source/organizeImports: <explanation> */
import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";

// ── Image path ───────────────────────────────────────────────────────────────
// Swap this for a real cover when available — used as fallback track/playlist art
const DEFAULT_COVER = "/src/assets/images/default-profile.png";

/**
 * LibraryDesktop — Desktop library view component
 * @async
 * @param {Object} props
 * @param {string} props.state - "loading" | "auth" | "empty" | "content" | "error"
 * @param {Object} props.ctx - Router context (optional)
 * @returns {Promise<Element>} The library section element
 */
const LibraryDesktop = async ({ state, ctx }) => {
	const root = new CreateElement("section");
	root.addClass("library-section", "main-sections").setId("library-section");

	// ── Private view factories ───────────────────────────────────────────────

	// Always visible — header with filter tabs
	const header = () =>
		buildNode(`
			<header class="lib-header">
				<div class="lib-header-top">
					<h2 class="lib-page-title">Library</h2>
					<div class="lib-header-actions">
						<button class="lib-header-btn" id="lib-new-playlist-btn">
							<i class="bi bi-plus-lg"></i>
							New Playlist
						</button>
						<button class="lib-header-btn lib-header-btn--icon" id="lib-more-btn">
							<i class="bi bi-three-dots"></i>
						</button>
					</div>
				</div>
				<nav class="lib-filter-tabs" id="lib-filter-tabs">
					<button class="lib-filter-tab active" data-tab="all">All</button>
					<button class="lib-filter-tab" data-tab="liked">Liked Songs</button>
					<button class="lib-filter-tab" data-tab="uploaded">Uploaded</button>
					<button class="lib-filter-tab" data-tab="playlists">Playlists</button>
					<button class="lib-filter-tab" data-tab="following">Following</button>
					<button class="lib-filter-tab" data-tab="recent">Recently Played</button>
				</nav>
			</header>
		`);

	// STATE 1 — not logged in
	const authGate = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-auth-gate" data-content="auth">
				<div class="lib-auth-icon">
					<i class="bi bi-collection-play"></i>
				</div>
				<h3 class="lib-auth-title">Your library awaits</h3>
				<p class="lib-auth-sub">
					Log in to access your liked songs, playlists, upload, and followed artists.
				</p>
				<div class="lib-auth-btns">
					<a href="/auth/login" class="lib-btn-accent">Login</a>
					<a href="/auth/register/step-one" class="lib-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	// STATE 2 — logged in, library loaded
	const contentState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section active-sub-section" id="lib-content" data-content="content">
				<div class="lib-scroll">
					<div class="lib-content">

						<!-- ── Hero cards: Liked / upload / Recent ── -->
						<div class="lib-hero-cards" id="lib-hero-cards">
							<div class="lib-hero-card" id="lib-hero-liked">
								<div class="lib-hero-cover lhc-liked">
									<i class="bi bi-heart-fill"></i>
								</div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Liked Songs</p>
									<p class="lib-hero-sub" id="lib-liked-meta">— songs</p>
								</div>
								<button class="lib-hero-play">
									<i class="bi bi-play-fill"></i>
								</button>
							</div>
							<div class="lib-hero-card" id="lib-hero-upload">
								<div class="lib-hero-cover lhc-upload">
									<i class="bi bi-cloud-upload-fill"></i>
								</div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">My upload</p>
									<p class="lib-hero-sub" id="lib-upload-meta">— tracks</p>
								</div>
								<button class="lib-hero-play">
									<i class="bi bi-play-fill"></i>
								</button>
							</div>
							<div class="lib-hero-card" id="lib-hero-recent">
								<div class="lib-hero-cover lhc-recent">
									<i class="bi bi-clock-history"></i>
								</div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Recently Played</p>
									<p class="lib-hero-sub" id="lib-recent-meta">— songs</p>
								</div>
								<button class="lib-hero-play">
									<i class="bi bi-play-fill"></i>
								</button>
							</div>
						</div>

						<!-- ── Playlists ── -->
						<div id="lib-playlists-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your Playlists</span>
								<button class="lib-sec-link" id="lib-see-all-playlists">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-playlist-grid" id="lib-playlist-grid">
								<!-- Playlist cards injected by render-library.js -->

								<!-- Create new playlist card -->
								<div class="lib-playlist-card lib-playlist-card--add" id="lib-create-playlist-btn">
									<div class="lib-playlist-cover lib-playlist-cover--add">
										<i class="bi bi-plus-lg"></i>
									</div>
									<p class="lib-playlist-title" style="color: var(--text-3)">New Playlist</p>
									<p class="lib-playlist-sub">Create</p>
								</div>
							</div>
						</div>

						<!-- ── Liked Songs table ── -->
						<div id="lib-liked-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Liked Songs</span>
								<button class="lib-sec-link" id="lib-see-all-liked">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list" id="lib-liked-list">
								<!-- Track rows injected by render-library.js -->
							</div>
						</div>

						<!-- ── Uploaded Tracks ── -->
						<div id="lib-upload-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your upload</span>
								<button class="lib-sec-link" id="lib-see-all-upload">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list" id="lib-upload-list">
								<!-- Track rows injected by render-library.js -->
							</div>
						</div>

						<!-- ── Recently Played ── -->
						<div id="lib-recent-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Recently Played</span>
								<button class="lib-sec-link" id="lib-see-all-recent">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list" id="lib-recent-list">
								<!-- Track rows injected by render-library.js -->
							</div>
						</div>

						<!-- ── Following Artists ── -->
						<div id="lib-following-section">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Artists You Follow</span>
								<button class="lib-sec-link" id="lib-see-all-artists">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-artist-row" id="lib-artist-row">
								<!-- Artist chips injected by render-library.js -->
							</div>
						</div>

					</div>
				</div>
			</section>
		`);

	// STATE 3 — empty library (logged in but nothing saved yet)
	const emptyState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-empty" data-content="empty">
				<div class="lib-empty-icon">
					<i class="bi bi-vinyl"></i>
				</div>
				<h3 class="lib-empty-title">Your library is empty</h3>
				<p class="lib-empty-sub">
					Start liking songs, creating playlists, or following artists to build your library.
				</p>
				<a href="/search" class="lib-btn-accent">
					<i class="bi bi-search"></i>
					Discover music
				</a>
			</section>
		`);

	// STATE 4 — skeleton loading
	const loadingState = () =>
		buildNode(`
			<section class="lib-sub-section " id="lib-loading" data-content="loading">
				<div class="lib-scroll">
					<div class="lib-content">

						<!-- skeleton hero cards -->
						<div class="lib-hero-cards">
							<div class="lib-hero-card lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-hero-info">
									<div class="lib-skeleton lib-skeleton--text-md"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:6px;width:60%"></div>
								</div>
								<div class="lib-skeleton lib-skeleton--circle-sm"></div>
							</div>
							<div class="lib-hero-card lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-hero-info">
									<div class="lib-skeleton lib-skeleton--text-md"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:6px;width:50%"></div>
								</div>
								<div class="lib-skeleton lib-skeleton--circle-sm"></div>
							</div>
							<div class="lib-hero-card lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-hero-info">
									<div class="lib-skeleton lib-skeleton--text-md"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:6px;width:55%"></div>
								</div>
								<div class="lib-skeleton lib-skeleton--circle-sm"></div>
							</div>
						</div>

						<!-- skeleton playlist grid -->
						<div>
							<div class="lib-skeleton lib-skeleton--text-md" style="width:120px;margin-bottom:12px"></div>
							<div class="lib-playlist-grid">
								<div class="lib-playlist-card">
									<div class="lib-skeleton lib-skeleton--cover-sq"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:8px"></div>
									<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:50%"></div>
								</div>
								<div class="lib-playlist-card">
									<div class="lib-skeleton lib-skeleton--cover-sq"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:8px"></div>
									<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:50%"></div>
								</div>
								<div class="lib-playlist-card">
									<div class="lib-skeleton lib-skeleton--cover-sq"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:8px"></div>
									<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:50%"></div>
								</div>
								<div class="lib-playlist-card">
									<div class="lib-skeleton lib-skeleton--cover-sq"></div>
									<div class="lib-skeleton lib-skeleton--text-sm" style="margin-top:8px"></div>
									<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:50%"></div>
								</div>
							</div>
						</div>

						<!-- skeleton track rows -->
						<div>
							<div class="lib-skeleton lib-skeleton--text-md" style="width:100px;margin-bottom:12px"></div>
							${[1, 2, 3, 4, 5]
								.map(
									() => `
								<div class="lib-track-row lib-skeleton-row">
									<div class="lib-skeleton lib-skeleton--num"></div>
									<div class="lib-skeleton lib-skeleton--cover-track"></div>
									<div class="lib-track-info">
										<div class="lib-skeleton lib-skeleton--text-sm"></div>
										<div class="lib-skeleton lib-skeleton--text-xs" style="margin-top:4px;width:55%"></div>
									</div>
									<div class="lib-skeleton lib-skeleton--text-xs" style="width:30px;margin-left:auto"></div>
								</div>
							`,
								)
								.join("")}
						</div>

					</div>
				</div>
			</section>
		`);

	// STATE 5 — error loading library
	const errorState = () =>
		buildNode(`
			<section class="lib-sub-section sub-section" id="lib-error" data-content="error">
				<div class="lib-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="lib-error-title">Couldn't load library</h3>
				<p class="lib-error-sub" id="lib-error-msg">
					Something went wrong while fetching your library. Check your connection and try again.
				</p>
				<button class="lib-btn-accent" id="lib-retry-btn">
					<i class="bi bi-arrow-clockwise"></i>
					Try Again
				</button>
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
			case "loading":
				return loadingState();
		}
	};

	root.append(header(), getStateView(state));

	return root.getElement();
};

export { LibraryDesktop };
