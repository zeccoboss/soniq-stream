import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { DashboardDesktop } from "./DashboardDesktop.js";
import { DashboardMobile } from "./DashboardMobile.js";
import { dashboardEvents } from "@zecco/features/dashboard/dashboard.events.js";
import { store } from "@zecco/store/store.js";
import { router } from "@zecco/routes/router.js";

/**
 * DashboardPage — Dashboard orchestrator
 *
 * Route:  /dashboard  (outlet: "main", guard: "auth")
 * Lazy loaded — heavy stats fetch only when user navigates here.
 *
 * State machine:
 *   skeleton → auth check → fetch → content | error
 *   error    → retry      → skeleton → content | error
 *
 * Data contract:
 *   user          { username, displayName, avatar, plan }
 *   stats         { plays, uploads, followers, likes }
 *   recentUploads [{ id, title, cover, plays, likes, genre, uploadedAt }]
 *   topTrack      { id, title, cover, plays, likes } | null
 *
 * @async
 * @param {Object} ctx
 * @returns {Promise<Element>}
 */
export const DashboardPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "dash-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	let data = {
		user: store.auth.user ?? {},
		stats: {},
		recentUploads: [],
		topTrack: null,
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? DashboardMobile : DashboardDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, ctx, data });
		root.replaceChildren(view);
		dashboardEvents(root, { state, setState });
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

	// ── Data loader ──────────────────────────────────────────
	const loadData = async () => {
		try {
			if (!isMounted) return;

			state = "skeleton";
			await render();

			// Guard — router already blocks non-auth, but double-check
			if (!store?.auth.isLoggedIn || !store?.auth.user) {
				router.replace("/auth/login");
				return;
			}

			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

			// TODO: replace with real API calls
			// const [statsRes, uploadsRes] = await Promise.all([
			//   userService.getStats({ userId: store?.auth.user.id, signal }),
			//   audioService.getUserTracks({ userId: store?.auth.user.id, limit: 10, signal }),
			// ]);
			//
			// data.stats         = statsRes.data ?? {};
			// data.recentUploads = uploadsRes.data ?? [];
			// data.topTrack      = uploadsRes.data?.sort((a,b) => b.plays - a.plays)[0] ?? null;

			if (!isMounted) return;

			// Refresh user from store in case it updated
			data.user = store?.auth.user ?? {};

			state = "content";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				console.error("[DashboardPage] Load error:", err);
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

export default DashboardPage;
