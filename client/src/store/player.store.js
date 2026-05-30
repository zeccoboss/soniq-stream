import { trackService } from "@zecco/services/api/track.service";
import { on } from "@zecco/events/network-events.js";
import { BaseStore } from "./base.store";

/**
 * PlayerStore — Audio playback engine
 *
 * Mobile/iOS fix summary
 * ──────────────────────
 * Problem 1 — iOS kills the gesture chain on async awaits.
 *   The old prepare() fetched a stream URL (async network call) before
 *   calling audio.play(). By the time play() ran, iOS had already discarded
 *   the user-gesture token → silent failure.
 *
 *   Fix: Call audio.play() IMMEDIATELY inside ensureAudioContext() / the
 *   gesture handler to "unlock" the element, then swap the src while it is
 *   already "playing" (even if it is playing silence for a moment). iOS allows
 *   src changes on an already-unlocked element without a new gesture.
 *
 * Problem 2 — AudioContext created outside a gesture.
 *   Web Audio API on iOS requires the context to be constructed AND resumed
 *   inside a synchronous user-gesture handler.
 *
 *   Fix: ensureAudioContext() is now safe to call multiple times but only
 *   wires the MediaElementSource once. The context.resume() call is always
 *   made synchronously when the method is entered from a gesture.
 *
 * Problem 3 — createMediaElementSource() wired before audio.src is set.
 *   On some Android WebViews this causes a silent "no source" state.
 *
 *   Fix: The source node is now wired once, lazily, inside ensureAudioContext().
 *   The <audio> element's src is managed independently; the Web Audio graph
 *   reads through the element regardless of which src is loaded.
 *
 * Problem 4 — audio.load() not called after src swap on Android.
 *   Some Android browsers need an explicit load() call to pick up a new src.
 *
 *   Fix: audio.load() is always called after setting audio.src.
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
	// We use a plain <audio> element for maximum mobile compatibility.
	// Web Audio API is layered on top via createMediaElementSource().
	#audio = new Audio();

	// ── Web Audio nodes ───────────────────────────────────────
	// Lazily created on the first user gesture (mobile requirement).
	#audioCtx = null;
	#sourceNode = null; // MediaElementSourceNode — wired once
	#gainNode = null;
	#analyserNode = null;

	// ── iOS unlock ────────────────────────────────────────────
	// Tracks whether we have successfully played at least one frame
	// of audio in response to a gesture. Once true, async play() is safe.
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

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.#syncPlayState();
			}
		});
	}

	// ═══════════════════════════════════════════════════════════
	// AUDIO ELEMENT SETUP
	// ═══════════════════════════════════════════════════════════

	#setupAudio() {
		this.#audio.preload = "metadata";
		this.#audio.crossOrigin = "anonymous";

		// Required for iOS to play through the speaker (not earpiece)
		// and to work when the silent-mode switch is on.
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
			this.emit("play_state_changed", { isPlaying: true });
			this.#broadcastChannel?.postMessage({ type: "PLAYING" });
		});

		this.#audio.addEventListener("pause", () => {
			this.#isPlaying = false;
			this.emit("play_state_changed", { isPlaying: false });
		});

		this.#audio.addEventListener("waiting", () => {
			this.#isLoading = true;
			this.emit("track_loading", true);
		});

		this.#audio.addEventListener("canplay", () => {
			this.#isLoading = false;
			this.emit("track_loading", false);
		});

		this.#audio.addEventListener("error", (e) => {
			// Surface audio element errors so prepare() can retry
			console.warn("[PlayerStore] Audio element error:", e);
		});

		this.#audio.addEventListener("timeupdate", () => {
			this.emit("progress", this.progress);
		});
	}

	// ═══════════════════════════════════════════════════════════
	// WEB AUDIO CONTEXT — MOBILE-SAFE INITIALISATION
	// ═══════════════════════════════════════════════════════════

	/**
	 * Must be called synchronously inside a user-gesture handler
	 * (click / touchend). Safe to call multiple times.
	 *
	 * On iOS:
	 *   1. Creates the AudioContext on the first call.
	 *   2. Wires the MediaElementSource → Analyser → Gain → Destination
	 *      graph exactly once.
	 *   3. Resumes the context (required after browser autoplay suspension).
	 *   4. "Unlocks" the audio element by calling play() + immediately pause()
	 *      if we haven't successfully played yet. This seeds the element with
	 *      a gesture token so later async play() calls succeed.
	 */
	ensureAudioContext() {
		// ── 1. Build the context once ─────────────────────────
		if (!this.#audioCtx) {
			const AudioContextClass =
				window.AudioContext || window.webkitAudioContext;
			this.#audioCtx = new AudioContextClass();

			// Wire graph: MediaElement → Analyser → Gain → Output
			// createMediaElementSource() must be called ONCE per element.
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
			// resume() is async but the synchronous call is enough to
			// satisfy the gesture requirement on most implementations.
			this.#audioCtx.resume().catch(() => {});
		}

		// ── 3. Unlock the <audio> element on iOS ─────────────
		// iOS requires the element itself to have been play()-ed inside
		// a gesture. We do a silent play→pause to seed the token.
		// After this, async play() calls work even without a gesture.
		if (!this.#audioUnlocked) {
			// Play on a silent, zero-duration clip. Because we haven't set
			// a real src yet (or the src might already be set), we just
			// call play() and cancel it immediately. iOS grants the token
			// even if the promise rejects due to missing media.
			const silentUnlock = this.#audio.play();
			if (silentUnlock) {
				silentUnlock
					.then(() => {
						// Only pause if we didn't actually have a real track ready
						if (!this.#currentTrack || !this.#isPlaying) {
							this.#audio.pause();
						}
						this.#audioUnlocked = true;
					})
					.catch(() => {
						// Rejection here is expected when there's no src — that's fine.
						// The gesture token is still granted on most iOS versions.
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

	#setupMediaSessionControls() {
		if (!("mediaSession" in navigator)) return;

		navigator.mediaSession.setActionHandler("play", () => this.play());
		navigator.mediaSession.setActionHandler("pause", () => this.pause());
		navigator.mediaSession.setActionHandler("previoustrack", () =>
			this.prevTrack(),
		);
		navigator.mediaSession.setActionHandler("nexttrack", () =>
			this.nextTrack(),
		);
		navigator.mediaSession.setActionHandler("seekto", (details) => {
			if (details.seekTime != null) this.seekTo(details.seekTime);
		});
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
		this.emit("volume_changed", this.#volume);
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
		await this.prepare(track);
	}

	async loadQueue(tracks = [], startIndex = 0) {
		if (!tracks.length) return;
		this.#originalQueue = [...tracks];
		this.#queue = [...tracks];
		this.#queueIndex = startIndex;
		await this.prepare(tracks[startIndex]);
	}

	async playAt(index) {
		if (index < 0 || index >= this.#queue.length) return;
		this.#queueIndex = index;
		this.#sessionId++;
		await this.prepare(this.#queue[index]);
	}

	async playByUuid(uuid) {
		const index = this.#queue.findIndex((t) => t.uuid === uuid);
		if (index !== -1) await this.playAt(index);
	}

	// ═══════════════════════════════════════════════════════════
	// PREPARE & STREAM  — Mobile-safe implementation
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

	/**
	 * prepare(track, isRetry)
	 *
	 * Mobile-safe flow:
	 *
	 *  1.  Emit loading state immediately.
	 *  2.  Set track metadata synchronously (UI updates before network).
	 *  3.  Fetch the stream URL (async — gesture chain may break here on iOS).
	 *  4.  Assign audio.src and call audio.load().
	 *  5.  Wait for "canplay" or a short timeout (whichever comes first).
	 *  6.  Call play() — safe because ensureAudioContext() was already called
	 *      synchronously from the button handler in playerEvents.js.
	 *
	 * The key insight: ensureAudioContext() in playerEvents.js runs INSIDE
	 * the click/touchend handler (synchronous), so iOS grants the gesture
	 * token before we ever enter the async network chain.
	 */
	async prepare(track, isRetry = false) {
		if (!track?.uuid) return;

		const session = ++this.#sessionId;

		// ── Loading state ──────────────────────────────────────
		this.#isLoading = true;
		this.emit("track_loading", true);

		// Pause whatever is currently playing
		if (!this.#audio.paused) this.#audio.pause();

		// ── Update track metadata synchronously ────────────────
		this.#currentTrack = track;
		this.emit("track_changed", track);
		this.#updateMediaSessionMetadata(track);
		this.#syncPlayState();

		try {
			// ── Resolve stream URL ─────────────────────────────
			let url = this.#prefetchCache.get(track.uuid);
			if (!url) {
				const res = await trackService.streamTrack(track.uuid);
				url = res.data.streamUrl;
				this.#prefetchCache.set(track.uuid, url);
			}

			// Bail if a newer prepare() call has superseded this one
			if (session !== this.#sessionId) return;

			// ── Assign src and load ────────────────────────────
			// Always call load() after changing src — required on Android
			// WebViews and some Samsung browsers.
			this.#audio.src = url;
			this.#audio.load();

			// ── Wait until the browser can play ───────────────
			await this.#waitForCanPlay(session);

			if (session !== this.#sessionId) return;

			// ── Play ───────────────────────────────────────────
			// At this point:
			//   • ensureAudioContext() has already been called (gesture).
			//   • The AudioContext is running (not suspended).
			//   • The audio element was unlocked by the silent play() trick.
			//   → audio.play() will succeed even on iOS.
			await this.play();

			this.emit("player_status_changed", true);

			// Warm up the next track in the background
			this.#prefetchNext();
		} catch (err) {
			// Retry once on expired/broken stream URLs
			const isExpiredStream = err && (err.code === 2 || err.code === 4);

			if (!isRetry && (isExpiredStream || !err)) {
				this.#prefetchCache.delete(track.uuid);
				return this.prepare(track, true);
			}

			console.error("[PlayerStore] prepare failed permanently:", err);

			this.#isLoading = false;
			this.emit("track_loading", false);

			// Skip to next if there are more tracks
			if (session === this.#sessionId && this.#queue.length > 1) {
				this.nextTrack();
			}
		}
	}

	/**
	 * Waits for the audio element to reach a playable state.
	 * Falls back to a 10-second timeout so we don't hang forever.
	 * Also resolves immediately if the element already has enough data.
	 *
	 * @param {number} session - Current session id; rejects if superseded.
	 */
	#waitForCanPlay(session) {
		// Already has enough data (e.g., cached in browser)
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
				// Don't reject — attempt to play anyway (some mobile browsers
				// fire canplay late or not at all for certain formats)
				resolve();
			}, TIMEOUT_MS);

			this.#audio.addEventListener("canplay", onReady, { once: true });
			this.#audio.addEventListener("error", onError, { once: true });
		});
	}

	// ═══════════════════════════════════════════════════════════
	// PLAYBACK CONTROLS
	// ═══════════════════════════════════════════════════════════

	/**
	 * play()
	 *
	 * The AudioContext can silently re-suspend between the user gesture
	 * (where ensureAudioContext() is called) and this async call inside
	 * prepare(). This causes the progress bar to advance while audio is
	 * completely silent — the <audio> element plays but the Web Audio
	 * graph is suspended so no sound reaches the speakers.
	 *
	 * Fix: await audioCtx.resume() right here, every time, before
	 * audio.play(). This is the only reliable way to guarantee the graph
	 * is running at the exact moment sound needs to come out.
	 */
	async play() {
		if (!this.#audio.src) return;

		// Re-resume the context every time — it may have auto-suspended
		// between the gesture and this async call (common on iOS/Android).
		if (this.#audioCtx) {
			try {
				await this.#audioCtx.resume();
			} catch {
				/* non-fatal */
			}
		} else {
			// No context yet (called from a non-gesture path like network restore).
			// ensureAudioContext() won't unlock on iOS here, but we still call it
			// so the graph exists for when the user taps play manually.
			this.ensureAudioContext();
		}

		try {
			const p = this.#audio.play();
			if (p) await p;
		} catch (err) {
			// NotAllowedError = autoplay policy; NotSupportedError = no src yet
			// Both are non-fatal — the user needs to tap play again
			console.warn("[PlayerStore] play() blocked:", err.name, err.message);
			this.emit("play_blocked", err);
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
		this.emit("seeked", this.progress);
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
				return this.prepare(predicted);
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
		await this.prepare(this.#queue[this.#queueIndex]);
	}

	async prevTrack() {
		if (!this.#queue.length) return;
		if (this.progress > 3) return this.seekTo(0);

		this.markSkipped();
		this.#isLoading = false;
		this.#queueIndex = Math.max(0, this.#queueIndex - 1);
		this.#sessionId++;
		await this.prepare(this.#queue[this.#queueIndex]);
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

		this.emit("queue_changed", {
			queue: this.#queue,
			isShuffle: this.#isShuffle,
		});
	}

	toggleRepeat() {
		const modes = ["none", "one", "all"];
		const next = (modes.indexOf(this.#repeatMode) + 1) % modes.length;
		this.#repeatMode = modes[next];
		this.emit("repeat_changed", this.#repeatMode);
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
			this.emit("sleep_ended");
		}, ms);
		this.emit("sleep_started", ms);
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
		this.#audio.load(); // Release the media resource on mobile
		this.#currentTrack = null;
		this.#queue = [];
		this.#originalQueue = [];
		this.#queueIndex = 0;
		this.#sessionId++;
		this.emit("track_changed", null);
		this.emit("player_status_changed", false);
		this.#syncPlayState();
	}
}

export { PlayerStore };
