import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { AdminDesktop } from "./AdminDesktop.js";
import { AdminMobile } from "./AdminMobile.js";
import { adminEvents } from "@zecco/features/admin/admin.events.js";
import { store } from "@zecco/store/store.js";
import { router } from "@zecco/routes/router.js";

/**
 * AdminPage — Admin control panel orchestrator
 *
 * Route:  /admin?tab=overview|users|tracks|reports
 * Outlet: "main"
 * Guard:  "admin" — router blocks non-admins before this runs
 *
 * Tab routing:
 *   ctx.query.tab drives which tab renders.
 *   Tab links use router.navigate() — each tab is a URL change
 *   so browser back/forward works across tabs.
 *
 * State machine:
 *   skeleton → fetch → content | error
 *   error    → retry → skeleton → content | error
 *
 * Data contract:
 *   platformStats  { totalUsers, totalTracks, totalPlays, activeToday }
 *   recentUsers    [{ id, username, displayName, avatar, isVerified, isBanned, joinedAt }]
 *   recentTracks   [{ id, title, artist, cover, genre, plays, flagged, uploadedAt }]
 *   reports        [{ id, type, reason, targetId, targetTitle, reportedBy, createdAt }]
 *
 * @async
 * @param {Object} ctx
 * @returns {Promise<Element>}
 */
const AdminPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "admin-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	let data = {
		platformStats: {},
		recentUsers: [],
		recentTracks: [],
		reports: [],
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? AdminMobile : AdminDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, ctx, data });
		root.replaceChildren(view);
		adminEvents(root, {
			state,
			setState,
			ctx,
		});
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

			// Double-check admin status — router guard should catch this
			// but a belt-and-suspenders check never hurts
			if (!store.isLoggedIn || !store.user?.isAdmin) {
				router.replace("/");
				return;
			}

			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

			const tab = ctx?.query?.tab ?? "overview";

			// TODO: replace with real API calls
			// Load only what the current tab needs to keep it fast
			//
			// const statsRes = await adminService.getPlatformStats({ signal });
			// data.platformStats = statsRes.data ?? {};
			//
			// if (tab === "overview" || tab === "users") {
			// 	const usersRes = await adminService.getUsers({ limit: 20, signal });
			// 	data.recentUsers = usersRes.data ?? [];
			// }
			// if (tab === "overview" || tab === "tracks") {
			// 	const tracksRes = await adminService.getTracks({ limit: 20, signal });
			// 	data.recentTracks = tracksRes.data ?? [];
			// }
			// if (tab === "reports") {
			// 	const reportsRes = await adminService.getReports({ signal });
			// 	data.reports = reportsRes.data ?? [];
			// }

			if (!isMounted) return;

			state = "content";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				console.error("[AdminPage] Load error:", err);
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
		root.__adminEventCleanup?.();
	};

	return root;
};

export default AdminPage;
