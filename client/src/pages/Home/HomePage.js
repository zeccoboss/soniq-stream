import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { HomeDesktop } from "./HomeDesktop.js";
import { HomeMobile } from "./HomeMobile.js";
import { homeEvents } from "@zecco/features/home/home.events.js";
import { store } from "@zecco/store/store.js";
import { trackService } from "@zecco/services/api/track.service.js";

/**
 * HomePage — Home page orchestrator
 *
 * Route: /  (outlet: "main")
 * Tab routing: /?tab=discover | explore | foryou
 *
 * The router parses ctx.query.tab as a string automatically.
 * Tab switching works via anchor links — the router intercepts
 * them and calls replaceChildren, so the whole page re-renders
 * with the new tab active. No manual DOM toggling.
 *
 * State machine:
 *   skeleton → fetch → content | error
 *   error    → retry → skeleton → content | error
 *
 * Data contract (passed into Desktop/Mobile as `data`):
 * ─────────────────────────────────────────────────────
 *   user            Object | null   — from store
 *   isLoggedIn      boolean
 *
 *   // Discover tab
 *   genres          [{ name, icon, colorClass }]
 *   newUploads      [{ id, title, artist, cover, genre, duration }]
 *   trending        [{ id, title, artist, cover, plays }]
 *   topTracks       [{ id, title, artist, cover, genre, duration }]
 *   activeGenre     string | "all"  — genre chip toggle state
 *
 *   // Explore tab
 *   trendingArtists [{ username, username, avatar, uploadsCount }]
 *   newThisWeek     [{ id, title, artist, cover, genre }]
 *   trendingTracks  [{ id, title, artist, cover, plays }]
 *   activeFilter    "all" | "genres" | "artists" | "trending" | "new"
 *
 *   // For You tab
 *   hasEnoughData   boolean
 *   recentPlays     [{ id, title, artist, cover, genre }]
 *   liked           [{ id, title, artist, cover, genre }]
 *   genreRecs       [{ id, title, artist, cover, genre }]
 *   popularRightNow [{ id, title, artist, cover, genre, duration }]
 *   topGenre        string | null
 *
 * @async
 * @param {Object} ctx - Router context { path, params, query }
 * @returns {Promise<Element>}
 */
export const HomePage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "home-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	// ── Data container ───────────────────────────────────────
	// All tab data lives here. Views read from it on every render.
	// homeEvents mutates it via setData() for things like
	// genre chip toggles and explore filter clicks —
	// those don't need a server round trip.
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
			await loadData();
		} else {
			await render();
		}
	};

	// ── Data patcher ─────────────────────────────────────────
	// Used by homeEvents for UI-only state changes:
	//   - genre chip toggles  → setData({ activeGenre: "Afrobeats" })
	//   - explore filter tabs → setData({ activeFilter: "artists" })
	// Re-renders without hitting the server.
	const setData = async (updates) => {
		data = { ...data, ...updates };
		await render();
	};

	// ── Data loader ──────────────────────────────────────────
	const loadData = async () => {
		try {
			if (!isMounted) return;

			state = "skeleton";
			await render();

			// Refresh user from store on every load
			// (token may have been validated since last visit)
			data.user = store.user ?? null;
			data.isLoggedIn = store.isLoggedIn;

			// Cancel previous in-flight requests
			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

			// ── Genre list ─────────────────────────────────
			// Static for now — wire to API when genre endpoint exists
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

			// ==================================================
			// ── Feeds ─────────────────────────────────────────
			// ==================================================

			const FEED_LIMIT = 10; // fetch 10 items per feed for now — adjust as needed
			const [exploreResult, discoverResult, forYouResult] =
				await Promise.allSettled([
					trackService.getExploreFeed({
						limit: FEED_LIMIT,
						signal,
					}),

					trackService.getDiscoverFeed({
						limit: FEED_LIMIT,
						signal,
					}),

					trackService.getForYouFeed({
						userId: store?.user?.id ?? null,
						signal,
					}),
				]);

			// console.log(discoverResult);

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
				// actual API payload
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
	await loadData();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
