import { mobileScreen } from "@zecco/core/screen-break-points";
import { LibraryDesktop } from "./LibraryDesktop";
import { LibraryMobile } from "./LibraryMobile";
import { libraryEvents } from "@zecco/features/library/library.events";
import "./Library.styles.css";

export const LibraryPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "library-page";

	let state = "loading";
	const controller = null; // For AbortController if needed
	let isMounted = true;

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? LibraryMobile : LibraryDesktop;

	// Actual async data loading (not setTimeout)
	const loadData = async () => {
		try {
			if (!isMounted) return;
			state = "loading";
			await render();

			// TODO: Replace with real API call
			// Example: const data = await fetchLibraryData({ signal: controller?.signal });
			const user = JSON.parse(localStorage.getItem("user") || "null");

			if (!user) {
				state = "auth";
				await render();
				return;
			}

			// Simulate data fetch
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (!isMounted) return;

			// TODO: Check if library is empty
			state = "content"; // or "empty" if no items
			await render();
		} catch (error) {
			if (error?.name !== "AbortError" && isMounted) {
				console.error("[LibraryPage] Load error:", error);
				state = "error";
				await render();
			}
		}
	};

	const render = async () => {
		if (!isMounted) return;
		state = "content";

		const view = await UI({ state, ctx });
		root.replaceChildren(view);
		// Bind events ONLY to fresh DOM
		libraryEvents(root);
	};

	// ── Lifecycle ──
	loadData(); // Start loading (includes initial render)

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort(); // Cancel in-flight requests
		// libraryEvents cleanup happens here (if you track listeners)
	};

	return root;
};
