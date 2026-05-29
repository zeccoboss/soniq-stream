import { router } from "@zecco/routes/router.js";
import { store } from "@zecco/store/store.js";
import { toast } from "@zecco/components/Toast/Toast.js";

/**
 * homeEvents — Home page interaction layer
 *
 * Wired after every render by HomePage.js.
 * Uses event delegation wherever possible to avoid
 * re-attaching listeners on genre/filter re-renders.
 *
 * @param {Element} root  — The rendered home section
 * @param {Object}  api   — { state, setState, setData, ctx, data }
 */
export const homeEvents = (
	root,
	{ state, setState, setData, ctx, data = {} },
) => {
	if (state !== "content") {
		// Only wire retry on non-content states
		root
			.querySelector("#home-retry-btn")
			?.addEventListener("click", () => setState("skeleton"));
		root
			.querySelector("#home-mob-retry-btn")
			?.addEventListener("click", () => setState("skeleton"));
		return;
	}

	// ── 1. Retry ─────────────────────────────────────────────
	root
		.querySelector("#home-retry-btn")
		?.addEventListener("click", () => setState("skeleton"));
	root
		.querySelector("#home-mob-retry-btn")
		?.addEventListener("click", () => setState("skeleton"));

	// ── 2. Search bars → /search ─────────────────────────────
	root
		.querySelectorAll(
			"#home-fake-search, #home-discover-search, #home-mob-search",
		)
		.forEach((bar) => {
			bar.addEventListener("click", () => router.navigate("/search"));
			bar.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") router.navigate("/search");
			});
		});

	// ── 3. Genre chips — filter newUploads + topTracks in-view ─
	const genreChipsContainer = root.querySelector("#home-genre-chips");
	if (genreChipsContainer) {
		genreChipsContainer.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-chip");
			if (!chip) return;

			const genre = chip.dataset.genre ?? "all";

			// Filter track lists in memory — no server call
			const filtered =
				genre === "all"
					? {
							activeGenre: "all",
							filteredUploads: data.newUploads ?? [],
							filteredTop: data.topTracks ?? [],
							filteredTrending: data.trending ?? [],
						}
					: {
							activeGenre: genre,
							filteredUploads: (data.newUploads ?? []).filter(
								(t) =>
									normaliseGenre(t.genre) === normaliseGenre(genre),
							),
							filteredTop: (data.topTracks ?? []).filter(
								(t) =>
									normaliseGenre(t.genre) === normaliseGenre(genre),
							),
							filteredTrending: (data.trending ?? []).filter(
								(t) =>
									normaliseGenre(t.genre) === normaliseGenre(genre),
							),
						};

			setData({
				activeGenre: filtered.activeGenre,
				// Pass filtered slices — views read these if present,
				// fall back to unfiltered if genre has no matches
				newUploads: filtered.filteredUploads.length
					? filtered.filteredUploads
					: genre === "all"
						? data.newUploads
						: [],
				topTracks: filtered.filteredTop.length
					? filtered.filteredTop
					: genre === "all"
						? data.topTracks
						: [],
				trending: filtered.filteredTrending.length
					? filtered.filteredTrending
					: genre === "all"
						? data.trending
						: [],
			});
		});
	}

	// ── 4. Explore filter chips — show/hide sections ──────────
	const exploreFilters = root.querySelector("#home-explore-filters");
	if (exploreFilters) {
		exploreFilters.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-filter-chip");
			if (!chip) return;

			const filter = chip.dataset.filter ?? "all";
			setData({ activeFilter: filter });

			// Scroll to the matching section if not "all"
			if (filter !== "all") {
				const target = root.querySelector(`[data-section="${filter}"]`);
				if (target) {
					target.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}
		});
	}

	// ── 5 & 6. Track interaction — rows + cards ───────────────
	// Delegated on the scroll containers so new content from
	// genre filtering is also covered without re-attaching
	root
		.querySelectorAll(".home-track-list, .home-hscroll, .home-mob-scroll")
		.forEach((container) => {
			container.addEventListener("click", (e) => {
				// Track row
				const row = e.target.closest(".home-track-row");
				if (row) {
					handleTrackPlay(row.dataset.uuid, row.dataset.index, data);
					return;
				}
				// Track card
				const card = e.target.closest(".home-track-card");
				if (card) {
					handleTrackPlay(card.dataset.uuid, null, data);
					return;
				}
				// Artist card
				const artist = e.target.closest(".home-artist-card");
				if (artist?.dataset.username) {
					router.navigate(`/profile/${artist.dataset.username}`);
					return;
				}
			});
		});

	// ── 7. "See all" buttons → search with query ─────────────
	const seeAllMap = {
		"home-see-all-uploads": "/search?filter=new",
		"home-see-all-trending": "/search?filter=trending",
		"home-see-all-top": "/search?filter=top",
		"home-see-all-genres": "/search?filter=genres",
		"home-see-all-recent": "/library?tab=recent",
		"home-see-all-liked": "/library?tab=liked",
		"home-see-all-popular": "/search?filter=popular",
		"home-see-all-genre-recs": `/search?genre=${encodeURIComponent(data.topGenre ?? "")}`,
		// Explore tab
		"home-explore-see-all-genres": "/search?filter=genres",
		"home-explore-see-all-artists": "/search?filter=artists",
		"home-explore-see-all-trending": "/search?filter=trending",
		"home-explore-see-all-new": "/search?filter=new",
	};

	Object.entries(seeAllMap).forEach(([id, path]) => {
		root.querySelector(`#${id}`)?.addEventListener("click", () => {
			router.navigate(path);
		});
	});

	// Genre card clicks → search filtered by that genre
	root.querySelectorAll(".home-genre-card").forEach((card) => {
		card.addEventListener("click", () => {
			const genre = card.dataset.genre;
			if (genre)
				router.navigate(`/search?genre=${encodeURIComponent(genre)}`);
		});
	});

	// Genre row "see all" in discover
	root
		.querySelector("#home-see-all-genres")
		?.addEventListener("click", () =>
			router.navigate("/search?filter=genres"),
		);

	// ── 8. Avatar → /profile ─────────────────────────────────
	root
		.querySelector("#home-mob-avatar")
		?.addEventListener("click", () => router.navigate("/profile"));

	// ── 9. For You — taste setup chips ───────────────────────
	// Stubs — wire to modal when modal system is integrated
	const tasteChips = root.querySelector("#home-taste-chips");
	if (tasteChips) {
		tasteChips.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-taste-chip");
			if (!chip) return;

			const action = chip.dataset.action;
			// TODO: replace console.logs with showModal() calls
			if (action === "pick-genres")
				console.log("[Home] Open genre picker modal");
			if (action === "pick-artists")
				console.log("[Home] Open artist picker modal");
			if (action === "pick-moods")
				console.log("[Home] Open mood picker modal");
		});
	}

	// ── 10. For You skip button ───────────────────────────────
	root.querySelector("#home-foryou-skip")?.addEventListener("click", () => {
		// Dismiss the taste setup section without navigating
		const setupSection = root.querySelector("#home-foryou-setup");
		if (setupSection) {
			setupSection.style.display = "none";
		}
	});

	// ── 11. Empty banner CTA → discover ──────────────────────
	root.querySelectorAll('[href="/?tab=discover"]').forEach((el) => {
		el.addEventListener("click", (e) => {
			e.preventDefault();
			router.replace("/?tab=discover");
		});
	});
};

// ── Helpers ──────────────────────────────────────────────────

/**
 * Normalise genre strings for comparison
 * "Hip-Hop" === "hip-hop" === "hip hop"
 */
const normaliseGenre = (genre = "") =>
	genre.toLowerCase().replace(/[\s-]/g, "");

/**
 * Find a track by id across all data sections and play it
 * UPDATED: Added indexHint back to parameter signature to match event execution calls cleanly
 */
const handleTrackPlay = (trackUuid, indexHint, data) => {
	if (!trackUuid) return;

	// 1. Build a flat pool from all homepage sections to find the track metadata object
	const pool = [
		...(data.newUploads ?? []),
		...(data.trending ?? []),
		...(data.topTracks ?? []),
		...(data.popularRightNow ?? []),
		...(data.recentPlays ?? []),
		...(data.liked ?? []),
		...(data.genreRecs ?? []),
		...(data.trendingTracks ?? []),
		...(data.newThisWeek ?? []),
	];

	// 2. Locate the track object explicitly checking the t.uuid field
	const track = pool.find((t) => t.uuid === trackUuid);
	if (!track) {
		console.warn("[homeEvents] Track not found in pool:", trackUuid);
		return;
	}

	// 3. Extract the parent section array where this track lives to use as the playlist queue
	const queue = buildContextualQueue(trackUuid, data);
	const startIndex = queue.findIndex((t) => t.uuid === trackUuid);

	// 4. Pass the contextual queue and start index directly to your updated PlayerStore
	store.player
		.loadQueue(
			queue.length ? queue : [track],
			startIndex >= 0 ? startIndex : 0,
		)
		.catch((err) => {
			console.error("[homeEvents] Play error:", err);
			toast({ message: "Couldn't play this track.", type: "error" });
		});
};

/**
 * Build a queue from the section that contains the given trackUuid.
 * Keeps context — clicking a trending track queues all trending tracks.
 */
const buildContextualQueue = (trackUuid, data) => {
	const sections = [
		data.newUploads,
		data.trending,
		data.topTracks,
		data.popularRightNow,
		data.recentPlays,
		data.liked,
		data.genreRecs,
		data.trendingTracks,
		data.newThisWeek,
	].filter(Boolean);

	for (const section of sections) {
		const found = section.find((t) => t.uuid === trackUuid);
		if (found) return section;
	}

	return [];
};
