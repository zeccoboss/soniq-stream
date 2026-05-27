import { buildNode } from "@zecco/utils/dom/build-node.js";
import CreateElement from "@zecco/utils/dom/create-element";

const DEFAULT_COVER = "/src/assets/images/default-profile.png";

/**
 * LibraryMobile — Mobile library view component
 * @async
 * @param {Object} props
 * @param {string} props.state - "loading" | "auth" | "empty" | "content" | "error"
 * @param {Object} props.ctx - Router context (optional)
 * @returns {Promise<Element>} The library section element
 */
export const LibraryMobile = async ({ state, ctx }) => {
	const root = new CreateElement("section");
	root
		.addClass("library-section-mobile", "main-sections")
		.setId("library-section-mobile");

	// ── Header with filter tabs ──
	const header = () =>
		buildNode(`
			<header class="lib-header-mobile">
				<h2 class="lib-page-title">Library</h2>
				<nav class="lib-filter-tabs-mobile" id="lib-filter-tabs-mobile">
					<button class="lib-filter-tab active" data-tab="all">All</button>
					<button class="lib-filter-tab" data-tab="liked">Liked</button>
					<button class="lib-filter-tab" data-tab="upload">upload</button>
					<button class="lib-filter-tab" data-tab="playlists">Playlists</button>
					<button class="lib-filter-tab" data-tab="recent">Recent</button>
				</nav>
			</header>
		`);

	// Auth gate state
	const authGate = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-auth-gate-mobile" data-content="auth">
				<div class="lib-auth-icon">
					<i class="bi bi-collection-play"></i>
				</div>
				<h3 class="lib-auth-title">Your library awaits</h3>
				<p class="lib-auth-sub">Log in to access your liked songs, playlists, and more.</p>
				<div class="lib-auth-btns">
					<a href="/auth/login" class="lib-btn-accent">Login</a>
					<a href="/auth/register" class="lib-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	// Content state
	const contentState = () =>
		buildNode(`
			<section class="lib-sub-section active-sub-section" id="lib-content-mobile" data-content="content">
				<div class="lib-scroll">
					<div class="lib-content">

						<!-- ── Hero cards (mobile: stacked) ── -->
						<div class="lib-hero-cards-mobile" id="lib-hero-cards-mobile">
							<div class="lib-hero-card-mobile" id="lib-hero-liked-mobile">
								<div class="lib-hero-cover lhc-liked"><i class="bi bi-heart-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Liked Songs</p>
									<p class="lib-hero-sub" id="lib-liked-meta-mobile">— songs</p>
								</div>
							</div>
							<div class="lib-hero-card-mobile" id="lib-hero-upload-mobile">
								<div class="lib-hero-cover lhc-upload"><i class="bi bi-cloud-upload-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">My upload</p>
									<p class="lib-hero-sub" id="lib-upload-meta-mobile">— tracks</p>
								</div>
							</div>
							<div class="lib-hero-card-mobile" id="lib-hero-recent-mobile">
								<div class="lib-hero-cover lhc-recent"><i class="bi bi-clock-history"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Recently Played</p>
									<p class="lib-hero-sub" id="lib-recent-meta-mobile">— songs</p>
								</div>
							</div>
						</div>

						<!-- ── Playlists ── -->
						<div id="lib-playlists-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your Playlists</span>
								<button class="lib-sec-link" id="lib-see-all-playlists-mobile">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-playlist-list-mobile" id="lib-playlist-list-mobile">
								<!-- Playlist items injected here -->
							</div>
						</div>

						<!-- ── Liked Songs (mobile: list) ── -->
						<div id="lib-liked-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Liked Songs</span>
								<button class="lib-sec-link" id="lib-see-all-liked-mobile">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list-mobile" id="lib-liked-list-mobile">
								<!-- Track items injected here -->
							</div>
						</div>

						<!-- ── upload (mobile: list) ── -->
						<div id="lib-upload-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your upload</span>
								<button class="lib-sec-link" id="lib-see-all-upload-mobile">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list-mobile" id="lib-upload-list-mobile">
								<!-- Track items injected here -->
							</div>
						</div>

						<!-- ── Recently Played (mobile: list) ── -->
						<div id="lib-recent-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Recently Played</span>
								<button class="lib-sec-link" id="lib-see-all-recent-mobile">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-track-list-mobile" id="lib-recent-list-mobile">
								<!-- Track items injected here -->
							</div>
						</div>

						<!-- ── Following (mobile: list) ── -->
						<div id="lib-following-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Artists You Follow</span>
								<button class="lib-sec-link" id="lib-see-all-artists-mobile">See all <i class="bi bi-arrow-right"></i></button>
							</div>
							<div class="lib-artist-row-mobile" id="lib-artist-row-mobile">
								<!-- Artist items injected here -->
							</div>
						</div>

					</div>
				</div>
			</section>
		`);

	// Empty state
	const emptyState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-empty-mobile" data-content="empty">
				<div class="lib-empty-icon">
					<i class="bi bi-vinyl"></i>
				</div>
				<h3 class="lib-empty-title">Your library is empty</h3>
				<p class="lib-empty-sub">Start liking songs or creating playlists.</p>
				<a href="/search" class="lib-btn-accent">
					<i class="bi bi-search"></i>
					Discover Music
				</a>
			</section>
		`);

	// Loading state
	const loadingState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-loading-mobile" data-content="loading">
				<div class="lib-scroll">
					<div class="lib-content">
						<div class="lib-hero-cards-mobile">
							<div class="lib-hero-card-mobile lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-skeleton lib-skeleton--text-md" style="margin-top:8px"></div>
							</div>
							<div class="lib-hero-card-mobile lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-skeleton lib-skeleton--text-md" style="margin-top:8px"></div>
							</div>
							<div class="lib-hero-card-mobile lib-skeleton-card">
								<div class="lib-skeleton lib-skeleton--cover-sm"></div>
								<div class="lib-skeleton lib-skeleton--text-md" style="margin-top:8px"></div>
							</div>
						</div>
						<div style="margin-top:24px">
							<div class="lib-skeleton lib-skeleton--text-md" style="width:100px;margin-bottom:12px"></div>
							<div class="lib-skeleton lib-skeleton--text-sm" style="margin-bottom:12px"></div>
							<div class="lib-skeleton lib-skeleton--text-sm" style="margin-bottom:12px"></div>
							<div class="lib-skeleton lib-skeleton--text-sm"></div>
						</div>
					</div>
				</div>
			</section>
		`);

	// Error state
	const errorState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-error-mobile" data-content="error">
				<div class="lib-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="lib-error-title">Couldn't load library</h3>
				<p class="lib-error-sub">Check your connection and try again.</p>
				<button class="lib-btn-accent" id="lib-retry-btn-mobile">
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
			default:
				return loadingState();
		}
	};

	root.append(header(), getStateView(state));

	return root.getElement();
};
