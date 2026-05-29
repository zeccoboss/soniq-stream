import { mobileScreen } from "@zecco/core/screen-break-points";
import { getTag } from "@zecco/helpers/dom-helper";
import { router } from "@zecco/routes/router";
import { store } from "@zecco/store/store";

/**
 * Middleware to toggle body classes based on the route's target outlet.
 * Ensures the CSS Grid adapts to "main" (layout) or "root" (full-screen).
 */
export const layoutSwitcher = async (ctx, next) => {
	const root = getTag("#app");

	// 1. Determine the target outlet
	const match = router?.matcher.match(ctx.path);
	let outlet = "root";

	if (match) {
		const leaf = match.stack.at(-1);
		outlet = leaf?.outlet ?? "main";

		// ── FIX: Resolve the callback if it's a dynamic function ──
		if (typeof outlet === "function") {
			outlet = outlet(ctx);
		}
	}

	// 2. Clear all relevant layout classes
	root.classList.remove(
		"layout-main",
		"layout-root",
		"layout-mobile",
		"sidebar-collapsed",
		"player-open-desktop",
		"player-open-mobile",
	);

	// 3. Apply the new layout class
	if (mobileScreen.matches) {
		// On mobile, "root" pages (Login/404) get layout-root.
		// Everything else gets the standard mobile shell class.
		const activeClass = outlet === "root" ? "layout-root" : "layout-mobile";
		root.classList.add(activeClass);
	} else {
		// On Desktop/Tablet, we follow the outlet name directly (layout-main or layout-root)
		root.classList.add(`layout-${outlet}`);

		if (store.ui.isSidebarCollapsed && outlet !== "root") {
			root.classList.add("sidebar-collapsed");
		}
	}

	// 4. Critical: Proceed to the next middleware/render pipeline
	await next();
};
