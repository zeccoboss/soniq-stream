import { formatTrackDuration } from "@zecco/utils/format-track-duration";

const DEFAULT_COVER = "/src/assets/images/default-profile.png";

export const escapeHtml = (value = "") =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

export const initials = (value = "?") => value.trim().charAt(0).toUpperCase();

export const toCoverUrl = (cover) =>
	cover?.url ||
	(cover?.storage?.baseUrl && cover?.storage?.key
		? new URL(cover.storage.key, cover.storage.baseUrl).href
		: DEFAULT_COVER);

export const renderTrackRow = (track, index) => {
	const title = track?.title ?? "Untitled";
	const artist = track?.artist ?? "Unknown Artist";
	const cover = toCoverUrl(track?.cover);
	return `
		<div class="lib-track-row" data-track-uuid="${track?.uuid ?? ""}" data-artist-uuid="${track?.user?.uuid ?? ""}">
			<span class="lib-track-num">${index + 1}</span>
			<div class="lib-track-cover">
				<img src="${cover}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_COVER}'" />
			</div>
			<div class="lib-track-info">
				<div class="lib-track-title">${escapeHtml(title)}</div>
				<div class="lib-track-artist">${escapeHtml(artist)}</div>
			</div>
			<div class="lib-track-right">
				<span class="lib-track-dur">${formatTrackDuration(track?.duration)}</span>
				<button class="lib-track-more" data-track-options aria-label="More options">
					<i class="bi bi-three-dots-vertical"></i>
				</button>
			</div>
		</div>
	`;
};

export const renderPlaylistCard = (playlist) => {
	const name = playlist?.name ?? "Untitled Playlist";
	const count = playlist?.trackCount ?? playlist?.trackIds?.length ?? 0;
	return `
		<div class="lib-playlist-card" data-playlist-uuid="${playlist?.uuid ?? ""}">
			<div class="lib-playlist-cover">
				${
					playlist?.cover?.storage?.baseUrl
						? `<img src="${playlist.cover.storage.baseUrl}" alt="" onerror="this.style.display='none'" />`
						: `<i class="bi bi-music-note-list"></i>`
				}
			</div>
			<p class="lib-playlist-title">${escapeHtml(name)}</p>
			<p class="lib-playlist-sub">${count} track${count === 1 ? "" : "s"}</p>
		</div>
	`;
};

export const renderPlaylistItemMobile = (playlist) => {
	const name = playlist?.name ?? "Untitled Playlist";
	const count = playlist?.trackCount ?? playlist?.trackIds?.length ?? 0;
	return `
		<div class="lib-playlist-item-mobile" data-playlist-uuid="${playlist?.uuid ?? ""}">
			<div class="lib-playlist-item-cover">
				${
					playlist?.cover?.storage?.baseUrl
						? `<img src="${playlist.cover.storage.baseUrl}" alt="" onerror="this.style.display='none'" />`
						: `<i class="bi bi-music-note-list"></i>`
				}
			</div>
			<div class="lib-playlist-item-info">
				<div class="lib-playlist-item-title">${escapeHtml(name)}</div>
				<div class="lib-playlist-item-sub">${count} track${count === 1 ? "" : "s"}</div>
			</div>
		</div>
	`;
};

export const renderArtistChip = (track) => {
	const name = track?.artist ?? "Unknown";
	return `
		<div class="lib-artist-chip" data-artist-uuid="${track?.user?.uuid ?? ""}">
			<div class="lib-artist-avatar">
				${
					track?.user?.avatar?.storage?.baseUrl
						? `<img src="${track.user.avatar.storage.baseUrl}" alt="" onerror="this.style.display='none'" />`
						: initials(name)
				}
			</div>
			<div class="lib-artist-name">${escapeHtml(name)}</div>
		</div>
	`;
};

export const getUniqueArtists = (tracks = []) => {
	const seen = new Set();
	return tracks.filter((t) => {
		const key = (t?.artist || "").toLowerCase().trim();
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

// Single source of truth for each drill-in section — hero cards, filter
// tabs, and "See all" links all point at these same `section` values.
export const LIBRARY_SECTIONS = {
	liked: { title: "Liked Songs", icon: "bi-heart-fill" },
	upload: { title: "Your Uploads", icon: "bi-cloud-upload-fill" },
	playlists: { title: "Your Playlists", icon: "bi-music-note-list" },
	recent: { title: "Recently Played", icon: "bi-clock-history" },
	following: { title: "Artists You Follow", icon: "bi-people-fill" },
};
