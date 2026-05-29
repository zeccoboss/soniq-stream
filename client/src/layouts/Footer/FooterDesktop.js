import { store } from "@zecco/store/store";
import CreateElement from "@zecco/utils/dom/create-element.js";
import TRACK_COVER from "@zecco/assets/images/track-cover.png";

// Helper to convert seconds to M:SS format
const formatTime = (seconds) => {
	if (!seconds || isNaN(seconds)) return "0:00";
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
            <div class="track"><div class="track-fill" id="f-progress-fill"></div></div>
            <span class="time" id="f-total-time" style="text-align: right">0:00</span>
         </div>
      </div>

      <div class="player-right">
         <div class="vol">
            <span class="vol-icon"><i class="bi bi-volume-up-fill"></i></span>
            <div class="vol-track"><div class="vol-fill" id="f-vol-fill"></div></div>
         </div>
         <div class="queue-btn"><i class="bi bi-list"></i> Queue</div>
      </div>
   `;

	const el = footerInstance.getElement();

	const thumb = el.querySelector("#f-thumb");
	const title = el.querySelector("#f-title");
	const artist = el.querySelector("#f-artist");
	const playBtn = el.querySelector("#btn-play");
	const progressFill = el.querySelector("#f-progress-fill");
	const curTimeEl = el.querySelector("#f-current-time");
	const totTimeEl = el.querySelector("#f-total-time");
	const volFill = el.querySelector("#f-vol-fill");

	const render = () => {
		const track = store.player.currentTrack;
		const isPlaying = store.player.isPlaying;

		if (track) {
			thumb.src = track.cover || TRACK_COVER;
			title.textContent = track.title;
			artist.textContent = track.artist;
			// Set the total duration label here
			totTimeEl.textContent = formatTime(track.duration);
		}

		playBtn.innerHTML = `<i class="bi bi-${isPlaying ? "pause-fill" : "play-fill"}"></i>`;
		volFill.style.width = `${store.player.volume * 100}%`;
	};

	const updateProgress = () => {
		const duration = store.player.currentTrack?.duration || 1;
		const progressPercent = (store.player.progress / duration) * 100;

		// Update the current time label
		curTimeEl.textContent = formatTime(store.player.progress);
		progressFill.style.width = `${progressPercent}%`;
	};

	store.player.on("track_changed", render);
	store.player.on("play_state_changed", render);
	store.player.on("seeked", updateProgress);
	store.player.on("volume_changed", render);

	el.addEventListener("click", (e) => {
		if (e.target.closest("#btn-play")) store.player.togglePlay();
		if (e.target.closest("#btn-next")) store.player.nextTrack();
		if (e.target.closest("#btn-prev")) store.player.prevTrack();
	});

	render();
	return el;
};

export default FooterDesktop;
