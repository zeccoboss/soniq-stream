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

// ── Styles ─────────────────────────────────────────────────────────────────────────
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/base.css";
import "./styles/media.css";
import { networkHandler } from "./core/network-handler";

const bootstrap = async () => {
	// Determine the initial screen size based on the defined media queries
	const screen = mobileScreen.matches
		? "mobile"
		: bigScreen.matches
			? "big"
			: "large";

	setCurrentScreen(screen); // Set the initial screen size in the application state
	await rebuildLayout(screen); // Build the initial layout based on the current screen size

	// Initialize the application state store
	store.init();
	networkHandler.init(); // Initialize network status monitoring and event handling

	// ── For middleware initialization and start up ───────────────────────────────────
	applyMiddleware();

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
