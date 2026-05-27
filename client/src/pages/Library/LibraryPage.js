import { mobileScreen } from "@zecco/core/screen-break-points";
import { LibraryDesktop } from "./LibraryDesktop";
import { LibraryMobile } from "./LibraryMobile";
import { libraryEvents } from "@zecco/features/library/library.events";
import meService from "@zecco/services/api/me.service";
import { store } from "@zecco/store/store";
import { formatTrackDuration } from "@zecco/utils/format-track-duration";
import "./Library.styles.css";

const DEFAULT_COVER = "/src/assets/images/default-profile.png";

const escapeHtml = (value = "") =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const initials = (value = "?") => value.trim().charAt(0).toUpperCase();

const toCoverUrl = (cover) =>
	cover?.url ||
	(cover?.storage?.baseUrl && cover?.storage?.key
		? new URL(cover.storage.key, cover.storage.baseUrl).href
		: DEFAULT_COVER);

const renderTrackRow = (track, index) => {
	const title = track?.title ?? "Untitled";
	const artist = track?.artist ?? "Unknown Artist";
	const cover = toCoverUrl(track?.cover);
	return `
		<div class="lib-track-row" data-track-id="${track?.uuid ?? track?._id ?? ""}">
			<span class="lib-track-num">${index + 1}</span>
			<div class="lib-track-cover">
				<img src="${cover}" alt="${escapeHtml(title)}"
					onerror="this.onerror=null;this.src='${DEFAULT_COVER}'" />
			</div>
			<div class="lib-track-info">
				<div class="lib-track-title">${escapeHtml(title)}</div>
				<div class="lib-track-artist">${escapeHtml(artist)}</div>
			</div>
			<div class="lib-track-right">
				<span class="lib-track-dur">${formatTrackDuration(track?.duration)}</span>
				<button class="lib-track-more" aria-label="More options">
					<i class="bi bi-three-dots-vertical"></i>
				</button>
			</div>
		</div>
	`;
};

const renderPlaylistCard = (playlist) => {
	const name = playlist?.name ?? "Untitled Playlist";
	const count = Array.isArray(playlist?.trackIds) ? playlist.trackIds.length : 0;
	return `
		<div class="lib-playlist-card" data-playlist-id="${playlist?.uuid ?? playlist?._id ?? ""}">
			<div class="lib-playlist-cover">
				<i class="bi bi-music-note-list"></i>
			</div>
			<p class="lib-playlist-title">${escapeHtml(name)}</p>
			<p class="lib-playlist-sub">${count} track${count === 1 ? "" : "s"}</p>
		</div>
	`;
};

const renderPlaylistItemMobile = (playlist) => {
	const name = playlist?.name ?? "Untitled Playlist";
	const count = Array.isArray(playlist?.trackIds) ? playlist.trackIds.length : 0;
	return `
		<div class="lib-playlist-item-mobile" data-playlist-id="${playlist?.uuid ?? playlist?._id ?? ""}">
			<div class="lib-playlist-item-cover">
				<i class="bi bi-music-note-list"></i>
			</div>
			<div class="lib-playlist-item-info">
				<div class="lib-playlist-item-title">${escapeHtml(name)}</div>
				<div class="lib-playlist-item-sub">${count} track${count === 1 ? "" : "s"}</div>
			</div>
		</div>
	`;
};

const renderArtistChip = (track) => {
	const name = track?.artist ?? "Unknown";
	return `
		<div class="lib-artist-chip" data-artist-id="">
			<div class="lib-artist-avatar">${initials(name)}</div>
			<div class="lib-artist-name">${escapeHtml(name)}</div>
		</div>
	`;
};

const getUniqueArtists = (tracks = []) => {
	const seen = new Set();
	return tracks.filter((t) => {
		const key = (t?.artist || "").toLowerCase().trim();
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

export const LibraryPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "library-page";

	let state = "loading";
	let isMounted = true;
	let controller = null;
	let data = {
		summary: { totalLiked: 0, totalPlaylists: 0, totalUploads: 0 },
		sections: { likedTracks: [], playlists: [], upload: [] },
	};

	const UI = () => (mobileScreen.matches ? LibraryMobile : LibraryDesktop);

	const hydrateContent = (viewRoot) => {
		const liked = data.sections?.likedTracks || [];
		const upload = data.sections?.upload || [];
		const playlists = data.sections?.playlists || [];
		const recent = liked.slice(0, 8);
		const artists = getUniqueArtists([...liked, ...upload]).slice(0, 12);

		const likedMeta = viewRoot.querySelector("#lib-liked-meta, #lib-liked-meta-mobile");
		const uploadMeta = viewRoot.querySelector(
			"#lib-upload-meta, #lib-upload-meta-mobile",
		);
		const recentMeta = viewRoot.querySelector(
			"#lib-recent-meta, #lib-recent-meta-mobile",
		);
		if (likedMeta) likedMeta.textContent = `${liked.length} song${liked.length === 1 ? "" : "s"}`;
		if (uploadMeta) uploadMeta.textContent = `${upload.length} track${upload.length === 1 ? "" : "s"}`;
		if (recentMeta) recentMeta.textContent = `${recent.length} song${recent.length === 1 ? "" : "s"}`;

		const likedList = viewRoot.querySelector("#lib-liked-list, #lib-liked-list-mobile");
		if (likedList) {
			likedList.innerHTML = liked.length
				? liked.map((t, i) => renderTrackRow(t, i)).join("")
				: `<p class="lib-empty-sub">No liked songs yet.</p>`;
		}

		const uploadList = viewRoot.querySelector(
			"#lib-upload-list, #lib-upload-list-mobile",
		);
		if (uploadList) {
			uploadList.innerHTML = upload.length
				? upload.map((t, i) => renderTrackRow(t, i)).join("")
				: `<p class="lib-empty-sub">No uploaded tracks yet.</p>`;
		}

		const recentList = viewRoot.querySelector(
			"#lib-recent-list, #lib-recent-list-mobile",
		);
		if (recentList) {
			recentList.innerHTML = recent.length
				? recent.map((t, i) => renderTrackRow(t, i)).join("")
				: `<p class="lib-empty-sub">No recent plays yet.</p>`;
		}

		const playlistGrid = viewRoot.querySelector("#lib-playlist-grid");
		if (playlistGrid) {
			const addCard = playlistGrid.querySelector(".lib-playlist-card--add");
			const cards = playlists.map(renderPlaylistCard).join("");
			playlistGrid.innerHTML = `${cards}${addCard ? addCard.outerHTML : ""}`;
		}

		const playlistListMobile = viewRoot.querySelector("#lib-playlist-list-mobile");
		if (playlistListMobile) {
			playlistListMobile.innerHTML = playlists.length
				? playlists.map(renderPlaylistItemMobile).join("")
				: `<p class="lib-empty-sub">No playlists created yet.</p>`;
		}

		const artistRow = viewRoot.querySelector("#lib-artist-row, #lib-artist-row-mobile");
		if (artistRow) {
			artistRow.innerHTML = artists.length
				? artists.map(renderArtistChip).join("")
				: `<p class="lib-empty-sub">No followed artists yet.</p>`;
		}
	};

	const render = async () => {
		if (!isMounted) return;
		const view = await UI()({ state, ctx });
		root.replaceChildren(view);
		if (state === "content") hydrateContent(view);
		libraryEvents(view);

		const retryBtn =
			view.querySelector("#lib-retry-btn") ||
			view.querySelector("#lib-retry-btn-mobile");
		if (retryBtn) retryBtn.addEventListener("click", () => loadData());
	};

	const loadData = async () => {
		try {
			if (!isMounted) return;

			if (!store?.auth?.isLoggedIn && !store?.auth?.user) {
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
				summary: payload?.summary || {
					totalLiked: sections.likedTracks?.length || 0,
					totalPlaylists: sections.playlists?.length || 0,
					totalUploads: sections.upload?.length || 0,
				},
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

			state = hasAnyContent ? "content" : "empty";
			await render();
		} catch (error) {
			if (error?.name !== "AbortError" && isMounted) {
				console.error("[LibraryPage] Load error:", error);
				if (error?.status === 401 || error?.status === 403) {
					state = "auth";
				} else {
					state = "error";
				}
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

