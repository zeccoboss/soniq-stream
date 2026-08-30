/** biome-ignore-all assist/source/organizeImports: <I know where they're from> */
import {
	bigScreen,
	largeScreen,
	mobileScreen,
} from "./core/screen-break-points";
import { rebuildLayout, setCurrentScreen } from "./layouts/buildLayout";
import { router } from "./routes/router";
import { applyMiddleware } from "./middlewares";
import { store } from "./store/store";
import { themeManager } from "./core/theme-manager";
import { logger } from "@zecco/core/logger.js";

// ── Styles ─────────────────────────────────────────────────────────────────────────
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/base.css";
import "./styles/media.css";
import { initGlobalPlayerTriggers } from "./events/player-events";

const bootstrap = async () => {
	// ── Global error handling ─────────────────────────────────────────────────────────
	window.addEventListener("error", (e) => {
		logger.error("Unhandled error", {
			context: "Global",
			meta: e.error,
			silent: false,
		});
	});

	window.addEventListener("unhandledrejection", (e) => {
		logger.error("Unhandled promise rejection", {
			context: "Global",
			meta: e.reason,
			silent: false,
		});
	});

	// ── Initialize the application state store ───────────────────────────────────
	store.init();

	// ── Initialize the application theme ───────────────────────────────────
	themeManager.init();

	// ── For middleware initialization and start up ───────────────────────────────────
	applyMiddleware();

	initGlobalPlayerTriggers();

	// ── Initialize network status monitoring and event handling  ───────────────────────────────────
	// networkHandler.init();

	// Determine the initial screen size based on the defined media queries
	const screen = mobileScreen.matches
		? "mobile"
		: bigScreen.matches
			? "big"
			: "large";

	setCurrentScreen(screen); // Set the initial screen size in the application state
	await rebuildLayout(screen); // Build the initial layout based on the current screen size

	const onBreakpointChange = (newScreen) => async (e) => {
		if (!e.matches) return; // If the media query no longer matches, we don't need to do anything

		setCurrentScreen(newScreen); // Update the current screen size in the application state
		await rebuildLayout(newScreen); // Rebuild the layout for the new screen size

		// After rebuilding the layout, we need to re-render the current route to ensure the new layout is applied
		router.replace(location.pathname + location.search);
	};

	// Add event listeners for screen size changes
	mobileScreen.addEventListener("change", onBreakpointChange("mobile"));
	bigScreen.addEventListener("change", onBreakpointChange("big"));
	largeScreen.addEventListener("change", onBreakpointChange("large"));
};

bootstrap();
