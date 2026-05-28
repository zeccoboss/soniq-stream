import { buildNode } from "@zecco/utils/dom/build-node.js";

/**
 * ExploreView — Explore tab content
 *
 * Data shape:
 *   genres          [{ name, icon, colorClass }]
 *   trendingArtists [{ username, username, avatar, uploadsCount }]
 *   newThisWeek     [{ id, title, artist, cover, genre }]
 *   trendingTracks  [{ id, title, artist, cover, plays }]
 *   activeFilter    "all" | "genres" | "artists" | "trending" | "new"
 */

const initials = (str = "?") => str?.trim().charAt(0).toUpperCase();

const coverImg = (src, alt) =>
	`<img src="${src || "/src/assets/images/track-cover.png"}" alt="${alt}"
		class="home-cover-img" loading="lazy"
		onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
	<div class="home-cover-fallback">${initials(alt)}</div>`;

const sectionHead = (title, actionId = "", actionLabel = "See all") =>
	`<div class="home-sec-head">
		<h2 class="home-sec-title">${title}</h2>
		${actionId ? `<button class="home-sec-action" id="${actionId}">${actionLabel} <i class="bi bi-arrow-right"></i></button>` : ""}
	</div>`;

// ── Filter chips ─────────────────────────────────────────────
const filterChips = (activeFilter = "all") => {
	const filters = [
		{ id: "all", icon: "bi-circle", label: "All" },
		{ id: "genres", icon: "bi-music-note", label: "Genres" },
		{ id: "artists", icon: "bi-person", label: "Artists" },
		{ id: "trending", icon: "bi-graph-up-arrow", label: "Trending" },
		{ id: "new", icon: "bi-grid", label: "New" },
	];
	return `
		<div class="home-filter-chips" id="home-explore-filters">
			${filters
				.map(
					(f) => `
				<button class="home-filter-chip ${activeFilter === f.uuid ? "active" : ""}"
					data-filter="${f.uuid}">
					<i class="bi ${f.icon}"></i> ${f.label}
				</button>`,
				)
				.join("")}
		</div>`;
};

// ── Genre grid ───────────────────────────────────────────────
const genreGrid = (genres = []) => {
	if (!genres.length) return "";
	return `
		<section class="home-sec home-explore-sec" id="home-explore-genres" data-section="genres">
			${sectionHead("Browse Genres", "home-explore-see-all-genres")}
			<div class="home-genre-grid">
				${genres
					.map(
						(g) => `
					<button class="home-genre-card ${g.colorClass ?? ""}" data-genre="${g.name}">
						<i class="bi ${g.icon ?? "bi-music-note"} home-genre-icon"></i>
						<span class="home-genre-label">${g.name}</span>
					</button>`,
					)
					.join("")}
			</div>
		</section>`;
};

// ── Trending artists row ─────────────────────────────────────
const trendingArtistsSection = (artists = []) => {
	if (!artists.length) return "";
	return `
		<section class="home-sec home-explore-sec" id="home-explore-artists" data-section="artists">
			${sectionHead("Trending Artists", "home-explore-see-all-artists")}
			<div class="home-artist-scroll">
				${artists
					.map((a) => {
						return `
					<div class="home-artist-card" data-username="${a.username ?? ""}" data-uuid="${a.uuid ?? ""}">
						<div class="home-artist-avatar">
							<img src="${a.avatar || "/src/assets/images/default-profile.png"}"
								alt="${a.username}" class="home-artist-img" loading="lazy"
								onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" />
							<div class="home-artist-fallback">${initials(a.username)}</div>
						</div>
						<span class="home-artist-name">${a.username}</span>
						<span class="home-artist-meta">${a.uploadsCount ?? 0} track${(a.uploadsCount ?? 0) !== 1 ? "s" : ""}</span>
					</div>`;
					})
					.join("")}
			</div>
		</section>`;
};

// ── Trending tracks (horizontal scroll) ─────────────────────
const trendingTracksSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec home-explore-sec" id="home-explore-trending" data-section="trending">
			${sectionHead("Trending", "home-explore-see-all-trending")}
			<div class="home-hscroll">
				${tracks
					.map(
						(t) => `
					<div class="home-track-card" data-uuid="${t.uuid ?? ""}">
						<div class="home-track-card-cover">
							${coverImg(t.cover, t.title)}
							<button class="home-card-play" aria-label="Play ${t.title}">
								<i class="bi bi-play-fill"></i>
							</button>
						</div>
						<span class="home-card-title">${t.title}</span>
						<span class="home-card-artist">${t.artist}</span>
						${t.plays != null ? `<span class="home-card-plays"><i class="bi bi-play"></i> ${Number(t.plays).toLocaleString()}</span>` : ""}
					</div>`,
					)
					.join("")}
			</div>
		</section>`;
};

// ── New this week (horizontal scroll) ───────────────────────
const newThisWeekSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec home-explore-sec" id="home-explore-new" data-section="new">
			${sectionHead("New This Week", "home-explore-see-all-new")}
			<div class="home-hscroll">
				${tracks
					.map(
						(t) => `
					<div class="home-track-card" data-uuid="${t.uuid ?? ""}">
						<div class="home-track-card-cover">
							${coverImg(t.cover, t.title)}
							<button class="home-card-play" aria-label="Play ${t.title}">
								<i class="bi bi-play-fill"></i>
							</button>
						</div>
						<span class="home-card-title">${t.title}</span>
						<span class="home-card-artist">${t.artist}</span>
					</div>`,
					)
					.join("")}
			</div>
		</section>`;
};

// ── Empty state ──────────────────────────────────────────────
const exploreEmptyState = () =>
	`<div class="home-discover-empty">
		<div class="home-discover-empty-icon"><i class="bi bi-compass"></i></div>
		<h3 class="home-discover-empty-title">Nothing to explore yet</h3>
		<p class="home-discover-empty-sub">Content will appear here as artists upload. Check back soon.</p>
	</div>`;

// ── Main export ──────────────────────────────────────────────
export const ExploreView = (data = {}, isMobile = false) => {
	const {
		genres = [],
		trendingArtists = [],
		newThisWeek = [],
		trendingTracks = [],
		activeFilter = "all",
	} = data;

	const hasContent =
		genres.length ||
		trendingArtists.length ||
		newThisWeek.length ||
		trendingTracks.length;

	return buildNode(`
		<div class="home-tab-view home-explore-view" data-tab="explore">
			${filterChips(activeFilter)}
			${
				!hasContent
					? exploreEmptyState()
					: `${genreGrid(genres)}
				   ${trendingTracksSection(trendingTracks)}
				   ${trendingArtistsSection(trendingArtists)}
				   ${newThisWeekSection(newThisWeek)}`
			}
		</div>
	`);
};
