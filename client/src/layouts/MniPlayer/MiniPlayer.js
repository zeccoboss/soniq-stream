import { store } from "@zecco/store/store";
import CreateElement from "@zecco/utils/dom/create-element.js";
import defaultCover from "@zecco/assets/images/track-cover.png";

const MiniPlayer = () => {
	const player = new CreateElement("section");
	player.addClass("mini-player").setId("mini-player");

	// Build the structure once
	player.innerHTML = `
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

	const imgElement = player.getElement().querySelector("#player-thumb-image");
	const titleElement = player.getElement().querySelector("#player-title");
	const artistElement = player.getElement().querySelector("#player-artist");
	const ctrlIcon = player.getElement().querySelector("#player-ctrl i");

	const render = () => {
		const track = store.player.currentTrack;
		const isPlaying = store.player.isPlaying;

		// Update values individually
		if (track) {
			imgElement.src = track.cover || defaultCover;
			titleElement.textContent = track.title;
			artistElement.textContent = track.artist;
		}

		// Update icon class
		ctrlIcon.className = `bi bi-${isPlaying ? "pause-fill" : "play-fill"}`;
	};

	render();

	const onTrackChange = () => render();
	const onPlayStateChange = () => render();

	store.player.on("track_changed", onTrackChange);
	store.player.on("play_state_changed", onPlayStateChange);

	player.getElement().addEventListener("click", (e) => {
		if (e.target.closest(".mini-player-ctrl")) {
			store.player.togglePlay();
		}
	});

	player.getElement().cleanup = () => {
		store.player.off("track_changed", onTrackChange);
		store.player.off("play_state_changed", onPlayStateChange);
	};

	return player.getElement();
};

export { MiniPlayer };
