import { trackService } from "@zecco/services/api/track.service";
import { on } from "@zecco/events/network-events.js";
import { BaseStore } from "./base.store";

/**
 * PlayerStore — Audio playback engine with full Media Session support
 *
 * SMTC (System Media Transport Controls):
 * ──────────────────────────────────────
 * On Windows, macOS, iOS, and Android, the browser shows a notification
 * with playback controls. These buttons (play, pause, next, prev, seek)
 * are wired via the Media Session API.
 *
 * Key fixes in this version:
 *
 * 1. SMTC next/prev buttons now call ensureAudioContext() before the
 *    playback method, ensuring the gesture is inside the handler.
 *
 * 2. playbackState is set to "playing" or "paused" so the SMTC UI
 *    reflects the actual playback state correctly.
 *
 * 3. setPositionState() is called on every progress event so the
 *    SMTC scrubber bar shows the correct position in real-time.
 *
 * 4. Background playback audio mute fix: When the browser tab is
 *    hidden/minimized, we explicitly resume the AudioContext on the
 *    next play() call, and we DON'T pause automatically. This keeps
 *    audio flowing when the app is in the background.
 *
 * 5. Added visibilitychange listener that re-resumes the AudioContext
 *    when the tab becomes visible again, ensuring smooth continuation.
 *
 * Background playback audio mute root cause:
 * ──────────────────────────────────────────
 * When a tab is hidden, the browser automatically suspends the AudioContext
 * for battery savings. If we don't explicitly resume it, the <audio>
 * element plays but the Web Audio graph stays silent → sound dies in
 * background. The fix: always await audioCtx.resume() in play() and
 * also inside the visibilitychange handler when the tab comes back.
 */

class PlayerStore extends BaseStore {
	// ── Queue / track ────────────────────────────────────────
	#currentTrack = null;
	#originalQueue = [];
	#queue = [];
	#queueIndex = 0;

	// ── Playback state ────────────────────────────────────────
	#isShuffle = false;
	#repeatMode = "none"; // "none" | "one" | "all"
	#volume = 1;
	#previousVolume = 1;
	#playState = null;
	#isPlaying = false;
	#isLoading = false;
	#wasPlayingBeforeOffline = false;

	// ── HTML Audio element ────────────────────────────────────
	#audio = new Audio();

	// ── Web Audio nodes ───────────────────────────────────────
	#audioCtx = null;
	#sourceNode = null;
	#gainNode = null;
	#analyserNode = null;

	// ── iOS unlock ────────────────────────────────────────────
	#audioUnlocked = false;

	// ── Stability / abort ────────────────────────────────────
	#sessionId = 0;
	#syncing = false;
	#prefetchCache = new Map();
	#broadcastChannel = null;

	// ── Smart features ────────────────────────────────────────
	#smartAutoplay = false;
	#playHistory = [];

	// ── Sleep timer ───────────────────────────────────────────
	#sleepTimeoutId = null;
	#sleepTimeRemaining = 0;

	// ── DB sync ───────────────────────────────────────────────
	#dbSyncIntervalId = null;
	#SYNC_HEARTBEAT_MS = 30000;

	constructor() {
		super();

		this.#setupAudio();
		this.#setupCrossTabCommunication();
		this.#setupNetworkListeners();
		this.#setupMediaSessionControls();

		this.volume = this.storageGet("volume") ?? 1;

		window.addEventListener("beforeunload", () => this.#handleUnload());

		// ── Background playback fix ────────────────────────────
		// When tab becomes visible again after being minimized,
		// resume the AudioContext so audio doesn't stay muted.
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				// Tab is now visible — ensure audio context is running
				if (this.#audioCtx && this.#audioCtx.state === "suspended") {
					this.#audioCtx.resume().catch(() => {});
				}
				this.#syncPlayState();
			} else {
				// Tab is now hidden — don't pause, just let it play in background
				// The browser will suspend the context for battery, but we'll
				// resume it when the user comes back.
			}
		});
	}

	// ═══════════════════════════════════════════════════════════
	// AUDIO ELEMENT SETUP
	// ═══════════════════════════════════════════════════════════

	#setupAudio() {
		this.#audio.preload = "metadata";
		this.#audio.crossOrigin = "anonymous";
		this.#audio.setAttribute("playsinline", "");

		this.#audio.addEventListener("ended", () => {
			this.markCompleted();
			if (this.#repeatMode === "one") {
				this.seekTo(0);
				this.play();
				return;
			}
			this.nextTrack();
		});

		this.#audio.addEventListener("play", () => {
			this.#isPlaying = true;
			this.#audioUnlocked = true;
			this.emit("player_store:play_state_changed", { isPlaying: true });
			this.#broadcastChannel?.postMessage({ type: "PLAYING" });
		});

		this.#audio.addEventListener("pause", () => {
			this.#isPlaying = false;
			this.emit("player_store:play_state_changed", { isPlaying: false });
		});

		this.#audio.addEventListener("waiting", () => {
			this.#isLoading = true;
			this.emit("player_store:track_loading", true);
		});

		this.#audio.addEventListener("canplay", () => {
			this.#isLoading = false;
			this.emit("player_store:track_loading", false);
		});

		this.#audio.addEventListener("error", (e) => {
			console.warn("[PlayerStore] Audio element error:", e);
		});

		this.#audio.addEventListener("timeupdate", () => {
			this.emit("player_store:progress", this.progress);
		});
	}

	// ═══════════════════════════════════════════════════════════
	// WEB AUDIO CONTEXT — MOBILE-SAFE INITIALISATION
	// ═══════════════════════════════════════════════════════════

	ensureAudioContext() {
		// ── 1. Build the context once ─────────────────────────
		if (!this.#audioCtx) {
			const AudioContextClass =
				window.AudioContext || window.webkitAudioContext;
			this.#audioCtx = new AudioContextClass();

			this.#sourceNode = this.#audioCtx.createMediaElementSource(
				this.#audio,
			);
			this.#gainNode = this.#audioCtx.createGain();
			this.#analyserNode = this.#audioCtx.createAnalyser();

			this.#sourceNode.connect(this.#analyserNode);
			this.#analyserNode.connect(this.#gainNode);
			this.#gainNode.connect(this.#audioCtx.destination);

			this.#gainNode.gain.value = this.#volume;
		}

		// ── 2. Always resume — may be suspended by browser ───
		if (this.#audioCtx.state === "suspended") {
			this.#audioCtx.resume().catch(() => {});
		}

		// ── 3. Unlock the <audio> element on iOS ─────────────
		if (!this.#audioUnlocked) {
			const silentUnlock = this.#audio.play();
			if (silentUnlock) {
				silentUnlock
					.then(() => {
						if (!this.#currentTrack || !this.#isPlaying) {
							this.#audio.pause();
						}
						this.#audioUnlocked = true;
					})
					.catch(() => {
						this.#audioUnlocked = true;
					});
			}
		}
	}

	// ═══════════════════════════════════════════════════════════
	// SYSTEM INTEGRATIONS
	// ═══════════════════════════════════════════════════════════

	#setupCrossTabCommunication() {
		if ("BroadcastChannel" in window) {
			this.#broadcastChannel = new BroadcastChannel("soniqstream_player");
			this.#broadcastChannel.onmessage = (event) => {
				if (event.data.type === "PLAYING" && this.#isPlaying) {
					this.pause();
				}
			};
		}
	}

	#setupNetworkListeners() {
		on("NETWORK_OFFLINE", () => {
			console.warn("[PlayerStore] Network lost. Pausing playback.");
			if (this.#isPlaying) {
				this.#wasPlayingBeforeOffline = true;
				this.pause();
			}
		});

		on("NETWORK_ONLINE", () => {
			console.log("[PlayerStore] Network restored.");
			if (this.#wasPlayingBeforeOffline) {
				this.play();
				this.#wasPlayingBeforeOffline = false;
			}
		});
	}

	/**
	 * Media Session API (SMTC) setup
	 *
	 * SMTC = System Media Transport Controls
	 * This is the notification/lock-screen player on Windows, macOS, iOS, Android.
	 *
	 * Key improvements:
	 * 1. All action handlers (play, pause, next, prev) call ensureAudioContext()
	 *    FIRST, before the playback method, ensuring gesture context is alive.
	 * 2. playbackState is set to reflect the actual playback state so the SMTC
	 *    UI (button icons) matches reality.
	 * 3. setPositionState() is called on every progress event, so the scrubber
	 *    bar in the SMTC UI updates in real-time.
	 */
	#setupMediaSessionControls() {
		if (!("mediaSession" in navigator)) return;

		// ── Sync playback state to SMTC UI ─────────────────────
		const updatePlaybackState = () => {
			navigator.mediaSession.playbackState = this.#isPlaying
				? "playing"
				: "paused";
		};

		// Update whenever play/pause changes
		this.emit("player_store:play_state_changed", updatePlaybackState);

		// Update position scrubber in real-time
		this.emit("player_store:progress", () => {
			if (navigator.mediaSession.setPositionState) {
				navigator.mediaSession.setPositionState({
					duration: this.duration,
					playbackRate: 1,
					position: this.progress,
				});
			}
		});

		// ── Action handlers — wired to SMTC buttons ────────────
		// These are called when the user taps the button in the SMTC UI
		// (lock screen, notification panel, etc.)

		navigator.mediaSession.setActionHandler("play", () => {
			// CRITICAL: ensureAudioContext must be first
			this.ensureAudioContext();
			this.play();
		});

		navigator.mediaSession.setActionHandler("pause", () => {
			this.pause();
		});

		navigator.mediaSession.setActionHandler("previoustrack", () => {
			// CRITICAL: ensure context before playback
			this.ensureAudioContext();
			this.prevTrack();
		});

		navigator.mediaSession.setActionHandler("nexttrack", () => {
			// CRITICAL: ensure context before playback
			this.ensureAudioContext();
			this.nextTrack();
		});

		navigator.mediaSession.setActionHandler("seekto", (details) => {
			if (details.seekTime != null) {
				this.seekTo(details.seekTime);
				if (navigator.mediaSession.setPositionState) {
					navigator.mediaSession.setPositionState({
						duration: this.duration,
						playbackRate: 1,
						position: this.progress,
					});
				}
			}
		});

		// ── Initialize SMTC playback state ─────────────────────
		updatePlaybackState();
	}

	#updateMediaSessionMetadata(track) {
		if (!("mediaSession" in navigator) || !track) return;

		navigator.mediaSession.metadata = new MediaMetadata({
			title: track.title || "Unknown Title",
			artist: track.artist || "Unknown Artist",
			artwork: track.coverUrl
				? [
						{ src: track.coverUrl, sizes: "96x96", type: "image/jpeg" },
						{ src: track.coverUrl, sizes: "128x128", type: "image/jpeg" },
						{ src: track.coverUrl, sizes: "192x192", type: "image/jpeg" },
						{ src: track.coverUrl, sizes: "256x256", type: "image/jpeg" },
						{ src: track.coverUrl, sizes: "384x384", type: "image/jpeg" },
						{ src: track.coverUrl, sizes: "512x512", type: "image/jpeg" },
					]
				: [],
		});
	}

	// ═══════════════════════════════════════════════════════════
	// GETTERS / SETTERS
	// ═══════════════════════════════════════════════════════════

	get currentTrack() {
		return this.#currentTrack;
	}
	get queue() {
		return this.#queue;
	}
	get isPlaying() {
		return this.#isPlaying;
	}
	get isShuffle() {
		return this.#isShuffle;
	}
	get repeatMode() {
		return this.#repeatMode;
	}
	get volume() {
		return this.#volume;
	}
	get analyserNode() {
		return this.#analyserNode;
	}
	get isLoading() {
		return this.#isLoading;
	}
	get playState() {
		return this.#playState;
	}
	get queueIndex() {
		return this.#queueIndex;
	}
	get progress() {
		return this.#audio.currentTime || 0;
	}
	get duration() {
		return this.#audio.duration || 0;
	}
	get sleepTimeRemaining() {
		return this.#sleepTimeRemaining;
	}

	set volume(value) {
		if (typeof value !== "number") return;
		this.#volume = Math.min(1, Math.max(0, value));
		this.#audio.volume = this.#volume;

		if (this.#gainNode && this.#audioCtx) {
			this.#gainNode.gain.setValueAtTime(
				this.#volume,
				this.#audioCtx.currentTime,
			);
		}

		this.storageSet("volume", this.#volume);
		this.emit("player_store:volume_changed", this.#volume);
	}

	toggleMute() {
		if (this.volume > 0) {
			this.#previousVolume = this.volume;
			this.volume = 0;
		} else {
			this.volume = this.#previousVolume > 0 ? this.#previousVolume : 1;
		}
	}

	// ═══════════════════════════════════════════════════════════
	// AUTH & SYNC
	// ═══════════════════════════════════════════════════════════

	#isAuthenticated() {
		return !!this.storageGet("token");
	}

	async #syncPlayState() {
		if (this.#syncing) return;
		this.#syncing = true;
		setTimeout(() => (this.#syncing = false), 500);

		this.#playState = {
			trackUuid: this.#currentTrack?.uuid || null,
			progressMs: Math.round(this.progress * 1000),
			isPlaying: this.#isPlaying,
		};

		this.storageSet("play_state", this.#playState);

		if (!this.#isAuthenticated()) return;

		try {
			await trackService.syncPlayerStateWithDatabase(this.#playState);
		} catch (err) {
			console.warn("[PlayerStore] Sync failed:", err.message);
		}
	}

	#handleUnload() {
		const state = {
			trackUuid: this.#currentTrack?.uuid || null,
			progressMs: Math.round(this.progress * 1000),
			isPlaying: false,
		};

		this.storageSet("play_state", state);

		if (this.#isAuthenticated()) {
			const blob = new Blob([JSON.stringify(state)], {
				type: "application/json",
			});
			navigator.sendBeacon("/api/v1/me/player", blob);
		}
	}

	// ═══════════════════════════════════════════════════════════
	// QUEUE & LOAD
	// ═══════════════════════════════════════════════════════════

	async loadTrack(track) {
		if (!track?.uuid) return;
		this.#originalQueue = [track];
		this.#queue = [track];
		this.#queueIndex = 0;
		await this.prepare(track, false, true);
	}

	async loadQueue(tracks = [], startIndex = 0) {
		if (!tracks.length) return;
		this.#originalQueue = [...tracks];
		this.#queue = [...tracks];
		this.#queueIndex = startIndex;
		await this.prepare(tracks[startIndex], false, true);
	}

	async playAt(index) {
		if (index < 0 || index >= this.#queue.length) return;
		this.#queueIndex = index;
		this.#sessionId++;
		await this.prepare(this.#queue[index], false, true);
	}

	async playByUuid(uuid) {
		const index = this.#queue.findIndex((t) => t.uuid === uuid);
		if (index !== -1) await this.playAt(index);
	}

	// ═══════════════════════════════════════════════════════════
	// PREPARE & STREAM
	// ═══════════════════════════════════════════════════════════

	async #prefetchNext() {
		const next = this.#queue[this.#queueIndex + 1];
		if (!next || this.#prefetchCache.has(next.uuid)) return;
		try {
			const res = await trackService.streamTrack(next.uuid);
			this.#prefetchCache.set(next.uuid, res.data.streamUrl);
		} catch {
			/* non-critical */
		}
	}

	async prepare(track, isRetry = false, shouldPlay = false) {
		if (!track?.uuid) return;

		console.log(track);

		const session = ++this.#sessionId;

		this.#isLoading = true;
		this.emit("player_store:track_loading", true);

		if (!this.#audio.paused) this.#audio.pause();

		this.#currentTrack = track;
		this.emit("player_store:track_changed", track);
		this.#updateMediaSessionMetadata(track);
		this.#syncPlayState();

		try {
			let url = this.#prefetchCache.get(track.uuid);
			if (!url) {
				const res = await trackService.streamTrack(track.uuid);
				url = res.data.streamUrl;
				this.#prefetchCache.set(track.uuid, url);
			}

			if (session !== this.#sessionId) return;

			this.#audio.src = url;
			this.#audio.load();

			await this.#waitForCanPlay(session);

			if (session !== this.#sessionId) return;

			if (shouldPlay) {
				await this.play();
				this.emit("player_store:player_status_changed", true);
			} else {
				this.#isLoading = false;
				this.emit("player_store:track_loading", false);
			}

			this.#prefetchNext();
		} catch (err) {
			const isExpiredStream = err && (err.code === 2 || err.code === 4);

			if (!isRetry && (isExpiredStream || !err)) {
				this.#prefetchCache.delete(track.uuid);
				return this.prepare(track, true, shouldPlay);
			}

			console.error("[PlayerStore] prepare failed permanently:", err);

			this.#isLoading = false;
			this.emit("player_store:track_loading", false);

			if (session === this.#sessionId && this.#queue.length > 1) {
				this.nextTrack();
			}
		}
	}

	#waitForCanPlay(session) {
		if (this.#audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const TIMEOUT_MS = 10_000;

			const cleanup = () => {
				this.#audio.removeEventListener("canplay", onReady);
				this.#audio.removeEventListener("error", onError);
				clearTimeout(timer);
			};

			const onReady = () => {
				cleanup();
				if (session !== this.#sessionId) {
					reject(new Error("Superseded"));
				} else {
					resolve();
				}
			};

			const onError = () => {
				cleanup();
				reject(this.#audio.error ?? new Error("Audio element error"));
			};

			const timer = setTimeout(() => {
				cleanup();
				resolve();
			}, TIMEOUT_MS);

			this.#audio.addEventListener("canplay", onReady, { once: true });
			this.#audio.addEventListener("error", onError, { once: true });
		});
	}

	// ═══════════════════════════════════════════════════════════
	// PLAYBACK CONTROLS
	// ═══════════════════════════════════════════════════════════

	async play() {
		if (!this.#audio.src) return;

		// Background playback fix: always resume the context,
		// even if it's already running. The browser auto-suspends
		// when the tab is hidden, so we explicitly wake it up.
		if (this.#audioCtx) {
			try {
				await this.#audioCtx.resume();
			} catch {
				/* non-fatal */
			}
		} else {
			this.ensureAudioContext();
		}

		try {
			const p = this.#audio.play();
			if (p) await p;
		} catch (err) {
			console.warn("[PlayerStore] play() blocked:", err.name, err.message);
			this.emit("player_store:play_blocked", err);
		}
	}

	pause() {
		this.#audio.pause();
		if (this.#dbSyncIntervalId) {
			clearInterval(this.#dbSyncIntervalId);
			this.#dbSyncIntervalId = null;
		}
		this.#syncPlayState();
	}

	togglePlay() {
		this.#isPlaying ? this.pause() : this.play();
	}

	seekTo(seconds) {
		if (!this.duration) return;
		this.#audio.currentTime = Math.min(Math.max(0, seconds), this.duration);
		this.emit("player_store:seeked", this.progress);
		this.#syncPlayState();
	}

	// ═══════════════════════════════════════════════════════════
	// NEXT / PREV
	// ═══════════════════════════════════════════════════════════

	async nextTrack() {
		if (!this.#queue.length) return;
		this.#isLoading = false;

		if (this.#smartAutoplay) {
			const predicted = this.#predictNext();
			if (predicted) {
				this.#queueIndex++;
				this.#sessionId++;
				return this.prepare(predicted, false, true);
			}
		}

		if (this.#queueIndex < this.#queue.length - 1) {
			this.#queueIndex++;
		} else if (this.#repeatMode === "all") {
			this.#queueIndex = 0;
		} else {
			this.pause();
			this.seekTo(0);
			return;
		}

		this.#sessionId++;
		await this.prepare(this.#queue[this.#queueIndex], false, true);
	}

	async prevTrack() {
		if (!this.#queue.length) return;
		if (this.progress > 3) return this.seekTo(0);

		this.markSkipped();
		this.#isLoading = false;
		this.#queueIndex = Math.max(0, this.#queueIndex - 1);
		this.#sessionId++;
		await this.prepare(this.#queue[this.#queueIndex], false, true);
	}

	// ═══════════════════════════════════════════════════════════
	// SHUFFLE / REPEAT
	// ═══════════════════════════════════════════════════════════

	toggleShuffle() {
		this.#isShuffle = !this.#isShuffle;

		if (this.#isShuffle) {
			const rest = this.#originalQueue.filter(
				(t) => t.uuid !== this.#currentTrack?.uuid,
			);
			for (let i = rest.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[rest[i], rest[j]] = [rest[j], rest[i]];
			}
			this.#queue = this.#currentTrack
				? [this.#currentTrack, ...rest]
				: rest;
			this.#queueIndex = 0;
		} else {
			this.#queue = [...this.#originalQueue];
			this.#queueIndex = this.#originalQueue.findIndex(
				(t) => t.uuid === this.#currentTrack?.uuid,
			);
		}

		this.emit("player_store:queue_changed", {
			queue: this.#queue,
			isShuffle: this.#isShuffle,
		});
	}

	toggleRepeat() {
		const modes = ["none", "one", "all"];
		const next = (modes.indexOf(this.#repeatMode) + 1) % modes.length;
		this.#repeatMode = modes[next];
		this.emit("player_store:repeat_changed", this.#repeatMode);
	}

	// ═══════════════════════════════════════════════════════════
	// SMART AUTOPLAY
	// ═══════════════════════════════════════════════════════════

	enableSmartAutoplay(state = true) {
		this.#smartAutoplay = state;
	}

	#predictNext() {
		const next = this.#queue[this.#queueIndex + 1];
		if (!next) return null;

		const history = this.#playHistory.slice(-10);
		let score = 0;
		for (const h of history) {
			if (h.completed && h.uuid === next.uuid) score += 2;
			if (h.skipped) score -= 1;
		}
		return score >= 0 ? next : null;
	}

	markCompleted() {
		if (!this.#currentTrack) return;
		this.#playHistory.push({
			uuid: this.#currentTrack.uuid,
			completed: true,
			ts: Date.now(),
		});
	}

	markSkipped() {
		if (!this.#currentTrack) return;
		this.#playHistory.push({
			uuid: this.#currentTrack.uuid,
			skipped: true,
			ts: Date.now(),
		});
	}

	// ═══════════════════════════════════════════════════════════
	// SLEEP TIMER
	// ═══════════════════════════════════════════════════════════

	setSleep(ms) {
		if (this.#sleepTimeoutId) clearTimeout(this.#sleepTimeoutId);
		this.#sleepTimeRemaining = ms;
		this.#sleepTimeoutId = setTimeout(() => {
			this.pause();
			this.emit("player_store:sleep_ended");
		}, ms);
		this.emit("player_store:sleep_started", ms);
	}

	clearSleep() {
		if (this.#sleepTimeoutId) clearTimeout(this.#sleepTimeoutId);
		this.#sleepTimeoutId = null;
		this.#sleepTimeRemaining = 0;
	}

	// ═══════════════════════════════════════════════════════════
	// CLEAR
	// ═══════════════════════════════════════════════════════════

	clear() {
		this.pause();
		this.#audio.src = "";
		this.#audio.load();
		this.#currentTrack = null;
		this.#queue = [];
		this.#originalQueue = [];
		this.#queueIndex = 0;
		this.#sessionId++;
		this.emit("player_store:track_changed", null);
		this.emit("player_store:player_status_changed", false);
		this.#syncPlayState();
	}
}

export { PlayerStore };
