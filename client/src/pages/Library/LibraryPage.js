import { mobileScreen } from "@zecco/core/screen-break-points";
import { LibraryDesktop } from "./LibraryDesktop";
import { LibraryMobile } from "./LibraryMobile";
import { libraryEvents } from "@zecco/pages/Library/library.events";
import meService from "@zecco/services/api/me.service";
import { store } from "@zecco/store/";
import {
	renderTrackRow,
	renderPlaylistCard,
	renderPlaylistItemMobile,
	renderArtistChip,
	getUniqueArtists,
} from "./library.helpers.js";
import "./Library.styles.css";

export const LibraryPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "library-page";

	let state = "loading";
	let isMounted = true;
	let controller = null;
	let data = { sections: { likedTracks: [], playlists: [], upload: [] } };

	const UI = () => (mobileScreen.matches ? LibraryMobile : LibraryDesktop);

	const hydrateOverview = (viewRoot) => {
		const liked = data.sections.likedTracks || [];
		const upload = data.sections.upload || [];
		const playlists = data.sections.playlists || [];
		const artists = getUniqueArtists([...liked, ...upload]);

		const set = (sel, text) => {
			const el = viewRoot.querySelector(sel);
			if (el) el.textContent = text;
		};
		set(
			"#lib-liked-meta, #lib-liked-meta-mobile",
			`${liked.length} song${liked.length === 1 ? "" : "s"}`,
		);
		set(
			"#lib-upload-meta, #lib-upload-meta-mobile",
			`${upload.length} track${upload.length === 1 ? "" : "s"}`,
		);
		set(
			"#lib-recent-meta, #lib-recent-meta-mobile",
			`${Math.min(liked.length, 8)} song${Math.min(liked.length, 8) === 1 ? "" : "s"}`,
		);
		set(
			"#lib-following-meta, #lib-following-meta-mobile",
			`${artists.length} artist${artists.length === 1 ? "" : "s"}`,
		);

		const grid = viewRoot.querySelector("#lib-playlist-grid");
		if (grid) {
			const addCard = grid.querySelector(".lib-playlist-card--add");
			grid.innerHTML = `${playlists.slice(0, 7).map(renderPlaylistCard).join("")}${addCard ? addCard.outerHTML : ""}`;
		}
		const listMobile = viewRoot.querySelector("#lib-playlist-list-mobile");
		if (listMobile) {
			listMobile.innerHTML = playlists.length
				? playlists.slice(0, 10).map(renderPlaylistItemMobile).join("")
				: `<p class="lib-empty-sub">No playlists created yet.</p>`;
		}
	};

	const hydrateSectionDetail = (viewRoot, section) => {
		const liked = data.sections.likedTracks || [];
		const upload = data.sections.upload || [];
		const playlists = data.sections.playlists || [];
		const artists = getUniqueArtists([...liked, ...upload]);

		const listEl = viewRoot.querySelector(
			"#lib-section-detail-list, #lib-section-detail-list-mobile",
		);
		const gridEl = viewRoot.querySelector(
			"#lib-section-detail-grid, #lib-section-detail-list-mobile",
		);
		const artistsEl = viewRoot.querySelector(
			"#lib-section-detail-artists, #lib-section-detail-artists-mobile",
		);

		if (section === "liked" && listEl) {
			listEl.innerHTML = liked.length
				? liked.map(renderTrackRow).join("")
				: `<p class="lib-empty-sub">No liked songs yet.</p>`;
		}
		if (section === "upload" && listEl) {
			listEl.innerHTML = upload.length
				? upload.map(renderTrackRow).join("")
				: `<p class="lib-empty-sub">No uploaded tracks yet.</p>`;
		}
		if (section === "recent" && listEl) {
			// NOTE: not real recently-played data yet — reusing liked as a
			// placeholder like the original code did. Your file tree has
			// recent-plays-model.js sitting unused; wiring real history
			// through there is a separate task, not touched here.
			const recent = liked.slice(0, 20);
			listEl.innerHTML = recent.length
				? recent.map(renderTrackRow).join("")
				: `<p class="lib-empty-sub">No recent plays yet.</p>`;
		}
		if (section === "playlists" && gridEl) {
			gridEl.innerHTML = playlists.length
				? playlists
						.map(
							mobileScreen.matches
								? renderPlaylistItemMobile
								: renderPlaylistCard,
						)
						.join("")
				: `<p class="lib-empty-sub">No playlists yet.</p>`;
		}
		if (section === "following" && artistsEl) {
			artistsEl.innerHTML = artists.length
				? artists.map(renderArtistChip).join("")
				: `<p class="lib-empty-sub">Not following anyone yet.</p>`;
		}
	};

	const addPlaylistLocally = (playlist) => {
		data.sections.playlists = [playlist, ...(data.sections.playlists ?? [])];
		render();
	};

	const render = async () => {
		if (!isMounted) return;
		const section = ctx?.query?.section ?? null;
		const view = await UI()({ state, section, ctx });
		root.replaceChildren(view);

		if (state === "content") {
			section ? hydrateSectionDetail(view, section) : hydrateOverview(view);
		}
		libraryEvents(view, { data, onPlaylistCreated: addPlaylistLocally });

		view
			.querySelector("#lib-retry-btn, #lib-retry-btn-mobile")
			?.addEventListener("click", loadData);
	};

	const loadData = async () => {
		try {
			if (!isMounted) return;
			if (!store?.auth?.isLoggedIn) {
				state = "auth";
				await render();
				return;
			}

			state = "loading";
			await render();

			controller?.abort();
			controller = new AbortController();

			const res = await meService.getLibrary({}, controller.signal);
			const payload = res?.data ?? res ?? {};
			const sections = payload?.sections ?? {};

			data = {
				sections: {
					likedTracks: sections.likedTracks || [],
					playlists: sections.playlists || [],
					upload: sections.upload || [],
				},
			};

			const hasAnyContent =
				data.sections.likedTracks.length > 0 ||
				data.sections.playlists.length > 0 ||
				data.sections.upload.length > 0;

			// A direct section deep-link should render its own empty state,
			// not bounce to the generic "library is empty" gate.
			state = hasAnyContent || ctx?.query?.section ? "content" : "empty";
			await render();
		} catch (error) {
			if (error?.name !== "AbortError" && isMounted) {
				console.error("[LibraryPage] Load error:", error);
				state =
					error?.status === 401 || error?.status === 403
						? "auth"
						: "error";
				await render();
			}
		}
	};

	loadData();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
