import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import {
	formatTrackCount,
	isOwnerOfPlaylist,
	hasSavedPlaylist,
} from "./playlist.helpers.js";
import "./Playlist.styles.css";

/**
 * PlaylistDesktop — playlist detail view
 *
 * @async
 * @param {Object} props
 * @param {string} props.state - "skeleton" | "notFound" | "private" | "content" | "error"
 * @param {Object} props.playlist
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const PlaylistDesktop = async ({ state, playlist, ctx }) => {
	const root = new CreateElement("section");
	root.addClass("playlist-section", "main-sections").setId("playlist-section");

	const trackRow = (t, i) => `
		<div class="playlist-track-row" data-playlist-track-index="${i}">
			<span class="playlist-track-num">${i + 1}</span>
			<div class="playlist-track-cover">
				<img src="${t.cover?.storage?.baseUrl ?? ""}" alt="" onerror="this.style.display='none'" />
				<i class="bi bi-music-note-beamed"></i>
			</div>
			<div class="playlist-track-info">
				<p class="playlist-track-title">${t.title}</p>
				<p class="playlist-track-artist">${t.artist}</p>
			</div>
		</div>
	`;

	const contentState = () => {
		const own = isOwnerOfPlaylist(playlist);
		const saved = hasSavedPlaylist(playlist);
		const tracks = playlist.trackIds ?? [];

		return buildNode(`
			<section class="playlist-sub-section" id="playlist-content" data-content="content">
				<div class="playlist-scroll" data-scroll-container>

					<a href="#" class="playlist-back-btn" data-back data-fallback="/">
						<i class="bi bi-arrow-left"></i> Back
					</a>

					<div class="playlist-hero">
						<div class="playlist-cover-lg">
							${
								playlist.cover?.storage?.baseUrl
									? `<img src="${playlist.cover.storage.baseUrl}" alt="" />`
									: `<i class="bi bi-music-note-list"></i>`
							}
						</div>
						<div class="playlist-hero-info">
							<span class="playlist-visibility-badge">
								<i class="bi ${playlist.visibility === "private" ? "bi-lock-fill" : "bi-globe2"}"></i>
								${playlist.visibility}
							</span>
							<h1 class="playlist-name">${playlist.name}</h1>
							${playlist.description ? `<p class="playlist-description">${playlist.description}</p>` : ""}
							<div class="playlist-meta-row" data-playlist-creator>
								<img src="${playlist.user?.avatar?.storage?.baseUrl ?? ""}" alt=""
									class="playlist-creator-avatar" onerror="this.style.visibility='hidden'" />
								<span class="playlist-creator-name">${playlist.user?.username ?? "Unknown"}</span>
								<span class="playlist-meta-dot"></span>
								<span class="playlist-track-count">${formatTrackCount(tracks.length)}</span>
							</div>

							${
								!own
									? `<button class="playlist-save-btn ${saved ? "playlist-save-btn--active" : ""}" data-playlist-save-btn>
										<i class="bi ${saved ? "bi-bookmark-check-fill" : "bi-bookmark-plus"}"></i>
										${saved ? "Saved" : "Save"}
									</button>`
									: ""
							}
						</div>
					</div>

					<div class="playlist-track-list">
						${
							tracks.length
								? tracks.map(trackRow).join("")
								: `<p class="playlist-empty-text">This playlist has no tracks yet.</p>`
						}
					</div>
				</div>
			</section>
		`);
	};

	const notFoundState = () =>
		buildNode(`
			<section class="playlist-sub-section playlist-sub-section--centered" id="playlist-not-found" data-content="notFound">
				<div class="playlist-empty-icon"><i class="bi bi-collection-play"></i></div>
				<h3 class="playlist-empty-title">Playlist not found</h3>
				<p class="playlist-empty-sub">This playlist doesn't exist or the link is broken.</p>
				<a href="/" class="playlist-btn-ghost" data-replace>Go Home</a>
			</section>
		`);

	const privateState = () =>
		buildNode(`
			<section class="playlist-sub-section playlist-sub-section--centered" id="playlist-private" data-content="private">
				<div class="playlist-empty-icon"><i class="bi bi-lock-fill"></i></div>
				<h3 class="playlist-empty-title">This playlist is private</h3>
				<p class="playlist-empty-sub">Only the creator can view this playlist.</p>
			</section>
		`);

	const errorState = () =>
		buildNode(`
			<section class="playlist-sub-section playlist-sub-section--centered" id="playlist-error" data-content="error">
				<div class="playlist-error-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
				<h3 class="playlist-error-title">Something went wrong</h3>
				<p class="playlist-error-sub">We couldn't load this playlist.</p>
				<button class="playlist-btn-accent" data-playlist-retry>Try Again</button>
			</section>
		`);

	const skeletonState = () =>
		buildNode(`
			<section class="playlist-sub-section" id="playlist-skeleton" data-content="skeleton">
				<div class="playlist-hero">
					<div class="playlist-sk playlist-sk--cover-lg"></div>
					<div style="flex:1;display:flex;flex-direction:column;gap:8px">
						<div class="playlist-sk playlist-sk--text-sm" style="width:70px"></div>
						<div class="playlist-sk playlist-sk--text-lg" style="width:220px"></div>
						<div class="playlist-sk playlist-sk--text-sm" style="width:140px"></div>
					</div>
				</div>
				${[1, 2, 3, 4]
					.map(
						() => `
					<div class="playlist-sk-row">
						<div class="playlist-sk playlist-sk--track-cover"></div>
						<div style="flex:1;display:flex;flex-direction:column;gap:5px">
							<div class="playlist-sk playlist-sk--text-md"></div>
							<div class="playlist-sk playlist-sk--text-sm" style="width:50%"></div>
						</div>
					</div>
				`,
					)
					.join("")}
			</section>
		`);

	const getStateView = (state) => {
		switch (state) {
			case "notFound":
				return notFoundState();
			case "private":
				return privateState();
			case "content":
				return contentState();
			case "error":
				return errorState();
			default:
				return skeletonState();
		}
	};

	root.append(getStateView(state));
	return root.getElement();
};
