import { buildNode } from "@zecco/utils/dom/build-node";
import CreateElement from "@zecco/utils/dom/create-element";
import defaultCover from "@zecco/assets/images/track-cover.png";
import "./MobileFullPlayer.css";

const MobileFullPlayer = () => {
	const page = new CreateElement("section");
	page.addClass("mobile-full-player", "app-page").setId("full-player");

	// ── Private view factories ───────────────────────────────────────────────

	// VIEW 1 — Now playing (default)
	const playerView = () =>
		buildNode(`
			<div class="mfp-view active-mfp-view" id="mfp-player-view" data-view="player">

				<!-- Ambient background — tinted by track colour via JS -->
				<div class="mfp-bg" id="mfp-bg"></div>

				<!-- Top bar -->
				<div class="mfp-topbar">
					<button class="mfp-icon-btn" id="mfp-collapse-btn" aria-label="Collapse player">
						<i class="bi bi-chevron-down"></i>
					</button>
					<span class="mfp-label">Now Playing</span>
					<button class="mfp-icon-btn" id="mfp-more-btn" aria-label="More options">
						<i class="bi bi-three-dots"></i>
					</button>
				</div>

				<!-- Artwork -->
				<div class="mfp-artwork-wrap">
					<div class="mfp-artwork" id="mfp-artwork">
						<img
							src="${defaultCover}"
							alt="Track artwork"
							class="mfp-artwork-img"
							id="mfp-artwork-img"
							onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
						/>
						<div class="mfp-artwork-fallback" id="mfp-artwork-fallback">
							<i class="bi bi-music-note-beamed"></i>
						</div>
					</div>
				</div>

				<!-- Track info + like -->
				<div class="mfp-track-info">
					<div class="mfp-track-text">
						<div class="mfp-track-title" id="mfp-track-title">Midnight Drive</div>
						<div class="mfp-track-artist" id="mfp-track-artist">Artist Name · Afrobeats</div>
					</div>
					<button class="mfp-like-btn" id="mfp-like-btn" aria-label="Like track">
						<i class="bi bi-heart" id="mfp-like-icon"></i>
					</button>
				</div>

				<!-- Progress bar -->
				<div class="mfp-progress-wrap">
					<div class="mfp-progress-bar" id="mfp-progress-bar" role="slider" aria-label="Track progress">
						<div class="mfp-progress-fill" id="mfp-progress-fill"></div>
					</div>
					<div class="mfp-progress-times">
						<span class="mfp-time" id="mfp-time-current">0:00</span>
						<span class="mfp-time" id="mfp-time-total">0:00</span>
					</div>
				</div>

				<!-- Playback controls -->
				<div class="mfp-controls">
					<div class="mfp-ctrl-side">
						<button class="mfp-ctrl" id="mfp-shuffle-btn" aria-label="Shuffle">
							<i class="bi bi-shuffle"></i>
						</button>
						<button class="mfp-ctrl" id="mfp-prev-btn" aria-label="Previous">
							<i class="bi bi-skip-start-fill"></i>
						</button>
					</div>
					<button class="mfp-ctrl-play" id="mfp-play-btn" aria-label="Play/Pause">
						<i class="bi bi-play-fill" id="mfp-play-icon"></i>
					</button>
					<div class="mfp-ctrl-side">
						<button class="mfp-ctrl" id="mfp-next-btn" aria-label="Next">
							<i class="bi bi-skip-end-fill"></i>
						</button>
						<button class="mfp-ctrl" id="mfp-repeat-btn" aria-label="Repeat">
							<i class="bi bi-repeat"></i>
						</button>
					</div>
				</div>

				<!-- Volume -->
				<div class="mfp-volume">
					<i class="bi bi-volume-down mfp-vol-icon"></i>
					<div class="mfp-vol-bar" id="mfp-vol-bar" role="slider" aria-label="Volume">
						<div class="mfp-vol-fill" id="mfp-vol-fill"></div>
					</div>
					<i class="bi bi-volume-up mfp-vol-icon"></i>
				</div>

				<!-- Extra actions -->
				<div class="mfp-extra-actions">
					<button class="mfp-extra-btn" id="mfp-add-to-btn">
						<div class="mfp-extra-icon">
							<i class="bi bi-plus-lg"></i>
						</div>
						<span class="mfp-extra-label">Add to</span>
					</button>
					<button class="mfp-extra-btn" id="mfp-share-btn">
						<div class="mfp-extra-icon">
							<i class="bi bi-share"></i>
						</div>
						<span class="mfp-extra-label">Share</span>
					</button>
					<button class="mfp-extra-btn" id="mfp-artist-btn">
						<div class="mfp-extra-icon">
							<i class="bi bi-person"></i>
						</div>
						<span class="mfp-extra-label">Artist</span>
					</button>
					<button class="mfp-extra-btn" id="mfp-save-btn">
						<div class="mfp-extra-icon">
							<i class="bi bi-download"></i>
						</div>
						<span class="mfp-extra-label">Save</span>
					</button>
				</div>

				<!-- Queue pill — taps to open queue view -->
				<button class="mfp-queue-pill" id="mfp-queue-pill-btn" aria-label="Open queue">
					<i class="bi bi-list-ul mfp-queue-pill-icon"></i>
					<div class="mfp-queue-pill-text">
						<div class="mfp-queue-pill-label">Up Next</div>
						<div class="mfp-queue-pill-sub" id="mfp-queue-sub">Nothing queued</div>
					</div>
					<i class="bi bi-chevron-right mfp-queue-pill-arrow"></i>
				</button>

			</div>
		`);

	// VIEW 2 — Queue panel (slides in from bottom on queue pill tap)
	const queueView = () =>
		buildNode(`
			<div class="mfp-view" id="mfp-queue-view" data-view="queue">

				<!-- Queue header -->
				<div class="mfp-queue-header">
					<h2 class="mfp-queue-title">Queue</h2>
					<button class="mfp-icon-btn" id="mfp-queue-close-btn" aria-label="Close queue">
						<i class="bi bi-x-lg"></i>
					</button>
				</div>

				<!-- Now playing row -->
				<div class="mfp-queue-now" id="mfp-queue-now">
					<p class="mfp-queue-section-label">Now Playing</p>
					<div class="mfp-queue-track" id="mfp-queue-now-track">
						<div class="mfp-qt-cover" id="mfp-queue-now-cover">
							<img src="${defaultCover}" alt="" class="mfp-qt-cover-img" id="mfp-queue-now-img"
								onerror="this.style.display='none'" />
						</div>
						<div class="mfp-qt-info">
							<div class="mfp-qt-title" id="mfp-queue-now-title">Midnight Drive</div>
							<div class="mfp-qt-artist" id="mfp-queue-now-artist">Artist Name</div>
						</div>
						<!-- Animated EQ bars -->
						<div class="mfp-eq" aria-hidden="true">
							<div class="mfp-eq-bar"></div>
							<div class="mfp-eq-bar"></div>
							<div class="mfp-eq-bar"></div>
						</div>
					</div>
				</div>

				<!-- Up next list — filled by render util -->
				<div class="mfp-queue-list" id="mfp-queue-list">
					<p class="mfp-queue-section-label mfp-queue-next-label">Up Next</p>
					<!-- queue items injected by audio-service / render util -->
					<div class="mfp-queue-empty" id="mfp-queue-empty">
						<i class="bi bi-music-note-list"></i>
						<span>Nothing up next</span>
					</div>
				</div>

			</div>
		`);

	// ── Assemble ─────────────────────────────────────────────────────────────
	page.append(playerView(), queueView());

	return page.getElement();
};

export { MobileFullPlayer };
