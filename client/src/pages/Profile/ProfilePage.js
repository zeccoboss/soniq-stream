import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { ProfileDesktop } from "./ProfileDesktop.js";
import { ProfileMobile } from "./ProfileMobile.js";
import { profileEvents } from "@zecco/pages/Profile/profile.events.js";
import { store } from "@zecco/store/index.js";
import { profileService } from "@zecco/services/api/profile.service.js";

/**
 * ProfilePage — Profile orchestrator
 *
 * Route: /profile/:username  (outlet: "main")
 *
 * Two modes:
 *   Own profile  → ctx.params.username matches store?.auth.user.username
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
		profileEvents(root, { state, data, setState, setData }); // added `data`
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

	const loadData = async () => {
		try {
			if (!isMounted) return;

			state = "skeleton";
			await render();

			const currentUser = store?.auth.user;
			if (!store?.auth.isLoggedIn || !currentUser) {
				state = "auth";
				await render();
				return;
			}

			const targetIdentifier = ctx?.query?.identifier ?? currentUser.uuid;
			const isViewMode = ctx?.query?.view === true; // router auto-coerces "true"/"false" to real booleans

			controller?.abort();
			controller = new AbortController();

			const res = await profileService.getProfile(targetIdentifier, {
				signal: controller.signal,
			});
			if (!isMounted) return;

			const profile = res?.data;
			if (!profile) {
				state = "error";
				await render();
				return;
			}

			data = {
				user: {
					uuid: profile.identity.uuid,
					username: profile.identity.username,
					bio: profile.identity.bio,
					avatar: profile.identity.avatar
						? { url: profile.identity.avatar }
						: null,
					banner: profile.identity.banner
						? { url: profile.identity.banner }
						: null,
					followingCount: profile.stats.followingCount,
					followersCount: profile.stats.followersCount,
					uploadsCount: profile.stats.totalUploads,
					createdAt: profile.identity.createdAt ?? null,
				},
				isOwner: profile.viewer.isOwnProfile,
				isFollowingViewer: profile.viewer.isFollowing,
				isViewMode, // NEW — drives back button, tells the sidebar (once patched) to leave nav alone
				tracks: profile.content.publicTracks ?? [],
				playlists: profile.content.publicPlaylists ?? [],
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
