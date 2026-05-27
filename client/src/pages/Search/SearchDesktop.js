import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Search.styles.css";

// ── Genre data ───────────────────────────────────────────────
// Single source — drives both default browse grid and no-results grid
export const GENRES = [
	{ name: "Afrobeats", icon: "bi-music-note", cls: "gc-afrobeats" },
	// { name: "Highlife", icon: "bi-music", cls: "gc-highlife" },
	{ name: "Amapiano", icon: "bi-disc", cls: "gc-amapiano" },
	{ name: "Gospel", icon: "bi-hand-thumbs-up", cls: "gc-gospel" },
	{ name: "Hip-Hop", icon: "bi-mic", cls: "gc-hiphop" },
	{ name: "Afropop", icon: "bi-megaphone", cls: "gc-afropop" },
	{ name: "R&B", icon: "bi-headphones", cls: "gc-rnb" },
	{ name: "Reggae", icon: "bi-flower1", cls: "gc-reggae" },
	{ name: "Jazz", icon: "bi-music-note-beamed", cls: "gc-jazz" },
	{ name: "Electronic", icon: "bi-lightning-fill", cls: "gc-electronic" },
	{ name: "Classical", icon: "bi-music-note-beamed", cls: "gc-classical" },
	{ name: "Rock", icon: "bi-fire", cls: "gc-rock" },
];

const genreGrid = () =>
	GENRES.map(
		(g) => `
		<button class="srch-genre-card ${g.cls}" data-genre="${g.name}">
			<i class="bi ${g.icon} srch-genre-icon"></i>
			<span class="srch-genre-label">${g.name}</span>
		</button>
	`,
	).join("");

/**
 * SearchDesktop — Desktop search view component
 *
 * States:
 *   default    → idle, shows genre browse + optional auth banner
 *   results    → tracks / artists / playlists returned
 *   no-results → query returned nothing
 *   skeleton   → fetching results
 *   error      → network failure
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data - { query, isLoggedIn, results }
 * @returns {Promise<Element>}
 */
export const SearchDesktop = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root.addClass("search-section", "main-sections").setId("search-section");

	const { query = "", isLoggedIn = false, filter = "all" } = data;
	const activeFilter = ["all", "tracks", "artists", "genres"].includes(filter)
		? filter
		: "all";

	// ── Always visible — sticky header ───────────────────────
	const header = () =>
		buildNode(`
			<header class="srch-header">
				<div class="srch-header-top">
					<h2 class="srch-page-title">Search</h2>
					<div class="srch-input-wrap">
						<i class="bi bi-search srch-input-icon"></i>
						<input
							type="search"
							id="search-input"
							class="srch-input ${query ? "active" : ""}"
							placeholder="Songs, artists, genres..."
							value="${query}"
							autocomplete="off"
							spellcheck="false"
						/>
						<button class="srch-clear-btn" id="srch-clear-btn"
							aria-label="Clear" ${!query ? "hidden" : ""}>
							<i class="bi bi-x-circle-fill"></i>
						</button>
					</div>
				</div>
				<div class="srch-chips" id="srch-chips">
					<button class="srch-chip ${activeFilter === "all" ? "active" : ""}" data-filter="all">All</button>
					<button class="srch-chip ${activeFilter === "tracks" ? "active" : ""}" data-filter="tracks">
						<i class="bi bi-music-note"></i> Tracks
					</button>
					<button class="srch-chip" data-filter="artists">
						<i class="bi bi-person"></i> Artists
					</button>
					<button class="srch-chip ${activeFilter === "genres" ? "active" : ""}" data-filter="genres">
						<i class="bi bi-grid"></i> Genres
					</button>
				</div>
			</header>
		`);

	// STATE 1 — idle default
	const defaultState = () =>
		buildNode(`
			<section class="srch-state" id="srch-default" data-content="default">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						${
							!isLoggedIn
								? `
							<div class="srch-auth-banner" id="srch-auth-banner">
								<div class="srch-auth-banner-left">
									<div class="srch-auth-banner-icon">
										<i class="bi bi-lock"></i>
									</div>
									<div>
										<p class="srch-auth-banner-title">Get more from search</p>
										<p class="srch-auth-banner-sub">
											Log in to see recent searches, personalised results and follow artists.
										</p>
									</div>
								</div>
								<div class="srch-auth-banner-btns">
									<a href="/auth/login" class="srch-btn-accent-sm">Login</a>
									<a href="/auth/register" class="srch-btn-ghost-sm">Sign up</a>
								</div>
							</div>
						`
								: `
							<div class="srch-recent" id="srch-recent">
								<div class="srch-sec-head">
									<span class="srch-sec-title">Recent Searches</span>
									<button class="srch-sec-action" id="srch-clear-recent">Clear all</button>
								</div>
								<div class="srch-recent-list" id="srch-recent-list">
									<!-- injected by search.events.js -->
								</div>
							</div>
						`
						}

						<div>
							<div class="srch-sec-head">
								<span class="srch-sec-title">
									<i class="bi bi-grid-3x3-gap"></i> Browse Genres
								</span>
							</div>
							<div class="srch-genre-grid" id="srch-genre-grid">
								${genreGrid()}
							</div>
						</div>

					</div>
				</div>
			</section>
		`);

	// STATE 2 — results
	const resultsState = () =>
		buildNode(`
			<section class="srch-state" id="srch-results" data-content="results">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						<p class="srch-result-meta" id="srch-result-meta">
							Results for <span id="srch-result-query">${query}</span>
						</p>

						<!-- Top result -->
						<div id="srch-top-result">
							<div class="srch-sec-head">
								<span class="srch-sec-title">Top Result</span>
							</div>
							<div class="srch-top-card" id="srch-top-card">
								<div class="srch-top-cover" id="srch-top-cover">
									<img src="" alt="" class="srch-top-cover-img" id="srch-top-cover-img" />
								</div>
								<div class="srch-top-info">
									<span class="srch-top-type" id="srch-top-type">Track</span>
									<p class="srch-top-title" id="srch-top-title">—</p>
									<p class="srch-top-sub" id="srch-top-sub">—</p>
								</div>
								<button class="srch-top-play" id="srch-top-play">
									<i class="bi bi-play-fill"></i>
								</button>
							</div>
						</div>

						<!-- Tracks -->
						<div id="srch-tracks-section">
							<div class="srch-sec-head">
								<span class="srch-sec-title">
									<i class="bi bi-music-note-beamed"></i> Tracks
								</span>
								<button class="srch-sec-action" id="srch-see-all-tracks">
									See all <i class="bi bi-arrow-right"></i>
								</button>
							</div>
							<div class="srch-track-list" id="srch-tracks-list">
								<!-- injected by search.events.js -->
							</div>
						</div>

						<!-- Artists -->
						<div id="srch-artists-section">
							<div class="srch-sec-head">
								<span class="srch-sec-title">
									<i class="bi bi-person"></i> Artists
								</span>
							</div>
							<div class="srch-artist-row" id="srch-artists-list">
								<!-- injected by search.events.js -->
							</div>
						</div>

						<!-- Genre results -->
						<div id="srch-genres-results" class="srch-genre-grid srch-genre-grid--compact" style="display:none;"></div>

					</div>
				</div>
			</section>
		`);

	// STATE 4 — skeleton
	const skeletonState = () =>
		buildNode(`
			<section class="srch-state" id="srch-skeleton" data-content="skeleton">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						<div class="srch-top-card srch-sk-card">
							<div class="srch-sk srch-sk--cover-lg"></div>
							<div style="flex:1;display:flex;flex-direction:column;gap:8px">
								<div class="srch-sk srch-sk--text-xs" style="width:48px"></div>
								<div class="srch-sk srch-sk--text-lg"></div>
								<div class="srch-sk srch-sk--text-md" style="width:60%"></div>
							</div>
							<div class="srch-sk srch-sk--circle"></div>
						</div>

						<div>
							<div class="srch-sk srch-sk--text-md" style="width:80px;margin-bottom:12px"></div>
							${[1, 2, 3, 4, 5]
								.map(
									() => `
								<div class="srch-track-row srch-sk-row">
									<div class="srch-sk srch-sk--cover-sm"></div>
									<div style="flex:1;display:flex;flex-direction:column;gap:5px">
										<div class="srch-sk srch-sk--text-md"></div>
										<div class="srch-sk srch-sk--text-sm" style="width:45%"></div>
									</div>
									<div class="srch-sk srch-sk--text-sm" style="width:28px"></div>
								</div>
							`,
								)
								.join("")}
						</div>

					</div>
				</div>
			</section>
		`);

	// STATE 5 — error
	const errorState = () =>
		buildNode(`
			<section class="srch-state srch-state--centered" id="srch-error" data-content="error">
				<div class="srch-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="srch-error-title">Search unavailable</h3>
				<p class="srch-error-sub" id="srch-error-msg">
					Couldn't reach the server. Check your connection and try again.
				</p>
				<button class="srch-btn-accent" id="srch-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Retry
				</button>
			</section>
		`);

	// ── Pick state view ──────────────────────────────────────
	const getStateView = (state) => {
		switch (state) {
			case "results":
				return resultsState();
			case "no-results":
				return noResultsState();
			case "skeleton":
				return skeletonState();
			case "error":
				return errorState();
			default:
				return defaultState();
		}
	};

	root.append(header(), getStateView(state));
	return root.getElement();
};

export default SearchDesktop;
