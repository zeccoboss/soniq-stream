import { buildNode } from "@zecco/utils/dom/build-node";
import CreateElement from "@zecco/utils/dom/create-element";
import defaultCover from "@zecco/assets/images/track-cover.png";
import "./DesktopFullPlayer.css";

const DesktopFullPlayer = () => {
	const page = new CreateElement("section");
	page.addClass("desktop-full-player", "app-page").setId("full-player");

	// ── Private view factories ───────────────────────────────────────────────

	// Left — main player area
	const playerMain = () =>
		buildNode(`
			<div class="dfp-main" id="dfp-main">

				<!-- Ambient background -->
				<div class="dfp-bg" id="dfp-bg"></div>

				<!-- Top bar -->
				<div class="dfp-topbar">
					<button class="dfp-back-btn" id="dfp-back-btn">
						<i class="bi bi-arrow-left"></i>
						Back to Browse
					</button>
					<span class="dfp-label">Now Playing</span>
					<div class="dfp-topbar-actions">
						<button class="dfp-action-btn" id="dfp-share-btn" title="Share">
							<i class="bi bi-share"></i>
						</button>
						<button class="dfp-action-btn" id="dfp-more-btn" title="More options">
							<i class="bi bi-three-dots"></i>
						</button>
					</div>
				</div>

				<!-- Center — artwork + controls -->
				<div class="dfp-center">

					<!-- Artwork -->
					<div class="dfp-artwork" id="dfp-artwork">
						<img
							src="${defaultCover}"
							alt="Track artwork"
							class="dfp-artwork-img"
							id="dfp-artwork-img"
							onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
						/>
						<div class="dfp-artwork-fallback" id="dfp-artwork-fallback">
							<i class="bi bi-music-note-beamed"></i>
						</div>
					</div>

					<!-- Track details + controls -->
					<div class="dfp-details">

						<!-- Track header -->
						<div class="dfp-track-header">
							<div>
								<h1 class="dfp-track-title" id="dfp-track-title">Midnight Drive</h1>
								<p class="dfp-track-artist" id="dfp-track-artist">Artist Name</p>
								<span class="dfp-track-genre" id="dfp-track-genre">Afrobeats</span>
							</div>
							<button class="dfp-like-btn" id="dfp-like-btn" aria-label="Like track">
								<i class="bi bi-heart" id="dfp-like-icon"></i>
							</button>
						</div>

						<!-- Progress -->
						<div class="dfp-progress-wrap">
							<div class="dfp-progress-bar" id="dfp-progress-bar"
								role="slider" aria-label="Track progress">
								<div class="dfp-progress-fill" id="dfp-progress-fill"></div>
							</div>
							<div class="dfp-progress-times">
								<span class="dfp-time" id="dfp-time-current">0:00</span>
								<span class="dfp-time" id="dfp-time-total">0:00</span>
							</div>
						</div>

						<!-- Controls -->
						<div class="dfp-controls">
							<div class="dfp-ctrl-group">
								<button class="dfp-ctrl" id="dfp-shuffle-btn" aria-label="Shuffle">
									<i class="bi bi-shuffle"></i>
								</button>
								<button class="dfp-ctrl" id="dfp-prev-btn" aria-label="Previous">
									<i class="bi bi-skip-start-fill"></i>
								</button>
							</div>
							<button class="dfp-ctrl-play" id="dfp-play-btn" aria-label="Play/Pause">
								<i class="bi bi-play-fill" id="dfp-play-icon"></i>
							</button>
							<div class="dfp-ctrl-group">
								<button class="dfp-ctrl" id="dfp-next-btn" aria-label="Next">
									<i class="bi bi-skip-end-fill"></i>
								</button>
								<button class="dfp-ctrl" id="dfp-repeat-btn" aria-label="Repeat">
									<i class="bi bi-repeat"></i>
								</button>
							</div>
						</div>

						<!-- Volume + extra actions -->
						<div class="dfp-extras">
							<div class="dfp-vol">
								<i class="bi bi-volume-down dfp-vol-icon"></i>
								<div class="dfp-vol-bar" id="dfp-vol-bar" role="slider" aria-label="Volume">
									<div class="dfp-vol-fill" id="dfp-vol-fill"></div>
								</div>
								<i class="bi bi-volume-up dfp-vol-icon"></i>
							</div>
							<div class="dfp-extra-btns">
								<button class="dfp-extra-btn" id="dfp-queue-toggle-btn"
									title="Toggle queue" aria-label="Toggle queue">
									<i class="bi bi-list-ul"></i>
								</button>
								<button class="dfp-extra-btn" id="dfp-add-to-btn"
									title="Add to playlist" aria-label="Add to playlist">
									<i class="bi bi-plus-lg"></i>
								</button>
								<button class="dfp-extra-btn" id="dfp-share-extra-btn"
									title="Share" aria-label="Share">
									<i class="bi bi-share"></i>
								</button>
								<button class="dfp-extra-btn" id="dfp-artist-btn"
									title="Go to artist" aria-label="Go to artist">
									<i class="bi bi-person"></i>
								</button>
							</div>
						</div>

					</div>
				</div>

			</div>
		`);

	// Right — queue panel
	const queuePanel = () =>
		buildNode(`
			<div class="dfp-queue" id="dfp-queue">

				<!-- Queue header -->
				<div class="dfp-queue-header">
					<h2 class="dfp-queue-title">Queue</h2>
					<span class="dfp-queue-count" id="dfp-queue-count">0 tracks</span>
				</div>

				<!-- Now playing -->
				<div class="dfp-queue-now" id="dfp-queue-now">
					<p class="dfp-queue-section-label">Now Playing</p>
					<div class="dfp-queue-track">
						<div class="dfp-qt-cover" id="dfp-queue-now-cover">
							<img
								src="${defaultCover}"
								alt=""
								class="dfp-qt-cover-img"
								id="dfp-queue-now-img"
								onerror="this.style.display='none'"
							/>
						</div>
						<div class="dfp-qt-info">
							<div class="dfp-qt-title" id="dfp-queue-now-title">Midnight Drive</div>
							<div class="dfp-qt-artist" id="dfp-queue-now-artist">Artist Name</div>
						</div>
						<!-- Animated EQ bars -->
						<div class="dfp-eq" aria-hidden="true">
							<div class="dfp-eq-bar"></div>
							<div class="dfp-eq-bar"></div>
							<div class="dfp-eq-bar"></div>
						</div>
					</div>
				</div>

				<!-- Up next list -->
				<div class="dfp-queue-list" id="dfp-queue-list">
					<p class="dfp-queue-section-label dfp-queue-next-label">Up Next</p>
					<!-- queue items injected by audio-service / render util -->
					<div class="dfp-queue-empty" id="dfp-queue-empty">
						<i class="bi bi-music-note-list"></i>
						<span>Nothing up next</span>
					</div>
				</div>

			</div>
		`);

	// ── Assemble ─────────────────────────────────────────────────────────────
	page.append(playerMain(), queuePanel());

	return page.getElement();
};

export { DesktopFullPlayer };
