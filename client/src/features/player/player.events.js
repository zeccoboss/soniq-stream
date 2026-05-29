/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import { store } from "@zecco/store/store.js";
import { router } from "@zecco/routes/router.js";
import { toast } from "@zecco/components/Toast/Toast.js";

/**
 * playerEvents — Wires both the footer mini player and the full player pages.
 */
export const playerEvents = (
	root,
	{ isMini = false, isMobile = false, collapse = null } = {},
) => {
	if (!root) return;

	if (isMini) {
		const thumb = root.querySelector(".player-thumb");
		const title = root.querySelector(".player-title");
		const miniPlayerBar = root.querySelector(".mini-player-row-wrap");

		const openFullPlayer = () => {
			if (store.player.currentTrack) {
				router.navigate("/player");
			}
		};

		thumb?.addEventListener("click", openFullPlayer);
		title?.addEventListener("click", openFullPlayer);
		miniPlayerBar?.addEventListener("click", (e) => {
			if (!e.target.closest(".ctrl") && !e.target.closest(".player-like")) {
				openFullPlayer();
			}
		});
	}

	const $ = (id) =>
		root.querySelector(`#${id}`) ?? document.getElementById(id);

	let rafId = null;

	const startProgressLoop = () => {
		if (rafId) return;
		const tick = () => {
			updateProgress();
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
	};

	const stopProgressLoop = () => {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	};

	const updateProgress = () => {
		const progress = store.player.progress;
		const duration = store.player.duration ?? 0;
		if (!duration) return;

		const pct = Math.min((progress / duration) * 100, 100);

		if (isMini) {
			const fill =
				$("player-track-fill") ?? root.querySelector(".track-fill");
			if (fill) fill.style.width = `${pct}%`;

			const currentTime = root.querySelector(".time");
			if (currentTime) currentTime.textContent = formatTime(progress);
			return;
		}

		const fill = $("dfp-progress-fill") ?? $("mfp-progress-fill");
		if (fill) fill.style.width = `${pct}%`;

		const current = $("dfp-time-current") ?? $("mfp-time-current");
		if (current) current.textContent = formatTime(progress);

		const total = $("dfp-time-total") ?? $("mfp-time-total");
		if (total) total.textContent = formatTime(duration);
	};

	const updateTrackInfo = (track) => {
		if (!track) return;

		root
			.querySelectorAll(
				".player-thumb-image, #dfp-artwork-img, #mfp-artwork-img, #dfp-queue-now-img, #mfp-queue-now-img",
			)
			.forEach((img) => {
				img.src = track.cover ?? "";
				img.style.display = "block";
			});

		root
			.querySelectorAll(
				".player-title, #dfp-track-title, #mfp-track-title, #dfp-queue-now-title, #mfp-queue-now-title",
			)
			.forEach((el) => {
				el.textContent = track.title ?? "—";
			});

		root
			.querySelectorAll(
				".player-artist, #dfp-track-artist, #mfp-track-artist, #dfp-queue-now-artist, #mfp-queue-now-artist",
			)
			.forEach((el) => {
				el.textContent = track.artist ?? "—";
			});

		const genreLabel = $("dfp-track-genre");
		if (genreLabel) genreLabel.textContent = track.genre ?? "Unknown";

		const dur = $("dfp-time-total") ?? $("mfp-time-total");
		if (dur) dur.textContent = formatTime(store.player.duration ?? 0);
	};

	const syncPlayButton = (isPlaying) => {
		const playIcons = root.querySelectorAll("#dfp-play-icon, #mfp-play-icon");
		playIcons.forEach((icon) => {
			icon.className = isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill";
		});

		const miniPlay = root.querySelector(".ctrl.main");
		if (miniPlay) {
			miniPlay.innerHTML = isPlaying
				? `<i class="bi bi-pause-fill"></i>`
				: `<i class="bi bi-play-fill"></i>`;
		}

		isPlaying ? startProgressLoop() : stopProgressLoop();
	};

	const syncShuffleBtn = (isShuffle) => {
		root
			.querySelectorAll("#dfp-shuffle-btn, #mfp-shuffle-btn, .ctrl-shuffle")
			.forEach((btn) => {
				btn.classList.toggle("active", isShuffle);
			});
	};

	const syncRepeatBtn = (mode) => {
		root
			.querySelectorAll("#dfp-repeat-btn, #mfp-repeat-btn, .ctrl-repeat")
			.forEach((btn) => {
				btn.classList.remove("active");
				const icon = btn.querySelector("i");

				if (mode === "one") {
					btn.classList.add("active");
					if (icon) icon.className = "bi bi-repeat-1";
				} else if (mode === "all") {
					btn.classList.add("active");
					if (icon) icon.className = "bi bi-repeat";
				} else {
					if (icon) icon.className = "bi bi-repeat";
				}
			});
	};

	const syncLoadingState = (isLoading) => {
		root
			.querySelectorAll("#dfp-play-btn, #mfp-play-btn, .ctrl.main")
			.forEach((btn) => {
				btn.disabled = isLoading;
				if (isLoading) {
					btn.innerHTML = `
               <svg class="player-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" style="animation: spin 1s linear infinite;">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="45" stroke-linecap="round"/>
               </svg>`;
				} else {
					const isPlaying = store.player.isPlaying;
					btn.innerHTML = `<i class="${isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}" id="${btn.id ? btn.id.replace("btn", "icon") : ""}"></i>`;
				}
			});
	};

	const syncVolume = (vol) => {
		const miniVolFill = root.querySelector(".vol-fill");
		if (miniVolFill) miniVolFill.style.width = `${vol * 100}%`;

		const volFill = $("dfp-vol-fill") ?? $("mfp-vol-fill");
		if (volFill) volFill.style.width = `${vol * 100}%`;
	};

	const updateQueuePanel = () => {
		const queueList = $("dfp-queue-list") ?? $("mfp-queue-list");
		if (!queueList) return;

		const queue = store.player.queue;
		const currentIndex = store.player.queueIndex ?? 0;

		const countLabel = $("dfp-queue-count");
		if (countLabel)
			countLabel.textContent = `${queue.length} track${queue.length === 1 ? "" : "s"}`;

		const pillSub = $("mfp-queue-sub");
		if (pillSub)
			pillSub.textContent =
				queue.length > 0
					? `${queue.length} tracks up next`
					: "Nothing queued";

		const emptyState = $("dfp-queue-empty") ?? $("mfp-queue-empty");

		if (queue.length <= 1) {
			if (emptyState) emptyState.style.display = "flex";
			const labels = queueList.querySelectorAll(
				".dfp-queue-section-label, .mfp-queue-section-label",
			);
			queueList.replaceChildren(...labels, emptyState);
			return;
		}

		if (emptyState) emptyState.style.display = "none";

		const prefix = isMobile ? "mfp" : "dfp";

		const upcomingTracks = queue.slice(currentIndex + 1);

		const itemsHtml = upcomingTracks
			.map((track, i) => {
				const trueIndex = currentIndex + 1 + i;
				return `
            <div class="${prefix}-queue-item" data-index="${trueIndex}">
               <div class="${prefix}-qi-drag"><i class="bi bi-grip-vertical"></i></div>
               <div class="${prefix}-qi-cover">
                  <img src="${track.cover ?? ""}" alt="" onerror="this.style.display='none'" />
               </div>
               <div class="${prefix}-qi-info">
                  <div class="${prefix}-qi-title">${track.title ?? "—"}</div>
                  <div class="${prefix}-qi-artist">${track.artist ?? "—"}</div>
               </div>
               <span class="${prefix}-qi-dur">--:--</span>
               <button class="${prefix}-qi-more"><i class="bi bi-three-dots"></i></button>
            </div>
         `;
			})
			.join("");

		const labelMarkup = `<p class="${prefix}-queue-section-label ${prefix}-queue-next-label">Up Next</p>`;
		queueList.innerHTML = labelMarkup + itemsHtml;

		queueList.querySelectorAll(`.${prefix}-queue-item`).forEach((item) => {
			item.addEventListener("click", (e) => {
				if (
					e.target.closest(`.${prefix}-qi-more`) ||
					e.target.closest(`.${prefix}-qi-drag`)
				)
					return;

				// Fix: Force audio context on gesture & use playAt for index tracking
				store.player.ensureAudioContext();
				const index = Number(item.dataset.index);
				store.player.playAt(index).catch(() => {
					toast({ message: "Error changing tracks", type: "error" });
				});
			});
		});
	};

	const unsubs = [
		store.player.on("play_state_changed", ({ isPlaying }) =>
			syncPlayButton(isPlaying),
		),
		store.player.on("track_changed", (track) => {
			updateTrackInfo(track);
			updateQueuePanel();
			updateProgress();
		}),
		store.player.on("track_loading", (isLoading) =>
			syncLoadingState(isLoading),
		),
		store.player.on("volume_changed", (vol) => syncVolume(vol)),
		store.player.on("queue_changed", () => updateQueuePanel()),
		store.player.on("seeked", () => updateProgress()),
	];

	root
		.querySelectorAll("#dfp-play-btn, #mfp-play-btn, .ctrl.main")
		.forEach((btn) =>
			btn.addEventListener("click", () => {
				store.player.ensureAudioContext();
				store.player.togglePlay();
			}),
		);

	root
		.querySelectorAll("#dfp-next-btn, #mfp-next-btn, .ctrl-next")
		.forEach((btn) =>
			btn.addEventListener("click", () => store.player.nextTrack()),
		);

	root
		.querySelectorAll("#dfp-prev-btn, #mfp-prev-btn, .ctrl-prev")
		.forEach((btn) =>
			btn.addEventListener("click", () => store.player.prevTrack()),
		);

	root
		.querySelectorAll("#dfp-shuffle-btn, #mfp-shuffle-btn")
		.forEach((btn) =>
			btn.addEventListener("click", () => store.player.toggleShuffle()),
		);

	root
		.querySelectorAll("#dfp-repeat-btn, #mfp-repeat-btn")
		.forEach((btn) =>
			btn.addEventListener("click", () => store.player.toggleRepeat()),
		);

	const progressTrack =
		$("dfp-progress-bar") ??
		$("mfp-progress-bar") ??
		root.querySelector(".track");
	if (progressTrack) {
		const handleSeek = (clientX) => {
			const rect = progressTrack.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (clientX - rect.left) / rect.width),
			);
			const dur = store.player.duration ?? 0;
			if (dur) store.player.seekTo(pct * dur);
		};

		progressTrack.addEventListener("click", (e) => handleSeek(e.clientX));

		progressTrack.addEventListener(
			"touchstart",
			(e) => handleSeek(e.touches[0].clientX),
			{ passive: true },
		);
	}

	const volumeTrack =
		$("dfp-vol-bar") ?? $("mfp-vol-bar") ?? root.querySelector(".vol-track");
	if (volumeTrack) {
		const handleVolumeScrub = (clientX) => {
			const rect = volumeTrack.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (clientX - rect.left) / rect.width),
			);
			store.player.volume = pct;
		};

		volumeTrack.addEventListener("click", (e) =>
			handleVolumeScrub(e.clientX),
		);
	}

	root
		.querySelectorAll(".vol-icon, .dfp-vol-icon, .mfp-vol-icon")
		.forEach((icon) => {
			icon.addEventListener("click", () => {
				store.player.toggleMute();
			});
		});

	if (isMini) {
		const thumb = root.querySelector(".player-thumb");
		const title = root.querySelector(".player-title");
		[thumb, title].forEach((el) =>
			el?.addEventListener("click", () => {
				if (store.player.currentTrack) router.navigate("/player");
			}),
		);
	}

	$("dfp-back-btn")?.addEventListener("click", () => collapse?.());
	$("mfp-collapse-btn")?.addEventListener("click", () => router.replace("/"));

	$("mfp-queue-pill-btn")?.addEventListener("click", () => {
		$("mfp-queue-view")?.classList.add("active-mfp-view");
	});

	$("mfp-queue-close-btn")?.addEventListener("click", () => {
		$("mfp-queue-view")?.classList.remove("active-mfp-view");
	});

	if (isMobile && !isMini) {
		let touchStartY = 0;
		root.addEventListener(
			"touchstart",
			(e) => {
				touchStartY = e.touches[0].clientY;
			},
			{ passive: true },
		);
		root.addEventListener(
			"touchend",
			(e) => {
				const diff = e.changedTouches[0].clientY - touchStartY;
				if (diff > 80 && !e.target.closest("#mfp-queue-list")) collapse?.();
			},
			{ passive: true },
		);
	}

	if (!isMini) {
		const onKeyDown = (e) => {
			if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
				return;

			switch (e.code) {
				case "Space":
					e.preventDefault();
					store.player.togglePlay();
					break;
				case "ArrowRight":
					store.player.seekTo(store.player.progress + 5);
					break;
				case "ArrowLeft":
					store.player.seekTo(store.player.progress - 5);
					break;
				case "Escape":
					collapse?.();
					break;
			}
		};
		document.addEventListener("keydown", onKeyDown);
		unsubs.push(() => document.removeEventListener("keydown", onKeyDown));
	}

	const track = store.player.currentTrack;
	if (track) {
		updateTrackInfo(track);
		syncPlayButton(store.player.isPlaying);
		syncShuffleBtn(store.player.isShuffle);
		syncRepeatBtn(store.player.repeatMode);
		syncVolume(store.player.volume);
		updateQueuePanel();
		updateProgress();
		if (store.player.isPlaying) startProgressLoop();
	}

	return () => {
		stopProgressLoop();
		unsubs.forEach((unsub) => typeof unsub === "function" && unsub());
	};
};

const formatTime = (seconds = 0) => {
	const s = Math.floor(seconds);
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return `${m}:${rem.toString().padStart(2, "0")}`;
};
