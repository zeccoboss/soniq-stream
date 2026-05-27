import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import { GENRES } from "./SearchDesktop.js";
import "./Search.styles.css";

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
 * SearchMobile — Mobile search view component
 *
 * States:
 *   default    → idle, genre browse + optional auth banner
 *   results    → tracks / artists returned
 *   no-results → query returned nothing
 *   skeleton   → fetching
 *   error      → network failure
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx
 * @param {Object} props.data - { query, isLoggedIn, filter }
 * @returns {Promise<Element>}
 */
export const SearchMobile = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root
		.addClass("search-section-mobile", "main-sections")
		.setId("search-section-mobile");

	const { query = "", isLoggedIn = false, filter = "all" } = data;
	const activeFilter = ["all", "tracks", "artists", "genres"].includes(filter)
		? filter
		: "all";

	// ── Always visible — sticky header ───────────────────────
	const header = () =>
		buildNode(`
			<header class="srch-mob-header">
				<div class="srch-mob-header-top">
					<h2 class="srch-page-title">Search</h2>
				</div>

				<div class="srch-input-wrap">
					<i class="bi bi-search srch-input-icon"></i>
					<input
						type="search"
						id="search-input-mob"
						class="srch-input ${query ? "active" : ""}"
						placeholder="Songs, artists, genres..."
						value="${query}"
						autocomplete="off"
						spellcheck="false"
					/>
					<button class="srch-clear-btn" id="srch-clear-btn-mob"
						aria-label="Clear" ${!query ? "hidden" : ""}>
						<i class="bi bi-x-circle-fill"></i>
					</button>
				</div>

				<div class="srch-chips" id="srch-chips-mob">
					<button class="srch-chip ${activeFilter === "all" ? "active" : ""}" data-filter="all">All</button>
					<button class="srch-chip ${activeFilter === "tracks" ? "active" : ""}" data-filter="tracks">
						<i class="bi bi-music-note"></i> Tracks
					</button>
					<button class="srch-chip ${activeFilter === "artists" ? "active" : ""}" data-filter="artists">
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
			<section class="srch-mob-state" id="srch-mob-default" data-content="default">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						${
							!isLoggedIn
								? `
							<div class="srch-auth-banner" id="srch-mob-auth-banner">
								<div class="srch-auth-banner-left">
									<div class="srch-auth-banner-icon">
										<i class="bi bi-lock"></i>
									</div>
									<div>
										<p class="srch-auth-banner-title">Get more from search</p>
										<p class="srch-auth-banner-sub">
											Log in to see recent searches and personalised results.
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
							<div class="srch-recent" id="srch-mob-recent">
								<div class="srch-sec-head">
									<span class="srch-sec-title">Recent</span>
									<button class="srch-sec-action" id="srch-mob-clear-recent">Clear</button>
								</div>
								<div class="srch-recent-list" id="srch-mob-recent-list">
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
							<div class="srch-genre-grid srch-genre-grid--mob" id="srch-mob-genre-grid">
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
			<section class="srch-mob-state" id="srch-mob-results" data-content="results">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						<p class="srch-result-meta">
							Results for <span id="srch-mob-result-query">${query}</span>
						</p>

						<!-- Top result — compact mobile card -->
						<div id="srch-mob-top-result">
							<div class="srch-sec-head">
								<span class="srch-sec-title">Top Result</span>
							</div>
							<div class="srch-mob-top-card" id="srch-mob-top-card">
								<div class="srch-top-cover srch-top-cover--mob" id="srch-mob-top-cover">
									<img src="" alt="" class="srch-top-cover-img" id="srch-mob-top-cover-img" />
								</div>
								<div class="srch-top-info">
									<span class="srch-top-type" id="srch-mob-top-type">Track</span>
									<p class="srch-top-title" id="srch-mob-top-title">—</p>
									<p class="srch-top-sub" id="srch-mob-top-sub">—</p>
								</div>
								<button class="srch-top-play" id="srch-mob-top-play">
									<i class="bi bi-play-fill"></i>
								</button>
							</div>
						</div>

						<!-- Tracks -->
						<div id="srch-mob-tracks-section">
							<div class="srch-sec-head">
								<span class="srch-sec-title">
									<i class="bi bi-music-note-beamed"></i> Tracks
								</span>
								<button class="srch-sec-action" id="srch-mob-see-all-tracks">
									See all <i class="bi bi-arrow-right"></i>
								</button>
							</div>
							<div class="srch-track-list" id="srch-mob-tracks-list">
								<!-- injected by search.events.js -->
							</div>
						</div>

						<!-- Artists — horizontal scroll row on mobile -->
						<div id="srch-mob-artists-section">
							<div class="srch-sec-head">
								<span class="srch-sec-title">
									<i class="bi bi-person"></i> Artists
								</span>
							</div>
							<div class="srch-artist-row" id="srch-mob-artists-list">
								<!-- injected by search.events.js -->
							</div>
						</div>

					</div>
				</div>
			</section>
		`);

	// STATE 3 — no results
	const noResultsState = () =>
		buildNode(`
			<section class="srch-mob-state srch-mob-state--scroll" id="srch-mob-no-results" data-content="no-results">
				<div class="srch-scroll">
					<div class="srch-scroll-content">
						<div class="srch-empty-wrap">
							<div class="srch-empty-icon">
								<i class="bi bi-search"></i>
							</div>
							<h3 class="srch-empty-title">No results</h3>
							<p class="srch-empty-sub">
								Nothing for "<span id="srch-mob-empty-query">${query}</span>".
								Try a different keyword or browse below.
							</p>
						</div>
						<div class="srch-genre-grid srch-genre-grid--mob">
							${genreGrid()}
						</div>
					</div>
				</div>
			</section>
		`);

	// STATE 4 — skeleton
	const skeletonState = () =>
		buildNode(`
			<section class="srch-mob-state" id="srch-mob-skeleton" data-content="skeleton">
				<div class="srch-scroll">
					<div class="srch-scroll-content">

						<!-- top card skeleton -->
						<div class="srch-mob-top-card srch-sk-card">
							<div class="srch-sk srch-sk--cover-sm"></div>
							<div style="flex:1;display:flex;flex-direction:column;gap:6px">
								<div class="srch-sk srch-sk--text-xs" style="width:40px"></div>
								<div class="srch-sk srch-sk--text-md"></div>
								<div class="srch-sk srch-sk--text-sm" style="width:55%"></div>
							</div>
							<div class="srch-sk srch-sk--circle-sm"></div>
						</div>

						<!-- track rows skeleton -->
						<div>
							<div class="srch-sk srch-sk--text-md" style="width:70px;margin-bottom:10px"></div>
							${[1, 2, 3, 4]
								.map(
									() => `
								<div class="srch-track-row srch-sk-row">
									<div class="srch-sk srch-sk--cover-sm"></div>
									<div style="flex:1;display:flex;flex-direction:column;gap:5px">
										<div class="srch-sk srch-sk--text-md"></div>
										<div class="srch-sk srch-sk--text-sm" style="width:45%"></div>
									</div>
								</div>
							`,
								)
								.join("")}
						</div>

						<!-- artist row skeleton -->
						<div>
							<div class="srch-sk srch-sk--text-md" style="width:60px;margin-bottom:10px"></div>
							<div class="srch-artist-row">
								${[1, 2, 3, 4]
									.map(
										() => `
									<div class="srch-artist-chip" style="pointer-events:none">
										<div class="srch-sk srch-sk--avatar"></div>
										<div class="srch-sk srch-sk--text-sm" style="width:48px;margin-top:5px"></div>
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

	// STATE 5 — error
	const errorState = () =>
		buildNode(`
			<section class="srch-mob-state srch-mob-state--centered" id="srch-mob-error" data-content="error">
				<div class="srch-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="srch-error-title">Search unavailable</h3>
				<p class="srch-error-sub" id="srch-mob-error-msg">
					Check your connection and try again.
				</p>
				<button class="srch-btn-accent" id="srch-mob-retry-btn">
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
