import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import { DiscoverView } from "./views/DiscoverView.js";
import { ExploreView } from "./views/ExploreView.js";
import { ForYouView } from "./views/ForYouView.js";
import "./Home.styles.css";

/**
 * HomeMobile — Mobile home view
 *
 * Thin orchestrator. Reads ctx.query.tab to decide which
 * view factory to call. All content logic lives in the
 * view factories — add new tabs by creating a new view file.
 *
 * States: skeleton | content | error
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx    — Router context, ctx.query.tab
 * @param {Object} props.data   — All home data, passed down to views
 * @returns {Promise<Element>}
 */
export const HomeMobile = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root
		.addClass("home-section-mobile", "main-sections")
		.setId("home-section-mobile");

	const tab = ctx?.query?.tab ?? "discover";
	const username = data.user?.username ?? data.user?.username ?? null;

	// ── Greeting ─────────────────────────────────────────────
	const greeting = () => {
		const h = new Date().getHours();
		const time =
			h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
		return `${time}, ${username ?? "Guest"}`;
	};

	// ── Header ───────────────────────────────────────────────
	// Greeting + page title + fake search bar + tab nav
	// All always visible regardless of state
	const header = () =>
		buildNode(`
			<header class="home-mob-header">
				<div class="home-mob-topbar">
					<div class="home-mob-title-group">
						<p class="home-mob-greeting">${greeting()}</p>
						<h1 class="home-mob-title">
							${{ discover: "Discover", explore: "Explore", foryou: "For You" }[tab] ?? "Discover"}
						</h1>
					</div>
					<!-- avatar navigates to /profile — wired by home.events.js -->
					<a href="/profile" class="home-mob-avatar" id="home-mob-avatar" aria-label="Profile">
						<img
							src="${data.user?.avatar.url || "/src/assets/images/default-profile.png"}"
							alt="Profile"
							class="home-mob-avatar-img"
							onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
						/>
						<div class="home-mob-avatar-fallback">
							${(username ?? "G").charAt(0).toUpperCase()}
						</div>
					</a>
				</div>

				<!-- Fake search pill — home.events.js routes to /search -->
				<div class="home-mob-search" id="home-mob-search"
					role="button" tabindex="0" aria-label="Open search">
					<i class="bi bi-search"></i>
					<span>Search songs, artists…</span>
				</div>

				<!-- Tab nav — anchor links, router intercepts -->
				<nav class="home-mob-tabs" aria-label="Home tabs">
					<a href="/?tab=discover"
						class="home-mob-tab ${!tab || tab === "discover" ? "active" : ""}"
						data-tab="discover">Discover</a>
					<a href="/?tab=explore"
						class="home-mob-tab ${tab === "explore" ? "active" : ""}"
						data-tab="explore">Explore</a>
					<a href="/?tab=foryou"
						class="home-mob-tab ${tab === "foryou" ? "active" : ""}"
						data-tab="foryou">For You</a>
				</nav>
			</header>
		`);

	// ── Skeleton state ────────────────────────────────────────
	// Per-section shimmer, not full-page block
	const skeletonState = () =>
		buildNode(`
			<div class="home-mob-scroll" data-content="skeleton">
				<!-- Search skeleton -->
				<div class="home-sk home-sk--search-mob"></div>
				<!-- Chip row skeleton -->
				<div class="home-sk-row">
					${[1, 2, 3, 4, 5].map(() => `<div class="home-sk home-sk--chip-mob"></div>`).join("")}
				</div>
				<!-- Section skeleton × 2 -->
				${[1, 2]
					.map(
						() => `
					<div class="home-mob-sec">
						<div class="home-sk home-sk--sec-title-mob"></div>
						<div class="home-hscroll">
							${[1, 2, 3]
								.map(
									() => `
								<div class="home-sk-card-mob">
									<div class="home-sk home-sk--card-cover-mob"></div>
									<div class="home-sk home-sk--card-title-mob"></div>
									<div class="home-sk home-sk--card-artist-mob"></div>
								</div>
							`,
								)
								.join("")}
						</div>
					</div>
				`,
					)
					.join("")}
				<!-- Track list skeleton -->
				<div class="home-mob-sec">
					<div class="home-sk home-sk--sec-title-mob"></div>
					${[1, 2, 3, 4, 5]
						.map(
							() => `
						<div class="home-sk-track-row">
							<div class="home-sk home-sk--track-num-mob"></div>
							<div class="home-sk home-sk--track-cover-mob"></div>
							<div class="home-sk-track-meta">
								<div class="home-sk home-sk--text-md-mob"></div>
								<div class="home-sk home-sk--text-sm-mob"></div>
							</div>
						</div>
					`,
						)
						.join("")}
				</div>
			</div>
		`);

	// ── Error state ───────────────────────────────────────────
	const errorState = () =>
		buildNode(`
			<div class="home-mob-scroll home-state-centered" data-content="error">
				<div class="home-error-icon"><i class="bi bi-wifi-off"></i></div>
				<h3 class="home-error-title">Couldn't load content</h3>
				<p class="home-error-sub">Check your connection and try again.</p>
				<button class="home-retry-btn" id="home-mob-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Try Again
				</button>
			</div>
		`);

	// ── Content state ─────────────────────────────────────────
	// Wraps the active view factory in the scroll container
	const contentState = () => {
		const views = {
			explore: () => ExploreView(data, true),
			foryou: () => ForYouView(data, true),
			discover: () => DiscoverView(data, true),
		};
		const viewEl = (views[tab] ?? views.discover)();

		const wrapper = document.createElement("div");
		wrapper.className = "home-mob-scroll";
		wrapper.dataset.content = "content";
		wrapper.appendChild(viewEl);
		return wrapper;
	};

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
