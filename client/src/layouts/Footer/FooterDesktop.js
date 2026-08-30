import { store } from "@zecco/store/store";
import CreateElement from "@zecco/utils/dom/create-element.js";
import TRACK_COVER from "@zecco/assets/images/track-cover.png";

const formatTime = (seconds) => {
	if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const FooterDesktop = () => {
	const footerInstance = new CreateElement("footer", "Footer");
	footerInstance.addClass("player").setId("footer");

	footerInstance.innerHTML = `
      <div class="player-track">
         <div class="player-thumb">
            <figure class="player-thumb-container">
               <img src="${TRACK_COVER}" alt="Track cover" class="player-thumb-image" id="f-thumb" loading="lazy" width="100" height="100"/>
            </figure>
         </div>
         <div>
            <div class="player-title" id="f-title">No track selected</div>
            <div class="player-artist" id="f-artist">Unknown artist</div>
         </div>
         <div class="player-like"><i class="bi bi-heart"></i></div>
      </div>

      <div class="player-center">
         <div class="ctrl-btns">
            <button class="ctrl" id="btn-shuffle"><i class="bi bi-shuffle"></i></button>
            <button class="ctrl" id="btn-prev"><i class="bi bi-skip-start-fill"></i></button>
            <button class="ctrl main" id="btn-play"><i class="bi bi-play-fill"></i></button>
            <button class="ctrl" id="btn-next"><i class="bi bi-skip-end-fill"></i></button>
            <button class="ctrl" id="btn-loop"><i class="bi bi-repeat"></i></button>
         </div>
         <div class="progress">
            <span class="time" id="f-current-time">0:00</span>
            <div class="track" id="f-track-container">
               <div class="track-fill" id="f-progress-fill"></div>
            </div>
            <span class="time" id="f-total-time" style="text-align: right">0:00</span>
         </div>
      </div>

      <div class="player-right">
         <div class="vol">
            <span class="vol-icon" id="f-vol-icon"><i class="bi bi-volume-up-fill"></i></span>
            <div class="vol-track" id="f-vol-track"><div class="vol-fill" id="f-vol-fill"></div></div>
         </div>
         <div class="queue-btn"><i class="bi bi-list"></i> Queue</div>
      </div>
   `;

	const el = footerInstance.getElement();

	const thumb = el.querySelector("#f-thumb");
	const title = el.querySelector("#f-title");
	const artist = el.querySelector("#f-artist");
	const playBtn = el.querySelector("#btn-play");
	const shuffleBtn = el.querySelector("#btn-shuffle");
	const repeatBtn = el.querySelector("#btn-loop");

	const trackContainer = el.querySelector("#f-track-container");
	const progressFill = el.querySelector("#f-progress-fill");
	const curTimeEl = el.querySelector("#f-current-time");
	const totTimeEl = el.querySelector("#f-total-time");

	const volTrack = el.querySelector("#f-vol-track");
	const volFill = el.querySelector("#f-vol-fill");
	const volIcon = el.querySelector("#f-vol-icon i");

	let animationFrameId = null;
	let isDraggingProgress = false;

	const updateProgressFrame = () => {
		if (!store.player.isPlaying || isDraggingProgress) return;

		const currentProgress = store.player.progress;
		const duration = store.player.duration || 1;
		const progressPercent = (currentProgress / duration) * 100;

		curTimeEl.textContent = formatTime(currentProgress);
		progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;

		animationFrameId = requestAnimationFrame(updateProgressFrame);
	};

	const startProgressLoop = () => {
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		updateProgressFrame();
	};

	const stopProgressLoop = () => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	};

	const render = () => {
		const track = store.player.currentTrack;
		const isPlaying = store.player.isPlaying;
		const isShuffle = store.player.isShuffle;
		const repeatMode = store.player.repeatMode;
		const volume = store.player.volume;

		if (track) {
			thumb.src = track.cover || TRACK_COVER;
			title.textContent = track.title;
			artist.textContent = track.artist;
			if (!isDraggingProgress)
				totTimeEl.textContent = formatTime(store.player.duration);
		} else {
			thumb.src = TRACK_COVER;
			title.textContent = "No track selected";
			artist.textContent = "Unknown artist";
			totTimeEl.textContent = "0:00";
			curTimeEl.textContent = "0:00";
			progressFill.style.width = "0%";
		}

		playBtn.innerHTML = `<i class="bi bi-${isPlaying ? "pause-fill" : "play-fill"}"></i>`;

		if (isShuffle) shuffleBtn.classList.add("active");
		else shuffleBtn.classList.remove("active");

		if (repeatMode === "one") {
			repeatBtn.innerHTML = `<i class="bi bi-repeat-1"></i>`;
			repeatBtn.classList.add("active");
		} else if (repeatMode === "all") {
			repeatBtn.innerHTML = `<i class="bi bi-repeat"></i>`;
			repeatBtn.classList.add("active");
		} else {
			repeatBtn.innerHTML = `<i class="bi bi-repeat"></i>`;
			repeatBtn.classList.remove("active");
		}

		volFill.style.width = `${volume * 100}%`;
		if (volume === 0) volIcon.className = "bi bi-volume-mute-fill";
		else if (volume < 0.5) volIcon.className = "bi bi-volume-down-fill";
		else volIcon.className = "bi bi-volume-up-fill";

		if (isPlaying && !isDraggingProgress) {
			startProgressLoop();
		} else if (!isPlaying && !isDraggingProgress) {
			stopProgressLoop();
			const duration = store.player.duration || 1;
			curTimeEl.textContent = formatTime(store.player.progress);
			const progressPercent = (store.player.progress / duration) * 100;
			progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
		}
	};

	const handleLoadingState = (isLoading) => {
		if (isLoading) {
			trackContainer.classList.add("shimmer-loading");
			progressFill.style.width = "100%";
			curTimeEl.textContent = "--:--";
			totTimeEl.textContent = "--:--";
		} else {
			trackContainer.classList.remove("shimmer-loading");
			progressFill.style.width = "0%";
			render();
		}
	};

	// ── Interactive Seeking Engine (Scrubbing Layer) ────────────────
	const calculateScrubPercentage = (clientX) => {
		const rect = trackContainer.getBoundingClientRect();
		const offsetX = clientX - rect.left;
		return Math.min(1, Math.max(0, offsetX / rect.width));
	};

	const updateVisualScrub = (clientX) => {
		if (!store.player.currentTrack) return 0;
		const percentage = calculateScrubPercentage(clientX);
		progressFill.style.width = `${percentage * 100}%`;
		curTimeEl.textContent = formatTime(percentage * store.player.duration);
		return percentage;
	};

	const handleProgressMouseDown = (e) => {
		if (!store.player.currentTrack || store.player.isLoading) return;

		isDraggingProgress = true;
		stopProgressLoop();
		updateVisualScrub(e.clientX);

		document.addEventListener("mousemove", handleProgressMouseMove);
		document.addEventListener("mouseup", handleProgressMouseUp);
	};

	const handleProgressMouseMove = (e) => {
		if (!isDraggingProgress) return;
		updateVisualScrub(e.clientX);
	};

	const handleProgressMouseUp = (e) => {
		if (!isDraggingProgress) return;
		isDraggingProgress = false;

		const percentage = calculateScrubPercentage(e.clientX);
		const targetSeconds = percentage * store.player.duration;

		store.player.seekTo(targetSeconds);

		document.removeEventListener("mousemove", handleProgressMouseMove);
		document.removeEventListener("mouseup", handleProgressMouseUp);

		if (store.player.isPlaying) {
			startProgressLoop();
		}
	};

	const handleVolumeModification = (e) => {
		const rect = volTrack.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const calculatedVolume = Math.min(1, Math.max(0, clickX / rect.width));
		store.player.volume = calculatedVolume;
	};

	// ── Core Event Bindings ──────────────────────────────────────────
	const onTrackChange = () => render();
	const onPlayStateChange = () => render();
	const onVolumeChange = () => render();
	const onQueueChange = () => render();
	const onRepeatChange = () => render();
	const onLoadingChange = (isLoading) => handleLoadingState(isLoading);
	const onSeek = () => {
		if (isDraggingProgress) return;
		const duration = store.player.duration || 1;
		curTimeEl.textContent = formatTime(store.player.progress);
		const progressPercent = (store.player.progress / duration) * 100;
		progressFill.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
	};

	store.player.on("player_store:track_changed", onTrackChange);
	store.player.on("player_store:play_state_changed", onPlayStateChange);
	store.player.on("player_store:volume_changed", onVolumeChange);
	store.player.on("player_store:queue_changed", onQueueChange);
	store.player.on("player_store:repeat_changed", onRepeatChange);
	store.player.on("player_store:track_loading", onLoadingChange);
	store.player.on("player_store:seeked", onSeek);

	el.addEventListener("click", (e) => {
		if (e.target.closest("#btn-play")) store.player.togglePlay();
		if (e.target.closest("#btn-next")) store.player.nextTrack();
		if (e.target.closest("#btn-prev")) store.player.prevTrack();
		if (e.target.closest("#btn-shuffle")) store.player.toggleShuffle();
		if (e.target.closest("#btn-loop")) store.player.toggleRepeat();
	});

	volTrack.addEventListener("click", handleVolumeModification);
	trackContainer.addEventListener("mousedown", handleProgressMouseDown);

	render();
	handleLoadingState(store.player.isLoading);

	el.cleanup = () => {
		stopProgressLoop();
		volTrack.removeEventListener("click", handleVolumeModification);
		trackContainer.removeEventListener("mousedown", handleProgressMouseDown);
		document.removeEventListener("mousemove", handleProgressMouseMove);
		document.removeEventListener("mouseup", handleProgressMouseUp);

		store.player.off("player_store:track_changed", onTrackChange);
		store.player.off("player_store:play_state_changed", onPlayStateChange);
		store.player.off("player_store:volume_changed", onVolumeChange);
		store.player.off("player_store:queue_changed", onQueueChange);
		store.player.off("player_store:repeat_changed", onRepeatChange);
		store.player.off("player_store:track_loading", onLoadingChange);
		store.player.off("player_store:seeked", onSeek);
	};

	return el;
};

export default FooterDesktop;
