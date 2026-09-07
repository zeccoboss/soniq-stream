import { viewNavigate } from "@zecco/utils/view-navigate.js";
import "./PlaylistCard.styles.css";

/**
 * Build the HTML for one playlist card. Pure template — no DOM writes,
 * no event binding. Pair with wirePlaylistCardClicks() for interactivity.
 *
 * @param {Object} playlist
 * @param {Object} [options]
 * @param {boolean} [options.showOwner] - show "By {username}" instead of
 *   track count — use this for "saved from others" grids (Library later),
 *   leave false for a user's own playlists (Profile).
 */
export const buildPlaylistCardHTML = (playlist, { showOwner = false } = {}) => `
	<div class="playlist-card" data-playlist-card-uuid="${playlist.uuid}">
		<div class="playlist-card-cover">
			${
				playlist.cover?.storage?.baseUrl
					? `<img src="${playlist.cover.storage.baseUrl}" alt="" onerror="this.style.display='none'" />`
					: ""
			}
			<i class="bi bi-music-note-list playlist-card-fallback-icon"></i>
			<div class="playlist-card-play-overlay"><i class="bi bi-play-fill"></i></div>
		</div>
		<p class="playlist-card-name">${playlist.name}</p>
		<p class="playlist-card-meta">
			${
				showOwner && playlist.user
					? `By ${playlist.user.username}`
					: `${playlist.trackCount ?? playlist.trackIds?.length ?? 0} tracks`
			}
		</p>
	</div>
`;

/** Render a list of playlists as cards, joined into one HTML string. */
export const renderPlaylistCards = (playlists = [], options = {}) =>
	playlists.map((p) => buildPlaylistCardHTML(p, options)).join("");

/**
 * ONE delegated listener on whatever container you pass — safe to call
 * once even if cards get re-rendered later, since the listener lives on
 * the ancestor, not the cards themselves. Navigates as a "view" (drill-in),
 * same convention as Profile's follow-through links.
 */
export const wirePlaylistCardClicks = (root) => {
	root.addEventListener("click", (e) => {
		const card = e.target.closest("[data-playlist-card-uuid]");
		if (!card) return;
		viewNavigate("/playlist", { identifier: card.dataset.playlistCardUuid });
	});
};
