import { buildNode } from "@zecco/utils/dom/build-node.js";
import { formatTrackDuration } from "@zecco/utils/format-track-duration.js";

/**
 * DiscoverView — Discover tab content
 *
 * Named factories, each returns an Element via buildNode.
 * Add new sections by creating a new named function and
 * appending it in discoverView().
 *
 * Data shape:
 *   genres        [{ name, icon, colorClass }]
 *   newUploads    [{ id, title, artist, cover, genre, duration }]
 *   trending      [{ id, title, artist, cover, plays }]
 *   topTracks     [{ id, title, artist, cover, genre, duration }]
 *   activeGenre   string | "all"
 *
 * @param {Object} data
 * @param {boolean} isMobile
 * @returns {Element}
 */

// ── Shared atom builders ─────────────────────────────────────
const initials = (str = "?") => str?.trim().charAt(0).toUpperCase();

const coverImg = (src, alt, cls = "") =>
	`<img
		src="${src || "/src/assets/images/track-cover.png"}"
		alt="${alt}"
		class="home-cover-img ${cls}"
		loading="lazy"
		onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
	/>
	<div class="home-cover-fallback">${initials(alt)}</div>`;

// ── Section head ─────────────────────────────────────────────
const sectionHead = (title, actionId = "", actionLabel = "See all") =>
	`<div class="home-sec-head">
		<h2 class="home-sec-title">${title}</h2>
		${
			actionId
				? `<button class="home-sec-action" id="${actionId}">
					${actionLabel} <i class="bi bi-arrow-right"></i>
				</button>`
				: ""
		}
	</div>`;

// ── Search bar (fake — routes to /search) ────────────────────
const searchBar = () => `
	<div class="home-search-bar" id="home-discover-search" role="button" tabindex="0"
		aria-label="Open search">
		<i class="bi bi-search home-search-icon"></i>
		<span class="home-search-placeholder">Search songs, artists…</span>
	</div>
`;

// ── Genre chips (toggle filters) ─────────────────────────────
// Genre clicking filters newUploads + topTracks in-view.
// "All" resets. NOT a route change — home.events.js handles toggle.
const genreChips = (genres = [], activeGenre = "all") => `
	<div class="home-genre-chips" id="home-genre-chips">
		<button class="home-chip ${activeGenre === "all" ? "active" : ""}"
			data-genre="all">All</button>
		${genres
			.map(
				(g) => `
			<button class="home-chip ${activeGenre === g.name ? "active" : ""}"
				data-genre="${g.name}">${g.name}</button>
		`,
			)
			.join("")}
	</div>
`;

// ── Genre card grid (horizontal scroll) ─────────────────────
const genreCardRow = (genres = []) => `
	<div class="home-genre-scroll" id="home-genre-scroll">
		${genres
			.map(
				(g) => `
			<button class="home-genre-card ${g.colorClass ?? ""}" data-genre="${g.name}">
				<i class="bi ${g.icon ?? "bi-music-note"} home-genre-icon"></i>
				<span class="home-genre-label">${g.name}</span>
			</button>
		`,
			)
			.join("")}
	</div>
`;

// ── Track row item (vertical list) ──────────────────────────
const trackRow = (track, index) => `
	<div class="home-track-row" data-id="${track.id ?? ""}" data-index="${index}">
		<span class="home-track-num">${index + 1}</span>
		<div class="home-track-cover">
			${coverImg(track.cover, track.title)}
		</div>
		<div class="home-track-meta">
			<span class="home-track-title">${track.title}</span>
			<span class="home-track-artist">${track.artist}</span>
			${
				track.genre
					? `<div class="home-track-tags">
						<span class="home-track-tag">${track.genre.toUpperCase()}</span>
					</div>`
					: ""
			}
		</div>
		<div class="home-track-actions">
			<span class="home-track-dur">${formatTrackDuration(track.duration)}</span>
			<button class="home-track-more" aria-label="More options">
				<i class="bi bi-three-dots-vertical"></i>
			</button>
		</div>
	</div>
`;

// ── Track card (horizontal scroll card) ─────────────────────
const trackCard = (track) => `
	<div class="home-track-card" data-id="${track.id ?? ""}">
		<div class="home-track-card-cover">
			${coverImg(track.cover, track.title)}
			<button class="home-card-play" aria-label="Play ${track.title}">
				<i class="bi bi-play-fill"></i>
			</button>
		</div>
		<span class="home-card-title">${track.title}</span>
		<span class="home-card-artist">${track.artist}</span>
		${
			track.plays != null
				? `<span class="home-card-plays">
					<i class="bi bi-play"></i> ${Number(track.plays).toLocaleString()}
				</span>`
				: ""
		}
	</div>
`;

// ── New upload section ──────────────────────────────────────
const newUploadsSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-new-upload">
			${sectionHead("New upload", "home-see-all-upload")}
			<div class="home-track-list" id="home-upload-list">
				${tracks.map((t, i) => trackRow(t, i)).join("")}
			</div>
		</section>
	`;
};

// ── Trending section (horizontal snap scroll) ────────────────
const trendingSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-trending">
			${sectionHead("Trending Now", "home-see-all-trending")}
			<div class="home-hscroll" id="home-trending-scroll">
				${tracks.map(trackCard).join("")}
			</div>
		</section>
	`;
};

// ── Top Tracks section (vertical list) ──────────────────────
const topTracksSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-top-tracks">
			${sectionHead("Top Tracks", "home-see-all-top")}
			<div class="home-track-list" id="home-top-list">
				${tracks.map((t, i) => trackRow(t, i)).join("")}
			</div>
		</section>
	`;
};

// ── Empty discover state ─────────────────────────────────────
const discoverEmptyState = () => `
	<div class="home-discover-empty">
		<div class="home-discover-empty-icon">
			<i class="bi bi-music-note-beamed"></i>
		</div>
		<h3 class="home-discover-empty-title">No tracks yet</h3>
		<p class="home-discover-empty-sub">
			The platform is quiet. Be the first to upload and start the community.
		</p>
		<a href="/upload" class="home-cta-btn">
			<i class="bi bi-cloud-upload"></i> Upload a Track
		</a>
	</div>
`;

// ── Main export ──────────────────────────────────────────────
/**
 * @param {Object} data
 * @param {boolean} isMobile
 * @returns {Element}
 */
export const DiscoverView = (data = {}, isMobile = false) => {
	const {
		genres = [],
		newUploads = [],
		trending = [],
		topTracks = [],
		activeGenre = "all",
	} = data;

	const hasContent = newUploads.length || trending.length || topTracks.length;

	const html = `
		<div class="home-tab-view home-discover-view" data-tab="discover">
			<!-- ${searchBar()} -->
			${genreChips(genres, activeGenre)}

			${
				!hasContent
					? discoverEmptyState()
					: `
					<div class="home-genre-row-wrap">
						${sectionHead("Browse Genres", "home-see-all-genres")}
						${genreCardRow(genres)}
					</div>
					${newUploadsSection(newUploads)}
					${trendingSection(trending)}
					${topTracksSection(topTracks)}
				`
			}
		</div>
	`;

	return buildNode(html);
};
