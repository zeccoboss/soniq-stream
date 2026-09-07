import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { AdminDesktop } from "./AdminDesktop.js";
import { AdminMobile } from "./AdminMobile.js";
import { adminEvents } from "@zecco/pages/Admin/admin.events.js";
import { store } from "@zecco/store/index.js";
import { router } from "@zecco/routes/router.js";
import { adminService } from "@zecco/services/api/admin.service.js";

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
 *   platformStats  { totalUsers, totalTracks, activePublicPlaylists, serverStatus, platformVersion }
 *   recentUsers    [{ uuid, username, avatar, isVerified, isActive, createdAt }]   — overview preview slice
 *   recentTracks   [{ uuid, title, artist, cover, genre, playCount, visibility, createdAt }] — overview preview slice
 *   recentReports  [{ uuid, targetType, reason, status, reportedBy, createdAt }]   — overview preview slice
 *   users          { list: [...], nextCursor, hasNextPage }  — full paginated tab
 *   tracks         { list: [...], nextCursor, hasNextPage }  — full paginated tab
 *   reports        { list: [...], nextCursor, hasNextPage }  — full paginated tab
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
		recentReports: [],
		users: { list: [], nextCursor: null, hasNextPage: false },
		tracks: { list: [], nextCursor: null, hasNextPage: false },
		reports: { list: [], nextCursor: null, hasNextPage: false },
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
			loadMore, // exposed so tab views can page beyond the initial cursor
		});
	};

	// const render = async () => {
	// 	if (!isMounted) return;
	// 	const view = await UI({ state, ctx, data });
	// 	root.replaceChildren(view); // ← skeleton actually gets mounted here, successfully
	// 	adminEvents(root, { state, setState, ctx, loadMore }); // ← if this throws, everything after dies
	// };

	// ── State updater ────────────────────────────────────────
	const setState = async (newState) => {
		state = newState;
		if (newState === "skeleton") {
			await loadData();
		} else {
			await render();
		}
	};

	// ── Load more (cursor pagination within a tab) ────────────
	const loadMore = async (tab) => {
		const bucket = data[tab];
		if (!bucket || !bucket.hasNextPage || !isMounted) return;

		try {
			const { signal } = controller ?? {};
			const fetchers = {
				users: () =>
					adminService.getUsers({ cursor: bucket.nextCursor, signal }),
				tracks: () =>
					adminService.getTracks({ cursor: bucket.nextCursor, signal }),
				reports: () =>
					adminService.getReports({ cursor: bucket.nextCursor, signal }),
			};

			const res = await fetchers[tab]?.();
			if (!res || !isMounted) return;

			data[tab] = {
				list: [...bucket.list, ...(res.data ?? [])],
				nextCursor: res.nextCursor ?? null,
				hasNextPage: res.hasNextPage ?? false,
			};

			await render();
		} catch (err) {
			if (err?.status !== 499)
				console.error("[AdminPage] loadMore error:", err);
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
			const currentUser = store?.auth?.user;
			const isAdmin =
				currentUser?.isAdmin === true ||
				currentUser?.roles?.some(
					(role) => String(role).toLowerCase() === "admin",
				);
			if (!store?.auth?.isLoggedIn || !currentUser || !isAdmin) {
				router.replace("/auth/login");
				return;
			}

			controller?.abort();
			controller = new AbortController();
			const { signal } = controller;

			const tab = ctx?.query?.tab ?? "overview";

			if (tab === "overview") {
				// One aggregate call — cheap preview slices of everything, no per-tab pagination needed here
				const res = await adminService.getOverview({ signal });
				const overview = res?.data ?? {};

				// console.log("[AdminPage] Overview data:", res);

				data.platformStats = overview.stats ?? {};
				data.recentUsers = overview.recentUsers ?? [];
				data.recentTracks = overview.recentTracks ?? [];
				data.recentReports = overview.recentReports ?? [];
				data.users = { list: [], nextCursor: null, hasNextPage: false };
				data.tracks = { list: [], nextCursor: null, hasNextPage: false };
				data.reports = { list: [], nextCursor: null, hasNextPage: false };
			} else {
				// Individual tabs fetch their own full, paginated dataset on demand
				const fetchers = {
					users: () => adminService.getUsers({ signal }),
					tracks: () => adminService.getTracks({ signal }),
					reports: () => adminService.getReports({ signal }),
				};

				const res = await fetchers[tab]?.();
				if (res) {
					data[tab] = {
						list: res.data ?? [],
						nextCursor: res.nextCursor ?? null,
						hasNextPage: res.hasNextPage ?? false,
					};
				}

				// console.log("[AdminPage] Tab data:", tab, data[tab]);

				// Stats stay visible regardless of which tab is active (e.g. a persistent header)
				if (!data.platformStats?.totalUsers) {
					const statsRes = await adminService.getStats({ signal });
					data.platformStats = statsRes?.data ?? {};
				}
			}

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
