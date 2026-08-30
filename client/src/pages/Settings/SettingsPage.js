import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { themeManager } from "@zecco/core/theme-manager.js";
import { SettingsDesktop } from "./SettingsDesktop.js";
import { SettingsMobile } from "./SettingsMobile.js";
import { settingsEvents } from "@zecco/pages/Settings/settings.events.js";
import { store } from "@zecco/store/store.js";
import meService from "@zecco/services/api/me.service.js";

/**
 * SettingsPage — Main settings orchestrator
 *
 * State machine:
 *   skeleton → (user loaded) → auth | content
 *   content  → (save)        → loading → content | error
 *   error    → (retry)       → loading → content | error
 *
 * @async
 * @param {Object} ctx - Router context
 * @returns {Promise<Element>} Root element with __onUnmount lifecycle
 */
export const SettingsPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "settings-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;
	let userData = null;
	let settingsData = null;

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? SettingsMobile : SettingsDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, ctx, userData, settingsData });
		root.replaceChildren(view);
		// Bind events to fresh DOM every render
		settingsEvents(root, { state, setState, userData, settingsData });
	};

	// ── State updater ────────────────────────────────────────
	// Exposed to events file so it can trigger state transitions
	// e.g. setState("loading") before an API call,
	//      setState("content") on success,
	//      setState("error")   on failure
	const setState = async (newState) => {
		state = newState;
		await render();
	};

	// ── Data loader ──────────────────────────────────────────
	const loadData = async () => {
		try {
			if (!isMounted) return;

			// Show skeleton immediately
			state = "skeleton";
			await render();

			// Check auth
			const user = store?.auth.user;
			if (!user || !store?.auth.isAuthenticated) {
				state = "auth";
				await render();
				return;
			}

			userData = user;

			// Fetch user settings from API
			try {
				controller = new AbortController();
				settingsData = await meService.getSettings(controller.signal);

				// Update store preferences with fetched settings
				if (settingsData && typeof settingsData === "object") {
					store.setPreferences(settingsData);
				}
			} catch (settingsErr) {
				console.warn(
					"[SettingsPage] Settings fetch error, using defaults:",
					settingsErr,
				);
				// Use default preferences from store if fetch fails
				settingsData =
					store.auth.settings ?? store.auth.user?.settings ?? null;
			}

			if (!isMounted) return;

			state = "content";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				console.error("[SettingsPage] Load error:", err);
				state = "error";
				await render();
			}
		}
	};

	// ── Initialize theme ────────────────────────────────────
	themeManager.init();

	// ── Boot ─────────────────────────────────────────────────
	await loadData();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
