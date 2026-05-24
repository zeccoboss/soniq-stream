/**
 * home.events.js
 *
 * Handles user interactions for SoniqStream's home page.
 * Uses event delegation on main wrapper containers.
 */

export const homeEvents = (root, { state, setState, setData, ctx }) => {
	// ── 1. Error State: Retry Button ─────────────────────────────
	// Triggers a full re-fetch by setting state back to skeleton
	const retryBtn =
		root.querySelector("#home-retry-btn") ||
		root.querySelector("#home-mob-retry-btn");
	if (retryBtn) {
		retryBtn.addEventListener("click", () => {
			setState("skeleton");
		});
	}

	// ── 2. Global: Fake Search Bars ──────────────────────────────
	// Pushes the user to the search route when they tap the search pill
	const searchBars = root.querySelectorAll(
		"#home-fake-search, #home-discover-search, #home-mob-search",
	);
	searchBars.forEach((bar) => {
		bar.addEventListener("click", () => {
			// Push to history and trigger the router
			window.history.pushState({}, "", "/search");
			window.dispatchEvent(new Event("popstate"));
		});
	});

	// ── 3. Discover Tab: Genre Chips ─────────────────────────────
	// Updates the UI state to highlight the active genre chip
	const genreChipsContainer = root.querySelector("#home-genre-chips");
	if (genreChipsContainer) {
		genreChipsContainer.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-chip");
			if (!chip) return;

			const genre = chip.dataset.genre;
			if (genre) {
				// Re-renders the view with the new active genre
				setData({ activeGenre: genre });

				// TODO: In a real scenario, you'd filter your `newUploads`
				// and `topTracks` arrays based on this genre before rendering.
			}
		});
	}

	// ── 4. Explore Tab: Filter Chips ─────────────────────────────
	// Updates active filter and smoothly scrolls to the section
	const exploreFilters = root.querySelector("#home-explore-filters");
	if (exploreFilters) {
		exploreFilters.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-filter-chip");
			if (!chip) return;

			const filter = chip.dataset.filter;
			if (filter) {
				// Updates active state of the chip
				setData({ activeFilter: filter });

				// If not "all", scroll smoothly to the target section
				if (filter !== "all") {
					const targetSection = root.querySelector(
						`[data-section="${filter}"]`,
					);
					if (targetSection) {
						// Offset slightly for the sticky header
						const y =
							targetSection.getBoundingClientRect().top +
							window.scrollY -
							120;
						window.scrollTo({ top: y, behavior: "smooth" });
					}
				}
			}
		});
	}

	// ── 5. For You Tab: Taste Setup ──────────────────────────────
	// Hooks for the empty state taste setup
	const tasteChips = root.querySelector("#home-taste-chips");
	if (tasteChips) {
		tasteChips.addEventListener("click", (e) => {
			const chip = e.target.closest(".home-taste-chip");
			if (!chip) return;

			const action = chip.dataset.action;

			if (action === "pick-genres") {
				console.log("Trigger Pick Genres Modal");
			} else if (action === "pick-artists") {
				console.log("Trigger Pick Artists Modal");
			} else if (action === "pick-moods") {
				console.log("Trigger Pick Moods Modal");
			}
		});
	}
};
