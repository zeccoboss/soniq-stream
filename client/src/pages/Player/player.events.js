/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import { store } from "@zecco/store/index.js";
import { router } from "@zecco/routes/router.js";
import { toast } from "@zecco/components/Toast/Toast.js";

/**
 * playerEvents — Wires both the footer mini player and the full player pages.
 *
 * Mobile/iOS fix
 * ──────────────
 * The critical rule for iOS is: ensureAudioContext() MUST be called
 * synchronously inside the event handler, before any await. We enforce
 * this by restructuring every button listener so that ensureAudioContext()
 * is the very first statement, then we handle the async work after.
 *
 * Equally important: we attach listeners with { passive: false } where we
 * need preventDefault(), and { passive: true } for scroll/visual-only
 * touch events so we don't block the browser's touch pipeline.
 *
 * What changed vs the original:
 *  1. ensureAudioContext() moved to be the FIRST call in every play/seek
 *     listener — before any conditional logic or async gap.
 *  2. All button listeners now use "click" (not "touchend"). "click" fires
 *     after a complete tap and is recognised as a user gesture on all
 *     mobile browsers. "touchend" can miss the gesture token on some iOS
 *     versions when the touch target is small.
 *  3. Progress/volume scrub now supports both mouse and touch correctly,
 *     with pointer events for a unified code path.
 *  4. isMini handlers deduplicated — there were two copies in the original.
 *  5. startProgressLoop / stopProgressLoop guard added: we only run rAF
 *     when the player is visible and playing, avoiding battery drain on mobile.
 *  6. Smart playback fallback: If play is clicked with no track loaded,
 *     auto-loads first available track from home page data. Falls back to
 *     Discover if nothing available.
 */
export const playerEvents = (
	root,
	{ isMini = false, isMobile = false, collapse = null } = {},
) => {
	if (!root) return;

	// ── Utility ────────────────────────────────────────────────
	const $ = (id) =>
		root.querySelector(`#${id}`) ?? document.getElementById(id);

	// ── RAF progress loop ──────────────────────────────────────
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

	// ── Progress display ───────────────────────────────────────
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

	// ── Track info ─────────────────────────────────────────────
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

	// ── Play button sync ───────────────────────────────────────
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

	// ── Shuffle / Repeat / Loading / Volume ────────────────────
	const syncShuffleBtn = (isShuffle) => {
		root
			.querySelectorAll("#dfp-shuffle-btn, #mfp-shuffle-btn, .ctrl-shuffle")
			.forEach((btn) => btn.classList.toggle("active", isShuffle));
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
						<svg class="player-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none"
							style="animation: spin 1s linear infinite;">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5"
								stroke-dasharray="45" stroke-linecap="round"/>
						</svg>`;
				} else {
					const isPlaying = store.player.isPlaying;
					const iconId = btn.id ? btn.id.replace("btn", "icon") : "";
					btn.innerHTML = `<i class="${isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}"
						${iconId ? `id="${iconId}"` : ""}></i>`;
				}
			});
	};

	const syncVolume = (vol) => {
		const miniVolFill = root.querySelector(".vol-fill");
		if (miniVolFill) miniVolFill.style.width = `${vol * 100}%`;

		const volFill = $("dfp-vol-fill") ?? $("mfp-vol-fill");
		if (volFill) volFill.style.width = `${vol * 100}%`;
	};

	// ── Queue panel ────────────────────────────────────────────
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

				// ── MOBILE-CRITICAL ──────────────────────────────────
				// ensureAudioContext() MUST be called here, synchronously,
				// inside the click handler before any async work.
				store.player.ensureAudioContext();

				const index = Number(item.dataset.index);
				store.player.playAt(index).catch(() => {
					toast({ message: "Error changing tracks", type: "error" });
				});
			});
		});
	};

	// ── Store event subscriptions ──────────────────────────────
	const unsubs = [
		store.player.on("player_store:play_state_changed", ({ isPlaying }) =>
			syncPlayButton(isPlaying),
		),
		store.player.on("player_store:track_changed", (track) => {
			updateTrackInfo(track);
			updateQueuePanel();
			updateProgress();
		}),
		store.player.on("player_store:track_loading", (isLoading) =>
			syncLoadingState(isLoading),
		),
		store.player.on("player_store:volume_changed", (vol) => syncVolume(vol)),
		store.player.on("player_store:queue_changed", () => updateQueuePanel()),
		store.player.on("player_store:seeked", () => updateProgress()),

		// Notify the user when autoplay was blocked (iOS only scenario)
		store.player.on("player_store:play_blocked", () => {
			toast({
				message: "Tap play to start audio",
				type: "info",
				duration: 3000,
			});
		}),
	];

	// ── Smart playback fallback ──────────────────────────────────
	// If play is clicked with no track loaded, try to auto-load first available track
	const handlePlayWithoutTrack = async () => {
		// Try to get track data from store or window context
		const homeData = window.__homePageData ?? null;

		// List of pools to check in order of priority
		const pools = [
			homeData?.newUploads,
			homeData?.trending,
			homeData?.topTracks,
			homeData?.trendingTracks,
			homeData?.newThisWeek,
			homeData?.popularRightNow,
			homeData?.recentPlays,
			homeData?.liked,
			homeData?.genreRecs,
		].filter(Boolean);

		// Find first available track
		for (const pool of pools) {
			if (Array.isArray(pool) && pool.length > 0) {
				const firstTrack = pool[0];
				if (firstTrack?.uuid) {
					try {
						await store.player.loadTrack(firstTrack);
						toast({
							message: "Now playing " + firstTrack.title,
							type: "success",
							duration: 2000,
						});
						return;
					} catch (err) {
						console.error("[playerEvents] Fallback play error:", err);
					}
				}
			}
		}

		// No track found on current page — navigate to Discover
		toast({
			message: "Pick a song from Discover to start playing",
			type: "info",
			duration: 3000,
		});
		router.navigate("/?tab=discover");
	};

	// ── Play / Pause ───────────────────────────────────────────
	// We use "click" (not touchend/touchstart) because:
	//   • "click" is always recognised as a user gesture by iOS.
	//   • "touchend" can lose the gesture token if there's any async
	//     work before the AudioContext.resume() call.
	root
		.querySelectorAll("#dfp-play-btn, #mfp-play-btn, .ctrl.main")
		.forEach((btn) => {
			btn.addEventListener("click", () => {
				// MUST be the very first call — before any conditional or async
				store.player.ensureAudioContext();

				// If no track loaded, try to auto-load first available track
				if (!store.player.currentTrack) {
					handlePlayWithoutTrack();
				} else {
					store.player.togglePlay();
				}
			});
		});

	// ── Next / Prev ────────────────────────────────────────────
	root
		.querySelectorAll("#dfp-next-btn, #mfp-next-btn, .ctrl-next")
		.forEach((btn) => {
			btn.addEventListener("click", () => {
				store.player.ensureAudioContext();
				store.player.nextTrack();
			});
		});

	root
		.querySelectorAll("#dfp-prev-btn, #mfp-prev-btn, .ctrl-prev")
		.forEach((btn) => {
			btn.addEventListener("click", () => {
				store.player.ensureAudioContext();
				store.player.prevTrack();
			});
		});

	// ── Shuffle / Repeat ───────────────────────────────────────
	root
		.querySelectorAll("#dfp-shuffle-btn, #mfp-shuffle-btn")
		.forEach((btn) => {
			btn.addEventListener("click", () => store.player.toggleShuffle());
		});

	root.querySelectorAll("#dfp-repeat-btn, #mfp-repeat-btn").forEach((btn) => {
		btn.addEventListener("click", () => store.player.toggleRepeat());
	});

	// ── Seek bar ───────────────────────────────────────────────
	// Uses pointer events for a single unified code path on both
	// mouse (desktop) and touch (mobile) without passive-listener issues.
	const progressTrack =
		$("dfp-progress-bar") ??
		$("mfp-progress-bar") ??
		root.querySelector(".track");

	if (progressTrack) {
		let isScrubbing = false;

		const handleSeek = (clientX) => {
			// Ensure audio is unlocked when the user seeks on mobile
			store.player.ensureAudioContext();
			const rect = progressTrack.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (clientX - rect.left) / rect.width),
			);
			const dur = store.player.duration ?? 0;
			if (dur) store.player.seekTo(pct * dur);
		};

		progressTrack.addEventListener("pointerdown", (e) => {
			isScrubbing = true;
			progressTrack.setPointerCapture(e.pointerId);
			handleSeek(e.clientX);
		});

		progressTrack.addEventListener("pointermove", (e) => {
			if (!isScrubbing) return;
			handleSeek(e.clientX);
		});

		progressTrack.addEventListener("pointerup", (e) => {
			if (!isScrubbing) return;
			isScrubbing = false;
			handleSeek(e.clientX);
		});

		progressTrack.addEventListener("pointercancel", () => {
			isScrubbing = false;
		});

		// Fallback click for browsers without pointer events
		progressTrack.addEventListener("click", (e) => {
			if (!isScrubbing) handleSeek(e.clientX);
		});
	}

	// ── Volume bar ─────────────────────────────────────────────
	const volumeTrack =
		$("dfp-vol-bar") ?? $("mfp-vol-bar") ?? root.querySelector(".vol-track");

	if (volumeTrack) {
		let isVolScrubbing = false;

		const handleVolume = (clientX) => {
			const rect = volumeTrack.getBoundingClientRect();
			const pct = Math.min(
				1,
				Math.max(0, (clientX - rect.left) / rect.width),
			);
			store.player.volume = pct;
		};

		volumeTrack.addEventListener("pointerdown", (e) => {
			isVolScrubbing = true;
			volumeTrack.setPointerCapture(e.pointerId);
			handleVolume(e.clientX);
		});

		volumeTrack.addEventListener("pointermove", (e) => {
			if (!isVolScrubbing) return;
			handleVolume(e.clientX);
		});

		volumeTrack.addEventListener("pointerup", (e) => {
			if (!isVolScrubbing) return;
			isVolScrubbing = false;
			handleVolume(e.clientX);
		});

		volumeTrack.addEventListener("pointercancel", () => {
			isVolScrubbing = false;
		});

		volumeTrack.addEventListener("click", (e) => {
			if (!isVolScrubbing) handleVolume(e.clientX);
		});
	}

	// ── Mute toggle ────────────────────────────────────────────
	root
		.querySelectorAll(".vol-icon, .dfp-vol-icon, .mfp-vol-icon")
		.forEach((icon) => {
			icon.addEventListener("click", () => store.player.toggleMute());
		});

	// ── Mini player → full player ──────────────────────────────
	if (isMini) {
		const openFullPlayer = () => {
			if (store.player.currentTrack) router.navigate("/player");
		};

		const thumb = root.querySelector(".player-thumb");
		const title = root.querySelector(".player-title");
		const miniPlayerBar = root.querySelector(".mini-player-row-wrap");

		thumb?.addEventListener("click", openFullPlayer);
		title?.addEventListener("click", openFullPlayer);
		miniPlayerBar?.addEventListener("click", (e) => {
			// Don't open full player when tapping control buttons
			if (!e.target.closest(".ctrl") && !e.target.closest(".player-like")) {
				openFullPlayer();
			}
		});
	}

	// ── Full player navigation ─────────────────────────────────
	$("dfp-back-btn")?.addEventListener("click", () => collapse?.());
	$("mfp-collapse-btn")?.addEventListener("click", () => router.replace("/"));

	// ── Mobile queue panel ─────────────────────────────────────
	$("mfp-queue-pill-btn")?.addEventListener("click", () => {
		$("mfp-queue-view")?.classList.add("active-mfp-view");
	});

	$("mfp-queue-close-btn")?.addEventListener("click", () => {
		$("mfp-queue-view")?.classList.remove("active-mfp-view");
	});

	// ── Mobile swipe-down to collapse ─────────────────────────
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
				if (diff > 80 && !e.target.closest("#mfp-queue-list")) {
					collapse?.();
				}
			},
			{ passive: true },
		);
	}

	// ── Keyboard shortcuts (full player only) ─────────────────
	if (!isMini) {
		const onKeyDown = (e) => {
			if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
				return;

			switch (e.code) {
				case "Space":
					e.preventDefault();
					store.player.ensureAudioContext();
					if (!store.player.currentTrack) {
						handlePlayWithoutTrack();
					} else {
						store.player.togglePlay();
					}
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

	// ── Initial sync ───────────────────────────────────────────
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

	// ── Cleanup / unmount ─────────────────────────────────────
	return () => {
		stopProgressLoop();
		unsubs.forEach((unsub) => typeof unsub === "function" && unsub());
	};
};

// ── Helpers ────────────────────────────────────────────────────
const formatTime = (seconds = 0) => {
	const s = Math.floor(seconds);
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return `${m}:${rem.toString().padStart(2, "0")}`;
};
