import { store } from "@zecco/store/store.js";
import { router } from "@zecco/routes/router.js";
import { toast } from "@zecco/components/Toast/Toast.js";

/**
 * playerEvents — Wires both the footer mini player and the full player page.
 *
 * Called from:
 *   - buildLayout.js   → for the footer mini player (always mounted)
 *   - PlayerPage.js    → for the full player (mounted on /player route)
 *
 * Store events consumed:
 *   play_state_changed  → update play/pause button icon
 *   track_changed       → update track info, cover, title, artist
 *   track_loading       → show/hide loading state on play button
 *   volume_changed      → update volume slider
 *   queue_changed       → re-render queue panel
 *   seeked              → sync progress bar
 *
 * @param {Element} root      — The player container (footer or full player section)
 * @param {Object}  options
 * @param {boolean} options.isMini     — true for footer mini player
 * @param {boolean} options.isMobile   — true for mobile layout
 * @param {Function} [options.collapse] — called when full player closes
 */
export const playerEvents = (
	root,
	{ isMini = false, isMobile = false, collapse = null } = {},
) => {
	if (!root) return;

	// ── Element selectors ─────────────────────────────────────
	// Shared between mini and full player where IDs match
	const $ = (id) =>
		root.querySelector(`#${id}`) ?? document.getElementById(id);
	const $$ = (sel) => root.querySelectorAll(sel);

	// ── Progress RAF ──────────────────────────────────────────
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

	// ── Progress update ───────────────────────────────────────
	const updateProgress = () => {
		const progress = store.player.progress;
		const duration = store.player.duration ?? 0;
		if (!duration) return;

		const pct = Math.min((progress / duration) * 100, 100);

		// Mini player
		if (isMini) {
			const fill =
				$("player-track-fill") ?? root.querySelector(".track-fill");
			if (fill) fill.style.width = `${pct}%`;

			const currentTime = root.querySelector(".time");
			if (currentTime) currentTime.textContent = formatTime(progress);
			return;
		}

		// Full player — desktop
		const fill =
			$("fp-progress-fill") ?? root.querySelector(".fp-progress-fill");
		if (fill) fill.style.width = `${pct}%`;

		const bar =
			$("fp-progress-bar") ?? root.querySelector(".fp-progress-bar");
		if (bar) bar.style.setProperty("--pct", `${pct}%`);

		const current =
			$("fp-current-time") ?? root.querySelector(".fp-current-time");
		if (current) current.textContent = formatTime(progress);

		const total = $("fp-duration") ?? root.querySelector(".fp-duration");
		if (total) total.textContent = formatTime(duration);
	};

	// ── Track info update ─────────────────────────────────────
	const updateTrackInfo = (track) => {
		if (!track) return;

		// Cover
		const covers = root.querySelectorAll(
			".player-thumb-image, .fp-cover-img, .mob-fp-cover-img",
		);
		covers.forEach((img) => {
			img.src = track.cover ?? "";
			img.style.display = track.cover ? "block" : "none";
		});

		// Title
		root
			.querySelectorAll(
				".player-title, .fp-track-title, .mob-fp-track-title",
			)
			.forEach((el) => {
				el.textContent = track.title ?? "—";
			});

		// Artist
		root
			.querySelectorAll(
				".player-artist, .fp-track-artist, .mob-fp-track-artist",
			)
			.forEach((el) => {
				el.textContent = track.artist ?? "—";
			});

		// Duration
		const dur = root.querySelector(".fp-duration, .mob-fp-duration");
		if (dur) dur.textContent = formatTime(store.player.duration ?? 0);
	};

	// ── Play/pause button sync ────────────────────────────────
	const syncPlayButton = (isPlaying) => {
		// Mini player — .ctrl.main
		const miniPlay = root.querySelector(".ctrl.main");
		if (miniPlay) {
			miniPlay.innerHTML = isPlaying
				? `<i class="bi bi-pause-fill"></i>`
				: `<i class="bi bi-play-fill"></i>`;
		}

		// Full player — dedicated button
		const fpPlay = $("fp-play-btn") ?? root.querySelector(".fp-play-btn");
		if (fpPlay) {
			fpPlay.innerHTML = isPlaying
				? `<i class="bi bi-pause-fill"></i>`
				: `<i class="bi bi-play-fill"></i>`;
		}

		// Mobile full player
		const mobPlay =
			$("mob-fp-play-btn") ?? root.querySelector(".mob-fp-play-btn");
		if (mobPlay) {
			mobPlay.innerHTML = isPlaying
				? `<i class="bi bi-pause-fill"></i>`
				: `<i class="bi bi-play-fill"></i>`;
		}

		isPlaying ? startProgressLoop() : stopProgressLoop();
	};

	// ── Shuffle button sync ───────────────────────────────────
	const syncShuffleBtn = (isShuffle) => {
		root.querySelectorAll(".fp-shuffle-btn, .ctrl-shuffle").forEach((btn) => {
			btn.classList.toggle("active-ctrl", isShuffle);
		});
	};

	// ── Repeat button sync ────────────────────────────────────
	const syncRepeatBtn = (mode) => {
		root.querySelectorAll(".fp-repeat-btn, .ctrl-repeat").forEach((btn) => {
			btn.classList.remove("active-ctrl", "repeat-one");
			if (mode === "one") btn.classList.add("active-ctrl", "repeat-one");
			if (mode === "all") btn.classList.add("active-ctrl");

			const icon = btn.querySelector("i");
			if (icon) {
				icon.className = mode === "one" ? "bi bi-repeat-1" : "bi bi-repeat";
			}
		});
	};

	// ── Loading state ─────────────────────────────────────────
	const syncLoadingState = (isLoading) => {
		root
			.querySelectorAll(".fp-play-btn, .mob-fp-play-btn, .ctrl.main")
			.forEach((btn) => {
				btn.disabled = isLoading;
				if (isLoading) {
					btn.innerHTML = `<svg class="player-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
						stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
				</svg>`;
				}
			});
	};

	// ── Volume sync ───────────────────────────────────────────
	const syncVolume = (vol) => {
		// Mini player vol fill
		const volFill = root.querySelector(".vol-fill");
		if (volFill) volFill.style.width = `${vol * 100}%`;

		// Full player range input
		const volInput =
			$("fp-volume-input") ?? root.querySelector(".fp-volume-input");
		if (volInput) volInput.value = vol;
	};

	// ── Queue panel update ────────────────────────────────────
	const updateQueuePanel = () => {
		const queueList =
			$("fp-queue-list") ?? root.querySelector(".fp-queue-list");
		if (!queueList) return;

		const queue = store.player.queue;
		const currentIndex = store.player.queueIndex ?? 0;

		queueList.innerHTML = queue
			.map(
				(track, i) => `
			<div class="fp-queue-item ${i === currentIndex ? "fp-queue-item--active" : ""}"
				data-uuid="${track.uuid ?? ""}" data-index="${i}">
				<div class="fp-queue-cover">
					<img src="${track.cover ?? ""}" alt="${track.title}"
						class="fp-queue-img"
						onerror="this.style.display='none'" />
					<div class="fp-queue-fallback">${(track.title ?? "?").charAt(0).toUpperCase()}</div>
				</div>
				<div class="fp-queue-meta">
					<span class="fp-queue-title">${track.title ?? "—"}</span>
					<span class="fp-queue-artist">${track.artist ?? "—"}</span>
				</div>
				${i === currentIndex ? `<i class="bi bi-volume-up fp-queue-playing-icon"></i>` : ""}
			</div>
		`,
			)
			.join("");

		// Queue item click → jump to that track
		queueList.querySelectorAll(".fp-queue-item").forEach((item) => {
			item.addEventListener("click", () => {
				const index = Number(item.dataset.index);
				const track = queue[index];
				if (track) {
					store.player.prepare(track).catch((err) => {
						toast({ message: "Couldn't play track.", type: "error" });
					});
				}
			});
		});
	};

	// ══════════════════════════════════════════════════════════
	// STORE EVENT SUBSCRIPTIONS
	// ══════════════════════════════════════════════════════════
	const unsubs = [];

	unsubs.push(
		store.player.on("play_state_changed", ({ isPlaying }) => {
			syncPlayButton(isPlaying);
		}),
	);

	unsubs.push(
		store.player.on("track_changed", (track) => {
			updateTrackInfo(track);
			updateQueuePanel();
			// Reset progress bar
			updateProgress();
		}),
	);

	unsubs.push(
		store.player.on("track_loading", (isLoading) => {
			syncLoadingState(isLoading);
		}),
	);

	unsubs.push(
		store.player.on("volume_changed", (vol) => {
			syncVolume(vol);
		}),
	);

	unsubs.push(
		store.player.on("queue_changed", () => {
			updateQueuePanel();
		}),
	);

	unsubs.push(
		store.player.on("seeked", () => {
			updateProgress();
		}),
	);

	// ══════════════════════════════════════════════════════════
	// DOM EVENT LISTENERS
	// ══════════════════════════════════════════════════════════

	// ── Play / Pause ──────────────────────────────────────────
	const playBtns = root.querySelectorAll(
		".ctrl.main, .fp-play-btn, .mob-fp-play-btn",
	);
	playBtns.forEach((btn) => {
		btn.addEventListener("click", () => store.player.togglePlay());
	});

	// ── Next ─────────────────────────────────────────────────
	root
		.querySelectorAll(".ctrl-next, .fp-next-btn, .mob-fp-next-btn")
		.forEach((btn) => {
			btn.addEventListener("click", () => store.player.nextTrack());
		});

	// ── Prev ─────────────────────────────────────────────────
	root
		.querySelectorAll(".ctrl-prev, .fp-prev-btn, .mob-fp-prev-btn")
		.forEach((btn) => {
			btn.addEventListener("click", () => store.player.prevTrack());
		});

	// ── Shuffle ───────────────────────────────────────────────
	root.querySelectorAll(".fp-shuffle-btn, .ctrl-shuffle").forEach((btn) => {
		btn.addEventListener("click", () => {
			store.player.toggleShuffle();
			syncShuffleBtn(store.player.isShuffle);
		});
	});

	// ── Repeat ────────────────────────────────────────────────
	root.querySelectorAll(".fp-repeat-btn, .ctrl-repeat").forEach((btn) => {
		btn.addEventListener("click", () => {
			store.player.toggleRepeat();
			syncRepeatBtn(store.player.repeatMode);
		});
	});

	// ── Progress bar seek — mini player ──────────────────────
	const miniTrack = root.querySelector(".track");
	if (miniTrack) {
		miniTrack.addEventListener("click", (e) => {
			const rect = miniTrack.getBoundingClientRect();
			const pct = (e.clientX - rect.left) / rect.width;
			const dur = store.player.duration ?? 0;
			if (dur) store.player.seekTo(pct * dur);
		});
	}

	// ── Progress bar seek — full player ──────────────────────
	const fpBar = $("fp-progress-bar") ?? root.querySelector(".fp-progress-bar");
	if (fpBar) {
		fpBar.addEventListener("click", (e) => {
			const rect = fpBar.getBoundingClientRect();
			const pct = (e.clientX - rect.left) / rect.width;
			const dur = store.player.duration ?? 0;
			if (dur) store.player.seekTo(pct * dur);
		});

		// Drag support
		let dragging = false;
		fpBar.addEventListener("mousedown", () => {
			dragging = true;
		});
		window.addEventListener("mousemove", (e) => {
			if (!dragging) return;
			const rect = fpBar.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (e.clientX - rect.left) / rect.width),
			);
			const dur = store.player.duration ?? 0;
			if (dur) store.player.seekTo(pct * dur);
		});
		window.addEventListener("mouseup", () => {
			dragging = false;
		});

		// Touch seek
		fpBar.addEventListener(
			"touchstart",
			(e) => {
				const rect = fpBar.getBoundingClientRect();
				const touch = e.touches[0];
				const pct = Math.min(
					1,
					Math.max(0, (touch.clientX - rect.left) / rect.width),
				);
				const dur = store.player.duration ?? 0;
				if (dur) store.player.seekTo(pct * dur);
			},
			{ passive: true },
		);
	}

	// ── Volume — mini player track click ─────────────────────
	const volTrack = root.querySelector(".vol-track");
	if (volTrack) {
		volTrack.addEventListener("click", (e) => {
			const rect = volTrack.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (e.clientX - rect.left) / rect.width),
			);
			store.player.volume = pct;
		});
	}

	// ── Volume — full player range input ─────────────────────
	const volInput =
		$("fp-volume-input") ?? root.querySelector(".fp-volume-input");
	if (volInput) {
		volInput.addEventListener("input", (e) => {
			store.player.volume = Number(e.target.value);
		});
	}

	// ── Volume icon mute toggle ───────────────────────────────
	root.querySelectorAll(".vol-icon, .fp-vol-icon").forEach((icon) => {
		icon.addEventListener("click", () => {
			store.player.volume = store.player.volume > 0 ? 0 : 1;
			syncVolume(store.player.volume);
		});
	});

	// ── Mini player → open full player ───────────────────────
	if (isMini) {
		const thumb = root.querySelector(".player-thumb");
		const title = root.querySelector(".player-title");
		[thumb, title].forEach((el) => {
			el?.addEventListener("click", () => {
				if (store.player.currentTrack) router.navigate("/player");
			});
		});

		// Like button in mini player
		root.querySelector(".player-like")?.addEventListener("click", () => {
			// TODO: wire to library/likes API
			toast({ message: "Liked!", type: "success", duration: 1500 });
		});
	}

	// ── Full player collapse ──────────────────────────────────
	root
		.querySelector("#fp-close-btn, .fp-close-btn")
		?.addEventListener("click", () => collapse?.());

	// Mobile swipe down to collapse
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
				if (diff > 80) collapse?.(); // swipe down 80px → collapse
			},
			{ passive: true },
		);
	}

	// ── Full player queue toggle ──────────────────────────────
	root
		.querySelector("#fp-queue-toggle, .fp-queue-toggle")
		?.addEventListener("click", () => {
			const panel = root.querySelector(".fp-queue-panel");
			if (panel) panel.classList.toggle("fp-queue-panel--open");
		});

	// ── Like button — full player ─────────────────────────────
	root
		.querySelector("#fp-like-btn, .fp-like-btn")
		?.addEventListener("click", () => {
			// TODO: wire to library/likes API
			toast({ message: "Liked!", type: "success", duration: 1500 });
		});

	// ── Keyboard shortcuts (full player only) ─────────────────
	if (!isMini) {
		const onKeyDown = (e) => {
			// Don't fire if focus is in an input
			if (e.target.tagName === "INPUT") return;

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
				case "ArrowUp":
					store.player.volume = Math.min(1, store.player.volume + 0.1);
					break;
				case "ArrowDown":
					store.player.volume = Math.max(0, store.player.volume - 0.1);
					break;
				case "KeyN":
					store.player.nextTrack();
					break;
				case "KeyP":
					store.player.prevTrack();
					break;
				case "Escape":
					collapse?.();
					break;
			}
		};
		document.addEventListener("keydown", onKeyDown);
		unsubs.push(() => document.removeEventListener("keydown", onKeyDown));
	}

	// ══════════════════════════════════════════════════════════
	// BOOT — sync UI with current store state on mount
	// ══════════════════════════════════════════════════════════
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

	// ══════════════════════════════════════════════════════════
	// CLEANUP — returned for caller to invoke on unmount
	// ══════════════════════════════════════════════════════════
	return () => {
		stopProgressLoop();
		unsubs.forEach((unsub) => typeof unsub === "function" && unsub());
	};
};

// ── Helpers ───────────────────────────────────────────────────
const formatTime = (seconds = 0) => {
	const s = Math.floor(seconds);
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return `${m}:${rem.toString().padStart(2, "0")}`;
};
