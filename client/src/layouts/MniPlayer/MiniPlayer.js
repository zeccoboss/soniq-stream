import { store } from "@zecco/store/store";
import CreateElement from "@zecco/utils/dom/create-element.js";
import defaultCover from "@zecco/assets/images/track-cover.png";

const MiniPlayer = () => {
	const player = new CreateElement("section");
	player.addClass("mini-player").setId("mini-player");

	// Added a progress bar track shell (.mini-player-progress)
	player.innerHTML = `
      <div class="mini-player-progress">
         <div class="progress-fill" id="m-progress-fill"></div>
      </div>
      <div class="player-thumb">
         <figure class="player-thumb-container">
            <img src="${defaultCover}" alt="Track cover" class="player-thumb-image" id="player-thumb-image" loading="lazy" width="100" height="100"/>
         </figure>
      </div>
      <div class="mini-player-info">
         <div class="mini-player-title" id="player-title">No track selected</div>
         <div class="mini-player-artist" id="player-artist">Unknown artist</div>
      </div>
      <button class="mini-player-ctrl" id="player-ctrl" aria-label="Play/Pause">
         <i class="bi bi-play-fill"></i>
      </button>
   `;

	const el = player.getElement();
	const imgElement = el.querySelector("#player-thumb-image");
	const titleElement = el.querySelector("#player-title");
	const artistElement = el.querySelector("#player-artist");
	const ctrlIcon = el.querySelector("#player-ctrl i");

	const progressBarContainer = el.querySelector(".mini-player-progress");
	const progressFill = el.querySelector("#m-progress-fill");

	let progressAnimationId = null;

	const tickProgress = () => {
		if (!store.player.isPlaying) return;

		const duration = store.player.duration || 1;
		const progressPercent = (store.player.progress / duration) * 100;
		progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;

		progressAnimationId = requestAnimationFrame(tickProgress);
	};

	const startProgressLoop = () => {
		if (progressAnimationId) cancelAnimationFrame(progressAnimationId);
		tickProgress();
	};

	const stopProgressLoop = () => {
		if (progressAnimationId) {
			cancelAnimationFrame(progressAnimationId);
			progressAnimationId = null;
		}
	};

	const render = () => {
		const track = store.player.currentTrack;
		const isPlaying = store.player.isPlaying;

		if (track) {
			imgElement.src = track.cover || defaultCover;
			titleElement.textContent = track.title;
			artistElement.textContent = track.artist;
		} else {
			imgElement.src = defaultCover;
			titleElement.textContent = "No track selected";
			artistElement.textContent = "Unknown artist";
			progressFill.style.width = "0%";
		}

		ctrlIcon.className = `bi bi-${isPlaying ? "pause-fill" : "play-fill"}`;

		if (isPlaying) {
			startProgressLoop();
		} else {
			stopProgressLoop();
			// Sync once manually for single seeks or pauses
			const duration = store.player.duration || 1;
			const progressPercent = (store.player.progress / duration) * 100;
			progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
		}
	};

	// Skeleton shimmer tracking implementation
	const handleLoadingState = (isLoading) => {
		if (isLoading) {
			progressBarContainer.classList.add("shimmer-loading");
			progressFill.style.width = "100%"; // Show full block skeleton layout width while loading
		} else {
			progressBarContainer.classList.remove("shimmer-loading");
			progressFill.style.width = "0%";
			render();
		}
	};

	// Initial configuration boot tracking synchronization triggers
	render();
	handleLoadingState(store.player.isLoading);

	const onTrackChange = () => render();
	const onPlayStateChange = () => render();
	const onLoadingChange = (isLoading) => handleLoadingState(isLoading);
	const onSeek = () => {
		const duration = store.player.duration || 1;
		const progressPercent = (store.player.progress / duration) * 100;
		progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
	};

	store.player.on("track_changed", onTrackChange);
	store.player.on("play_state_changed", onPlayStateChange);
	store.player.on("track_loading", onLoadingChange);
	store.player.on("seeked", onSeek);

	el.addEventListener("click", (e) => {
		if (e.target.closest(".mini-player-ctrl")) {
			store.player.togglePlay();
		}
	});

	el.cleanup = () => {
		stopProgressLoop();
		store.player.off("track_changed", onTrackChange);
		store.player.off("play_state_changed", onPlayStateChange);
		store.player.off("track_loading", onLoadingChange);
		store.player.off("seeked", onSeek);
	};

	return el;
};

export { MiniPlayer };
