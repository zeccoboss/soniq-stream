import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { HomeDesktop } from "./HomeDesktop.js";
import { HomeMobile } from "./HomeMobile.js";
import { homeEvents } from "@zecco/features/home/home.events.js";
import { store } from "@zecco/store/store.js";
import { trackService } from "@zecco/services/api/track.service.js";

// ── In-Memory Feed Cache Layer ──────────────────────────────
// Placed outside the component lifecycle so it persists across internal router shifts
let feedCache = {
	data: null,
	cachedAt: null,
};

// Cache lifetime window configuration (e.g., 5 minutes)
const CACHE_DURATION = 300000;

/**
 * HomePage — Home page orchestrator
 * Route: / (outlet: "main")
 */
export const HomePage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "home-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	// ── Data container ───────────────────────────────────────
	let data = {
		user: store.user ?? null,
		isLoggedIn: store.isLoggedIn,

		// Discover
		genres: [],
		newUploads: [],
		trending: [],
		topTracks: [],
		activeGenre: "all",

		// Explore
		trendingArtists: [],
		newThisWeek: [],
		trendingTracks: [],
		activeFilter: "all",

		// For You
		hasEnoughData: false,
		recentPlays: [],
		liked: [],
		genreRecs: [],
		popularRightNow: [],
		topGenre: null,
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? HomeMobile : HomeDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, ctx, data });
		root.replaceChildren(view);
		homeEvents(root, { state, setState, setData, ctx });
	};

	// ── State updater ────────────────────────────────────────
	const setState = async (newState) => {
		state = newState;
		if (newState === "skeleton") {
			loadData();
		} else {
			await render();
		}
	};

	// ── Data patcher ─────────────────────────────────────────
	const setData = async (updates) => {
		data = { ...data, ...updates };
		// Sync local updates to memory cache if active
		if (feedCache.data) {
			feedCache.data = { ...feedCache.data, ...updates };
		}
		await render();
	};

	// ── Data loader ──────────────────────────────────────────
	const loadData = async () => {
		try {
			if (!isMounted) return;

			// 1. Evaluate Cache Availability
			const now = Date.now();
			if (
				feedCache.data &&
				feedCache.cachedAt &&
				now - feedCache.cachedAt < CACHE_DURATION
			) {
				data = {
					...feedCache.data,
					user: store.user ?? null,
					isLoggedIn: store.isLoggedIn,
				};
				state = "content";
				await render();
				return;
			}

			// Cache miss -> Trigger skeleton display layout instantly
			state = "skeleton";
			await render();

			// Refresh user from store on every load
			data.user = store.user ?? null;
			data.isLoggedIn = store.isLoggedIn;

			// Cancel previous in-flight requests
			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

			// ── Genre list ─────────────────────────────────
			data.genres = [
				{
					name: "Afrobeats",
					icon: "bi-music-note-beamed",
					colorClass: "gc-afrobeats",
				},
				{
					name: "Highlife",
					icon: "bi-music-note",
					colorClass: "gc-highlife",
				},
				{ name: "Amapiano", icon: "bi-disc", colorClass: "gc-amapiano" },
				{ name: "Gospel", icon: "bi-heart", colorClass: "gc-gospel" },
				{ name: "Hip-Hop", icon: "bi-mic", colorClass: "gc-hiphop" },
				{ name: "Afropop", icon: "bi-vinyl", colorClass: "gc-afropop" },
				{ name: "R&B", icon: "bi-headphones", colorClass: "gc-rnb" },
				{
					name: "Reggae",
					icon: "bi-music-note-list",
					colorClass: "gc-reggae",
				},
				{ name: "Jazz", icon: "bi-speaker", colorClass: "gc-jazz" },
				{
					name: "Electronic",
					icon: "bi-soundwave",
					colorClass: "gc-electronic",
				},
				{
					name: "Classical",
					icon: "bi-music-note-beamed",
					colorClass: "gc-classical",
				},
				{ name: "Rock", icon: "bi-lightning", colorClass: "gc-rock" },
			];

			const FEED_LIMIT = 10;

			// 2. Minimum display time enforcement promise (1500ms hold)
			const skeletonDelayTimer = new Promise((resolve) =>
				setTimeout(resolve, 1500),
			);

			const [exploreResult, discoverResult, forYouResult] =
				await Promise.allSettled([
					trackService.getExploreFeed({ limit: FEED_LIMIT, signal }),
					trackService.getDiscoverFeed({ limit: FEED_LIMIT, signal }),
					trackService.getForYouFeed({
						userId: store?.user?.id ?? null,
						signal,
					}),
					skeletonDelayTimer, // Bundled to force structural execution window
				]);

			// ── Explore Feed ────────────────────────────────
			if (exploreResult.status === "fulfilled") {
				const exploreRes = exploreResult.value;

				data.trendingArtists = exploreRes.trendingArtists ?? [];
				data.newThisWeek = exploreRes.newThisWeek ?? [];
				data.trendingTracks = exploreRes.trendingTracks ?? [];
				data.activeFilter = "all";
			} else {
				console.error(
					"[HomePage] Explore feed failed:",
					exploreResult.reason,
				);
			}

			// ── Discover Feed ───────────────────────────────
			if (discoverResult.status === "fulfilled") {
				const discoverPayload = discoverResult.value?.value;

				if (discoverPayload?.success) {
					const discoverSections = discoverPayload.sections ?? [];

					const discoverMap = Object.fromEntries(
						discoverSections.map((section) => [
							section.type,
							section.items ?? [],
						]),
					);

					data.newUploads = discoverMap.newUploads ?? [];
					data.trending = discoverMap.trending ?? [];
					data.topTracks = discoverMap.topTracks ?? [];
					data.popularRightNow = discoverMap.popular ?? [];

					data.activeGenre = "all";
				}
			} else {
				console.error(
					"[HomePage] Discover feed failed:",
					discoverResult.reason,
				);
			}

			// ── For You Feed ────────────────────────────────
			if (forYouResult.status === "fulfilled") {
				const forYouRes = forYouResult.value;

				data.recentPlays = forYouRes.recentPlays ?? [];
				data.liked = forYouRes.liked ?? [];
				data.genreRecs = forYouRes.genreRecs ?? [];

				data.popularRightNow =
					forYouRes.popularRightNow ?? data.popularRightNow;
				data.topGenre = forYouRes.topGenre ?? null;
				data.hasEnoughData = data.recentPlays.length >= 3;
			} else {
				console.error(
					"[HomePage] For You feed failed:",
					forYouResult.reason,
				);
			}

			if (!isMounted) return;

			// 3. Hydrate cache payload configuration on successful run
			feedCache.data = { ...data };
			feedCache.cachedAt = Date.now();

			state = "content";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				console.error("[HomePage] Load error:", err);
				state = "error";
				await render();
			}
		}
	};

	// ── Boot ─────────────────────────────────────────────────
	// Removed the accidental 'await' keyword here!
	// This allows the element shell to immediately return to your router
	// and mount the skeleton onto the screen while data fetches asynchronously.
	loadData();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};

// Export cache breaker utility for integration with logout events
export const invalidateHomeCache = () => {
	feedCache.data = null;
	feedCache.cachedAt = null;
};
