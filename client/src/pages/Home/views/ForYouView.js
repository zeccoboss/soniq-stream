import { buildNode } from "@zecco/utils/dom/build-node.js";
import { formatTrackDuration } from "@zecco/utils/format-track-duration.js";

/**
 * ForYouView — For You tab content
 *
 * Three modes:
 *   1. Not logged in  → authGate() + popularRightNowSection()
 *   2. No history yet → emptyBanner() + tasteSetupSection() + popularRightNowSection()
 *   3. Has data       → recentPlaysSection() + likedSection() + genreRecsSection() + popularRightNowSection()
 *
 * Data shape:
 *   isLoggedIn      boolean
 *   hasEnoughData   boolean
 *   recentPlays     [{ id, title, artist, cover, genre }]
 *   liked           [{ id, title, artist, cover, genre }]
 *   genreRecs       [{ id, title, artist, cover, genre }]
 *   popularRightNow [{ id, title, artist, cover, genre, duration }]
 *   topGenre        string | null
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

// Track card — horizontal scroll
const trackCard = (track) =>
	`<div class="home-track-card" data-uuid="${track.uuid ?? ""}">
		<div class="home-track-card-cover">
			${coverImg(track.cover, track.title)}
			<button class="home-card-play" aria-label="Play ${track.title}">
				<i class="bi bi-play-fill"></i>
			</button>
		</div>
		<span class="home-card-title">${track.title}</span>
		<span class="home-card-artist">${track.artist}</span>
	</div>`;

// Track row — vertical list
const trackRow = (track, index) =>
	`<div class="home-track-row" data-uuid="${track.uuid ?? ""}" data-index="${index}">
		<span class="home-track-num">${index + 1}</span>
		<div class="home-track-cover">${coverImg(track.cover, track.title)}</div>
		<div class="home-track-meta">
			<span class="home-track-title">${track.title}</span>
			<span class="home-track-artist">${track.artist}</span>
			${track.genre ? `<div class="home-track-tags"><span class="home-track-tag">${track.genre.toUpperCase()}</span></div>` : ""}
		</div>
		<div class="home-track-actions">
			<span class="home-track-dur">${formatTrackDuration(track.duration)}</span>
			<button class="home-track-more" aria-label="More options">
				<i class="bi bi-three-dots-vertical"></i>
			</button>
		</div>
	</div>`;

// ── Auth gate ─────────────────────────────────────────────────
const authGate = () =>
	`<div class="home-foryou-auth-gate">
		<div class="home-foryou-auth-icon">
			<i class="bi bi-person-circle"></i>
		</div>
		<h3 class="home-foryou-auth-title">Your personal space</h3>
		<p class="home-foryou-auth-sub">
			Log in to see your recent plays, liked tracks, and personalised recommendations.
		</p>
		<div class="home-foryou-auth-btns">
			<a href="/auth/login" class="home-cta-btn">
				<i class="bi bi-box-arrow-in-right"></i> Login
			</a>
			<a href="/auth/register" class="home-cta-ghost-btn">Sign up</a>
		</div>
	</div>`;

// ── Empty banner ──────────────────────────────────────────────
// Shown when logged in but no history yet
const emptyBanner = () =>
	`<div class="home-foryou-empty-banner" id="home-foryou-empty-banner">
		<div class="home-foryou-empty-icon">
			<i class="bi bi-headphones"></i>
		</div>
		<div class="home-foryou-empty-body">
			<h3 class="home-foryou-empty-title">Nothing here yet</h3>
			<p class="home-foryou-empty-sub">
				Start listening and your recent plays will show up here automatically.
			</p>
			<a href="/?tab=discover" class="home-cta-btn" data-replace>
				<i class="bi bi-compass"></i> Browse Discover
			</a>
		</div>
	</div>`;

// ── Taste setup section ───────────────────────────────────────
const tasteSetupSection = () =>
	`<section class="home-sec" id="home-foryou-setup">
		${sectionHead("Set Up Your Taste", "home-foryou-skip", "Skip")}
		<div class="home-taste-chips" id="home-taste-chips">
			<button class="home-taste-chip" data-action="pick-genres">
				<i class="bi bi-music-note-list"></i> Pick Genres
			</button>
			<button class="home-taste-chip" data-action="pick-artists">
				<i class="bi bi-person-heart"></i> Pick Artists
			</button>
			<button class="home-taste-chip" data-action="pick-moods">
				<i class="bi bi-emoji-smile"></i> Pick Moods
			</button>
		</div>
	</section>`;

// ── Recent plays ──────────────────────────────────────────────
const recentPlaysSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-recent-plays">
			${sectionHead("Recently Played", "home-see-all-recent")}
			<div class="home-hscroll">${tracks.map(trackCard).join("")}</div>
		</section>`;
};

// ── Liked tracks ──────────────────────────────────────────────
const likedSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-liked-section">
			${sectionHead("Liked Tracks", "home-see-all-liked")}
			<div class="home-hscroll">${tracks.map(trackCard).join("")}</div>
		</section>`;
};

// ── Genre recommendations ─────────────────────────────────────
const genreRecsSection = (tracks = [], topGenre = null) => {
	if (!tracks.length || !topGenre) return "";
	return `
		<section class="home-sec" id="home-genre-recs">
			${sectionHead(`More ${topGenre}`, "home-see-all-genre-recs")}
			<div class="home-hscroll">${tracks.map(trackCard).join("")}</div>
		</section>`;
};

// ── Popular right now (always shown as fallback) ──────────────
const popularRightNowSection = (tracks = []) => {
	if (!tracks.length) return "";
	return `
		<section class="home-sec" id="home-popular-now">
			${sectionHead("Popular Right Now", "home-see-all-popular")}
			<div class="home-track-list">${tracks.map((t, i) => trackRow(t, i)).join("")}</div>
		</section>`;
};

// ── Main export ───────────────────────────────────────────────
export const ForYouView = (data = {}, isMobile = false) => {
	const {
		isLoggedIn = false,
		hasEnoughData = false,
		recentPlays = [],
		liked = [],
		genreRecs = [],
		popularRightNow = [],
		topGenre = null,
	} = data;

	if (!isLoggedIn) {
		return buildNode(`
			<div class="home-tab-view home-foryou-view" data-tab="foryou">
				${authGate()}
				${popularRightNowSection(popularRightNow)}
			</div>`);
	}

	if (!hasEnoughData) {
		return buildNode(`
			<div class="home-tab-view home-foryou-view" data-tab="foryou">
				${emptyBanner()}
				${tasteSetupSection()}
				${popularRightNowSection(popularRightNow)}
			</div>`);
	}

	return buildNode(`
		<div class="home-tab-view home-foryou-view" data-tab="foryou">
			${recentPlaysSection(recentPlays)}
			${likedSection(liked)}
			${genreRecsSection(genreRecs, topGenre)}
			${popularRightNowSection(popularRightNow)}
		</div>`);
};
