import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { HomeDesktop } from "./HomeDesktop.js";
import { HomeMobile } from "./HomeMobile.js";
import { homeEvents } from "@zecco/features/home/home.events.js";
import { store } from "@zecco/store/store.js";
import { trackService } from "@zecco/services/api/track.service.js";

let feedCache = {
	data: null,
	cachedAt: null,
};

const CACHE_DURATION = 300000;

export const HomePage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "home-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	let data = {
		user: store?.auth.user ?? null,
		isLoggedIn: store?.auth?.isLoggedIn || !!store?.auth?.user,

		// Discover
		genres: [],
		newUploads: [],
		trending: [],
		topTracks: [],
		popularRightNow: [],
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
		topGenre: null,
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? HomeMobile : HomeDesktop;

	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, ctx, data });
		root.replaceChildren(view);
		homeEvents(root, { state, setState, setData, ctx });
	};

	const setState = async (newState) => {
		state = newState;
		if (newState === "skeleton") {
			loadData();
		} else {
			await render();
		}
	};

	const setData = async (updates) => {
		data = { ...data, ...updates };
		if (feedCache.data) {
			feedCache.data = { ...feedCache.data, ...updates };
		}
		await render();
	};

	const loadData = async () => {
		try {
			if (!isMounted) return;

			const now = Date.now();
			if (
				feedCache.data &&
				feedCache.cachedAt &&
				now - feedCache.cachedAt < CACHE_DURATION
			) {
				data = {
					...feedCache.data,
					user: store?.auth.user ?? null,
					isLoggedIn: store?.auth?.isLoggedIn || !!store?.auth?.user,
				};
				state = "content";
				await render();
				return;
			}

			state = "skeleton";
			await render();

			data.user = store?.auth.user ?? null;
			data.isLoggedIn = store?.auth?.isLoggedIn || !!store?.auth?.user;

			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

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
			const skeletonDelayTimer = new Promise((resolve) =>
				setTimeout(resolve, 1500),
			);

			const [exploreResult, discoverResult, forYouResult] =
				await Promise.allSettled([
					trackService.getExploreFeed({ limit: FEED_LIMIT }, signal),
					trackService.getDiscoverFeed({ limit: FEED_LIMIT }, signal),
					trackService.getForYouFeed({}, signal),
					skeletonDelayTimer,
				]);

			// ── Explore Feed Parsing ────────────────────────
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

			// ── Discover Feed Parsing (Vastly Cleaned) ──────
			if (discoverResult.status === "fulfilled") {
				const discoverRes =
					discoverResult.value?.value || discoverResult.value;

				// Standard properties mapped with direct lookups
				data.newUploads = discoverRes?.newUploads ?? [];
				data.trending = discoverRes?.trending ?? [];
				data.topTracks = discoverRes?.topTracks ?? [];
				data.popularRightNow = discoverRes?.popular ?? [];
				data.activeGenre = "all";
			} else {
				console.error(
					"[HomePage] Discover feed failed:",
					discoverResult.reason,
				);
			}

			// ── For You Feed Parsing ────────────────────────
			if (forYouResult.status === "fulfilled") {
				const forYouRes = forYouResult.value;
				data.isLoggedIn =
					forYouRes?.isLoggedIn ??
					(store?.auth?.isLoggedIn || !!store?.auth?.user);
				data.recentPlays = forYouRes.recentPlays ?? [];
				data.liked = forYouRes.liked ?? [];
				data.genreRecs = forYouRes.genreRecs ?? [];
				data.popularRightNow =
					forYouRes.popularRightNow ?? data.popularRightNow;
				data.topGenre = forYouRes.topGenre ?? null;
				data.hasEnoughData =
					forYouRes?.hasEnoughData ??
					(data.recentPlays.length > 0 || data.liked.length > 0);
			} else {
				console.error(
					"[HomePage] For You feed failed:",
					forYouResult.reason,
				);
			}

			if (!isMounted) return;

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

	loadData();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};

export const invalidateHomeCache = () => {
	feedCache.data = null;
	feedCache.cachedAt = null;
};
