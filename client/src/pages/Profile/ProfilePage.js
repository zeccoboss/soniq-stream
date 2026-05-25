import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { ProfileDesktop } from "./ProfileDesktop.js";
import { ProfileMobile } from "./ProfileMobile.js";
import { profileEvents } from "@zecco/features/profile/profile.events.js";
import { store } from "@zecco/store/store.js";

/**
 * ProfilePage — Profile orchestrator
 *
 * Route: /profile/:username  (outlet: "main")
 *
 * Two modes:
 *   Own profile  → ctx.params.username matches store.user.username
 *                  isOwner = true — shows edit buttons, liked tab
 *   Other profile → viewing someone else's page
 *                  isOwner = false — shows follow button only
 *
 * State machine:
 *   skeleton → auth check → auth | fetch → content | error
 *   error    → retry      → skeleton → content | error
 *
 * @async
 * @param {Object} ctx - Router context { params: { username } }
 * @returns {Promise<Element>}
 */
export const ProfilePage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "profile-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	// ── Data container ───────────────────────────────────────
	// Passed into Desktop/Mobile on every render.
	// Events file can update this via setData() when e.g.
	// follow button is clicked and follower count changes.
	let data = {
		user: {},
		isOwner: false,
		tracks: [],
		playlists: [],
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? ProfileMobile : ProfileDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		state = "content";
		const view = await UI({ state, ctx, data });
		root.replaceChildren(view);
		profileEvents(root, { state, setState, setData });
	};

	// ── State updater ────────────────────────────────────────
	const setState = async (newState) => {
		state = newState;
		if (newState === "skeleton") {
			loadData();
		} else {
			await render();
		}
	};

	// ── Data updater ─────────────────────────────────────────
	// Lets the events file patch data without a full reload.
	// e.g. after follow: setData({ user: { ...user, followersCount: n } })
	const setData = async (updates) => {
		data = { ...data, ...updates };
		await render();
	};

	// ── Data loader ──────────────────────────────────────────
	const loadData = async () => {
		try {
			if (!isMounted) return;

			state = "skeleton";
			await render();

			// Auth check — profile page is auth-guarded in routes
			// but we still need the user object to determine isOwner
			const currentUser = store.user;
			if (!store.isLoggedIn || !currentUser) {
				state = "auth";
				await render();
				return;
			}

			// Determine if viewing own profile or someone else's
			const targetUsername = ctx?.params?.username ?? currentUser.username;
			const isOwner = targetUsername === currentUser.username;

			// Cancel previous in-flight request
			controller?.abort();
			controller = new AbortController();

			// TODO: replace with real API calls
			// const [profileData, tracksData, playlistsData] = await Promise.all([
			//   userService.getProfile(targetUsername, { signal: controller.signal }),
			//   trackService.getUserTracks(targetUsername, { signal: controller.signal }),
			//   userService.getUserPlaylists(targetUsername, { signal: controller.signal }),
			// ]);

			if (!isMounted) return;

			// Temporary: use current user from store as profile data
			data = {
				user: currentUser,
				isOwner,
				tracks: [],
				playlists: [],
			};

			state = "content";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				console.error("[ProfilePage] Load error:", err);
				state = "error";
				await render();
			}
		}
	};

	// ── Boot ─────────────────────────────────────────────────
	loadData();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
