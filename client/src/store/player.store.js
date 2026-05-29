import { trackService } from "@zecco/services/api/track.service";
import { on } from "@zecco/events/network-events.js"; // <-- Imported your custom emitter
import { BaseStore } from "./base.store";

class PlayerStore extends BaseStore {
	#currentTrack = null;
	#originalQueue = [];
	#queue = [];
	#queueIndex = 0;

	#isShuffle = false;
	#repeatMode = "none";
	#volume = 1;
	#previousVolume = 1;
	#playState = null;

	#audio = new Audio();

	#audioCtx = null;
	#sourceNode = null;
	#gainNode = null;
	#analyserNode = null;

	#isPlaying = false;
	#isLoading = false;
	#wasPlayingBeforeOffline = false;

	#dbSyncIntervalId = null;
	#SYNC_HEARTBEAT_MS = 30000;

	#sleepTimeoutId = null;
	#sleepIntervalId = null;
	#sleepTimeRemaining = 0;

	// =========================
	// STABILITY CORE
	// =========================
	#sessionId = 0;
	#abortController = null;
	#syncing = false;
	#prefetchCache = new Map();
	#broadcastChannel = null;

	// =========================
	// SMART FEATURES STATE
	// =========================
	#smartAutoplay = false;
	#playHistory = [];

	constructor() {
		super();

		this.#setupAudio();
		this.#setupCrossTabCommunication();
		this.#setupNetworkListeners(); // <-- Now uses your custom event bus
		this.#setupMediaSessionControls();

		this.volume = this.storageGet("volume") ?? 1;

		window.addEventListener("beforeunload", () => this.#handleUnload());

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.#syncPlayState();
			}
		});
	}

	// =========================
	// AUDIO SETUP
	// =========================
	#setupAudio() {
		this.#audio.preload = "metadata";
		this.#audio.crossOrigin = "anonymous";

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
			this.emit("play_state_changed", { isPlaying: true });
			if (this.#broadcastChannel) {
				this.#broadcastChannel.postMessage({ type: "PLAYING" });
			}
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

		this.#audio.addEventListener("timeupdate", () => {
			this.emit("progress", this.progress);
		});
	}

	ensureAudioContext() {
		if (!this.#audioCtx) {
			this.#audioCtx = new (
				window.AudioContext || window.webkitAudioContext
			)();
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

		if (this.#audioCtx.state === "suspended") {
			this.#audioCtx.resume();
		}
	}

	// =========================
	// SYSTEM INTEGRATIONS
	// =========================
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
		// FIXED: Subscribing to your custom pub/sub engine
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
		if ("mediaSession" in navigator) {
			navigator.mediaSession.setActionHandler("play", () => this.play());
			navigator.mediaSession.setActionHandler("pause", () => this.pause());
			navigator.mediaSession.setActionHandler("previoustrack", () =>
				this.prevTrack(),
			);
			navigator.mediaSession.setActionHandler("nexttrack", () =>
				this.nextTrack(),
			);
		}
	}

	#updateMediaSessionMetadata(track) {
		if ("mediaSession" in navigator && track) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title || "Unknown Title",
				artist: track.artist || "Unknown Artist",
				artwork: track.coverUrl
					? [
							{
								src: track.coverUrl,
								sizes: "96x96",
								type: "image/jpeg",
							},
							{
								src: track.coverUrl,
								sizes: "128x128",
								type: "image/jpeg",
							},
							{
								src: track.coverUrl,
								sizes: "192x192",
								type: "image/jpeg",
							},
							{
								src: track.coverUrl,
								sizes: "256x256",
								type: "image/jpeg",
							},
							{
								src: track.coverUrl,
								sizes: "384x384",
								type: "image/jpeg",
							},
							{
								src: track.coverUrl,
								sizes: "512x512",
								type: "image/jpeg",
							},
						]
					: [],
			});
		}
	}

	// =========================
	// GETTERS / SETTERS
	// =========================
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

	// =========================
	// AUTH & SYNC
	// =========================
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

	// =========================
	// QUEUE & LOAD
	// =========================
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

	// =========================
	// PREPARE & STREAM
	// =========================
	async #prefetchNext() {
		const next = this.#queue[this.#queueIndex + 1];
		if (!next || this.#prefetchCache.has(next.uuid)) return;

		try {
			const res = await trackService.streamTrack(next.uuid);
			this.#prefetchCache.set(next.uuid, res.data.streamUrl);
		} catch {}
	}

	async prepare(track, isRetry = false) {
		if (!track?.uuid) return;

		const session = ++this.#sessionId;

		this.#isLoading = true;
		this.emit("track_loading", true);

		if (this.#audio.src) this.#audio.pause();

		this.#currentTrack = track;
		this.emit("track_changed", track);
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

			await new Promise((resolve, reject) => {
				const onReady = () => {
					cleanup();
					resolve();
				};
				const onErr = () => {
					cleanup();
					reject(this.#audio.error);
				};

				const cleanup = () => {
					this.#audio.removeEventListener("canplay", onReady);
					this.#audio.removeEventListener("error", onErr);
				};

				this.#audio.addEventListener("canplay", onReady, { once: true });
				this.#audio.addEventListener("error", onErr, { once: true });
			});

			if (session !== this.#sessionId) return;

			await this.play();
			this.emit("player_status_changed", true);

			this.#prefetchNext();
		} catch (err) {
			const isExpiredStream = err && (err.code === 2 || err.code === 4);

			if (!isRetry && (isExpiredStream || !err)) {
				this.#prefetchCache.delete(track.uuid);
				return this.prepare(track, true);
			}

			console.error("[PlayerStore] prepare failed permanently:", err);

			this.#isLoading = false;
			this.emit("track_loading", false);

			if (session === this.#sessionId && this.#queue.length > 1) {
				this.nextTrack();
			}
		}
	}

	// =========================
	// PLAYBACK
	// =========================
	async play() {
		this.ensureAudioContext();
		if (!this.#audio.src) return;

		try {
			const p = this.#audio.play();
			if (p) await p;
		} catch (err) {
			console.warn("Play interrupted:", err);
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

	// =========================
	// NEXT / PREV
	// =========================
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

	// =========================
	// UI COMPATIBILITY LAYER
	// =========================
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

	// =========================
	// SMART FEATURES
	// =========================
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

	// =========================
	// CLEAR
	// =========================
	clear() {
		this.pause();
		this.#audio.src = "";
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
