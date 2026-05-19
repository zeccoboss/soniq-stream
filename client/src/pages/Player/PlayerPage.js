import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { DesktopFullPlayer } from "./DesktopFullPlayer.js";
import { MobileFullPlayer } from "./MobileFullPlayer.js";
import { playerEvents } from "@zecco/features/player/player.events.js";
import { store } from "@zecco/store/store.js";
import { router } from "@zecco/routes/router.js";

/**
 * PlayerPage — Full player orchestrator
 *
 * Route: /player  (outlet depends on screen size)
 *
 * Desktop → outlet: "main"
 *   The sidebar stays visible. The full player replaces the main
 *   content area only. Footer player bar is hidden via CSS class
 *   on #app (.player-open-desktop).
 *
 * Mobile → outlet: "root"
 *   True full-screen takeover. Covers footer nav and mini player.
 *   CSS class on #app (.player-open-mobile) hides both.
 *   Collapse button / swipe down restores previous route.
 *
 * No state machine — the player always shows content from store.
 * If nothing is playing, redirect back to home.
 *
 * @async
 * @param {Object} ctx - Router context
 * @returns {Promise<Element>}
 */
const PlayerPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "player-page";

	let isMounted = true;
	const isMobile = mobileScreen.matches;
	const app = document.getElementById("app");

	// ── Add body class to hide footer / mini player ───────────
	// CSS handles the rest — no JS show/hide needed.
	if (isMobile) {
		app?.classList.add("player-open-mobile");
	} else {
		app?.classList.add("player-open-desktop");
	}

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const UI = isMobile ? MobileFullPlayer : DesktopFullPlayer;
		const view = UI(); // players are not async — pure DOM factories
		root.replaceChildren(view);
		playerEvents(root, {
			isMobile,
			collapse,
		});
	};

	// ── Collapse — called by events file ─────────────────────
	// Collapses the full player back to mini player / previous page.
	const collapse = () => {
		router.back("/");
	};

	// ── Boot ─────────────────────────────────────────────────
	await render();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		// Remove app class — footer and mini player reappear
		app?.classList.remove("player-open-mobile");
		app?.classList.remove("player-open-desktop");
	};

	return root;
};

export default PlayerPage;
