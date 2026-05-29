import { trackService } from "@zecco/services/api/track.service";
import { BaseStore } from "./base.store";

class PlayerStore extends BaseStore {
	#currentTrack = null;
	#originalQueue = [];
	#queue = [];
	#queueIndex = 0;

	#isShuffle = false;
	#repeatMode = "none";
	#volume = 1;
	#playState = null;

	#audio = new Audio();

	#audioCtx = null;
	#sourceNode = null;
	#gainNode = null;
	#analyserNode = null;

	#isPlaying = false;
	#isLoading = false;

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

	constructor() {
		super();

		this.#setupAudio();

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

	// =========================
	// AUDIO CONTEXT
	// =========================
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
	// GETTERS / SETTERS (UNCHANGED CONTRACT)
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

		this.emit("volume_changed", this.#volume);
	}

	// =========================
	// AUTH
	// =========================
	#isAuthenticated() {
		return !!this.storageGet("token");
	}

	// =========================
	// SYNC (THROTTLED SAFE)
	// =========================
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

	// =========================
	// UNLOAD HANDLER
	// =========================
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
	// LOAD TRACK
	// =========================
	async loadTrack(track) {
		if (!track?.uuid) return;

		this.#originalQueue = [track];
		this.#queue = [track];
		this.#queueIndex = 0;

		await this.prepare(track);
	}

	// =========================
	// LOAD QUEUE (CONTRACT SAFE)
	// =========================
	async loadQueue(tracks = [], startIndex = 0) {
		if (!tracks.length) return;

		this.#originalQueue = [...tracks];
		this.#queue = [...tracks];
		this.#queueIndex = startIndex;

		await this.prepare(tracks[startIndex]);
	}

	// =========================
	// PREFETCH NEXT
	// =========================
	async #prefetchNext() {
		const next = this.#queue[this.#queueIndex + 1];
		if (!next) return;

		if (this.#prefetchCache.has(next.uuid)) return;

		try {
			const res = await trackService.streamTrack(next.uuid);
			this.#prefetchCache.set(next.uuid, res.data.streamUrl);
		} catch {}
	}

	// =========================
	// PREPARE (FULLY RACE SAFE)
	// =========================
	async prepare(track) {
		if (!track?.uuid) return;

		const session = ++this.#sessionId;

		this.#isLoading = true;
		this.emit("track_loading", true);

		// don’t aggressively interrupt audio mid-frame
		if (this.#audio.src) this.#audio.pause();

		this.#currentTrack = track;
		this.emit("track_changed", track);

		this.#syncPlayState();

		try {
			const res = await trackService.streamTrack(track.uuid);

			if (session !== this.#sessionId) return;

			const url = this.#prefetchCache.get(track.uuid) || res.data.streamUrl;

			this.#audio.src = url;
			this.#audio.load();

			await new Promise((resolve, reject) => {
				const onReady = () => {
					cleanup();
					resolve();
				};

				const onErr = (e) => {
					cleanup();
					reject(e);
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
			console.error("prepare failed:", err);

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

	// =========================
	// NEXT / PREV
	// =========================
	async nextTrack() {
		if (!this.#queue.length || this.#isLoading) return;

		let nextIndex;

		if (this.#queueIndex < this.#queue.length - 1) {
			nextIndex = this.#queueIndex + 1;
		} else if (this.#repeatMode === "all") {
			nextIndex = 0;
		} else {
			this.pause();
			this.seekTo(0);
			return;
		}

		this.#queueIndex = nextIndex;
		this.#sessionId++;

		await this.prepare(this.#queue[nextIndex]);
	}

	async prevTrack() {
		if (!this.#queue.length) return;

		if (this.progress > 3) return this.seekTo(0);

		const prev = Math.max(0, this.#queueIndex - 1);

		this.#queueIndex = prev;
		this.#sessionId++;

		await this.prepare(this.#queue[prev]);
	}

	seekTo(seconds) {
		if (!this.duration) return;

		this.#audio.currentTime = Math.min(Math.max(0, seconds), this.duration);
		this.emit("seeked", this.progress);

		this.#syncPlayState();
	}

	// =========================
	// UI COMPATIBILITY LAYER
	// (DO NOT REMOVE - used by UI modules)
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
