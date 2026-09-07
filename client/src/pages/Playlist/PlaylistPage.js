import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { PlaylistDesktop } from "./PlaylistDesktop.js";
import { PlaylistMobile } from "./PlaylistMobile.js";
import { playlistEvents } from "./playlist.events.js";
import { playlistService } from "@zecco/services/api/playlist.service.js";

/**
 * PlaylistPage — orchestrator
 *
 * Route: /playlist?identifier=uuid — never a nav destination, always a
 * drill-in from a PlaylistCard click (Profile grid, Library, Search later).
 * Back button always renders — router.back() naturally returns to
 * wherever the card was clicked from.
 *
 * State machine:
 *   skeleton → fetch in flight
 *   notFound → 404, or no identifier in the query at all
 *   private  → 403, playlist exists but viewer can't see it
 *   content  → loaded
 *   error    → other failure
 *
 * @async
 * @param {Object} ctx - Router context, ctx.query.identifier
 * @returns {Promise<Element>}
 */
export const PlaylistPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "playlist-page-root";

	let state = "skeleton";
	let playlist = null;
	let isMounted = true;
	let controller = null;

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? PlaylistMobile : PlaylistDesktop;

	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ state, playlist, ctx });
		root.replaceChildren(view);

		if (state === "content") {
			playlistEvents(root, { playlist, setPlaylist });
		} else {
			root
				.querySelector("[data-playlist-retry]")
				?.addEventListener("click", fetchPlaylist, { once: true });
		}
	};

	const setPlaylist = (patch) => {
		playlist = { ...playlist, ...patch };
		render();
	};

	const fetchPlaylist = async () => {
		state = "skeleton";
		await render();

		const identifier = ctx?.query?.identifier;
		if (!identifier) {
			state = "notFound";
			await render();
			return;
		}

		controller?.abort();
		controller = new AbortController();

		try {
			const res = await playlistService.getPlaylist(identifier, {
				signal: controller.signal,
			});
			if (!isMounted) return;
			playlist = res?.data ?? null;
			state = playlist ? "content" : "notFound";
		} catch (err) {
			if (err?.name === "AbortError" || !isMounted) return;
			state =
				err?.status === 403
					? "private"
					: err?.status === 404
						? "notFound"
						: "error";
		}
		await render();
	};

	await fetchPlaylist();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
