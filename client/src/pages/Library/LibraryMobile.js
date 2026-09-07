import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import { LIBRARY_SECTIONS } from "./library.helpers.js";

export const LibraryMobile = async ({ state, section = null, ctx }) => {
	const root = new CreateElement("section");
	root
		.addClass("library-section-mobile", "main-sections")
		.setId("library-section-mobile");

	const header = () =>
		buildNode(`
			<header class="lib-header-mobile">
				<h2 class="lib-page-title">Library</h2>
				<nav class="lib-filter-tabs-mobile" id="lib-filter-tabs-mobile">
					<a href="/library" class="lib-filter-tab ${!section ? "active" : ""}">All</a>
					<a href="/library?section=liked" class="lib-filter-tab ${section === "liked" ? "active" : ""}">Liked</a>
					<a href="/library?section=upload" class="lib-filter-tab ${section === "upload" ? "active" : ""}">Uploads</a>
					<a href="/library?section=playlists" class="lib-filter-tab ${section === "playlists" ? "active" : ""}">Playlists</a>
					<a href="/library?section=recent" class="lib-filter-tab ${section === "recent" ? "active" : ""}">Recent</a>
				</nav>
			</header>
		`);

	const overviewState = () =>
		buildNode(`
			<section class="lib-sub-section active-sub-section" id="lib-content-mobile" data-content="content">
				<div class="lib-scroll" data-scroll-container>
					<div class="lib-content">

						<div class="lib-hero-cards-mobile" id="lib-hero-cards-mobile">
							<a href="/library?section=liked" class="lib-hero-card-mobile">
								<div class="lib-hero-cover lhc-liked"><i class="bi bi-heart-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Liked Songs</p>
									<p class="lib-hero-sub" id="lib-liked-meta-mobile">— songs</p>
								</div>
							</a>
							<a href="/library?section=upload" class="lib-hero-card-mobile">
								<div class="lib-hero-cover lhc-upload"><i class="bi bi-cloud-upload-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">My Uploads</p>
									<p class="lib-hero-sub" id="lib-upload-meta-mobile">— tracks</p>
								</div>
							</a>
							<a href="/library?section=recent" class="lib-hero-card-mobile">
								<div class="lib-hero-cover lhc-recent"><i class="bi bi-clock-history"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Recently Played</p>
									<p class="lib-hero-sub" id="lib-recent-meta-mobile">— songs</p>
								</div>
							</a>
							<a href="/library?section=following" class="lib-hero-card-mobile">
								<div class="lib-hero-cover lhc-recent"><i class="bi bi-people-fill"></i></div>
								<div class="lib-hero-info">
									<p class="lib-hero-title">Following</p>
									<p class="lib-hero-sub" id="lib-following-meta-mobile">— artists</p>
								</div>
							</a>
						</div>

						<div id="lib-playlists-section-mobile">
							<div class="lib-sec-head">
								<span class="lib-sec-title">Your Playlists</span>
								<a href="/library?section=playlists" class="lib-sec-link">See all <i class="bi bi-arrow-right"></i></a>
							</div>
							<div class="lib-playlist-list-mobile" id="lib-playlist-list-mobile"></div>
						</div>

					</div>
				</div>
			</section>
		`);

	const sectionDetailState = () => {
		const meta = LIBRARY_SECTIONS[section] ?? {
			title: "Library",
			icon: "bi-music-note-list",
		};
		const isPlaylists = section === "playlists";
		const isFollowing = section === "following";

		return buildNode(`
			<section class="lib-sub-section active-sub-section" id="lib-section-detail-mobile" data-content="content">
				<div class="lib-scroll" data-scroll-container>
					<a href="/library" class="lib-back-btn"><i class="bi bi-arrow-left"></i> Library</a>
					<div class="lib-section-detail-head">
						<div class="lib-hero-cover lhc-liked"><i class="bi ${meta.icon}"></i></div>
						<h2 class="lib-page-title">${meta.title}</h2>
					</div>

					${
						isPlaylists
							? `<div class="lib-playlist-list-mobile" id="lib-section-detail-list-mobile"></div>`
							: isFollowing
								? `<div class="lib-artist-row-mobile" id="lib-section-detail-artists-mobile" style="flex-wrap:wrap"></div>`
								: `<div class="lib-track-list-mobile" id="lib-section-detail-list-mobile"></div>`
					}
				</div>
			</section>
		`);
	};

	const authGate = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-auth-gate-mobile" data-content="auth">
				<div class="lib-auth-icon"><i class="bi bi-collection-play"></i></div>
				<h3 class="lib-auth-title">Your library awaits</h3>
				<p class="lib-auth-sub">Log in to access your liked songs, playlists, and more.</p>
				<div class="lib-auth-btns">
					<a href="/auth/login" class="lib-btn-accent">Login</a>
					<a href="/auth/register" class="lib-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const emptyState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-empty-mobile" data-content="empty">
				<div class="lib-empty-icon"><i class="bi bi-vinyl"></i></div>
				<h3 class="lib-empty-title">Your library is empty</h3>
				<p class="lib-empty-sub">Start liking songs or creating playlists.</p>
				<a href="/search" class="lib-btn-accent"><i class="bi bi-search"></i> Discover Music</a>
			</section>
		`);

	const loadingState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-loading-mobile" data-content="loading">
				<div class="lib-scroll">
					<div class="lib-content">
						<div class="lib-hero-cards-mobile">
							${[1, 2, 3]
								.map(
									() => `
								<div class="lib-hero-card-mobile lib-skeleton-card">
									<div class="lib-skeleton lib-skeleton--cover-sm"></div>
									<div class="lib-skeleton lib-skeleton--text-md" style="margin-top:8px"></div>
								</div>
							`,
								)
								.join("")}
						</div>
					</div>
				</div>
			</section>
		`);

	const errorState = () =>
		buildNode(`
			<section class="lib-sub-section" id="lib-error-mobile" data-content="error">
				<div class="lib-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="lib-error-title">Couldn't load library</h3>
				<p class="lib-error-sub">Check your connection and try again.</p>
				<button class="lib-btn-accent" id="lib-retry-btn-mobile"><i class="bi bi-arrow-clockwise"></i> Try Again</button>
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
