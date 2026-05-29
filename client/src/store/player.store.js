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
	// Setup
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
	// Getters
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
	// Auth Helper
	// =========================

	#isAuthenticated() {
		const token = this.storageGet("token");
		return !!token;
	}

	// =========================
	// Sync State
	// =========================

	async #syncPlayState() {
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
	// Queue
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

	addToQueue(tracks) {
		const incoming = Array.isArray(tracks) ? tracks : [tracks];

		const validTracks = incoming.filter((t) => t?.uuid);

		if (!validTracks.length) return;

		this.#originalQueue.push(...validTracks);
		this.#queue.push(...validTracks);

		this.emit("queue_changed", {
			queue: this.#queue,
			isShuffle: this.#isShuffle,
		});
	}

	playNext(track) {
		if (!track?.uuid) return;

		this.#originalQueue = this.#originalQueue.filter(
			(t) => t.uuid !== track.uuid,
		);

		this.#queue = this.#queue.filter((t) => t.uuid !== track.uuid);

		if (this.#currentTrack) {
			this.#queueIndex = this.#queue.findIndex(
				(t) => t.uuid === this.#currentTrack.uuid,
			);
		}

		const insertPosition = this.#queue.length ? this.#queueIndex + 1 : 0;

		this.#originalQueue.splice(insertPosition, 0, track);
		this.#queue.splice(insertPosition, 0, track);

		this.emit("queue_changed", {
			queue: this.#queue,
			isShuffle: this.#isShuffle,
		});
	}

	// =========================
	// Playback
	// =========================

	async play() {
		this.ensureAudioContext();

		try {
			await this.#audio.play();

			this.#syncPlayState();

			if (this.#dbSyncIntervalId) {
				clearInterval(this.#dbSyncIntervalId);
			}

			this.#dbSyncIntervalId = setInterval(
				() => this.#syncPlayState(),
				this.#SYNC_HEARTBEAT_MS,
			);
		} catch (err) {
			console.error("Playback failed:", err);
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

	async nextTrack() {
		if (!this.#queue.length) return;

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

		await this.prepare(this.#queue[nextIndex]);
	}

	async prevTrack() {
		if (!this.#queue.length) return;

		if (this.progress > 3) {
			this.seekTo(0);
			return;
		}

		const prevIndex = this.#queueIndex > 0 ? this.#queueIndex - 1 : 0;

		this.#queueIndex = prevIndex;

		await this.prepare(this.#queue[prevIndex]);
	}

	seekTo(seconds) {
		this.#audio.currentTime = Math.min(Math.max(0, seconds), this.duration);

		this.emit("seeked", this.progress);

		this.#syncPlayState();
	}

	toggleShuffle() {
		this.#isShuffle = !this.#isShuffle;

		if (this.#isShuffle) {
			const rest = this.#originalQueue.filter(
				(t) => t.uuid !== this.#currentTrack.uuid,
			);

			for (let i = rest.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));

				[rest[i], rest[j]] = [rest[j], rest[i]];
			}

			this.#queue = [this.#currentTrack, ...rest];
			this.#queueIndex = 0;
		} else {
			this.#queue = [...this.#originalQueue];

			this.#queueIndex = this.#originalQueue.findIndex(
				(t) => t.uuid === this.#currentTrack.uuid,
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
	// Prepare Track
	// =========================

	async prepare(track) {
		if (!track?.uuid) return;

		this.#isLoading = true;

		this.emit("track_loading", true);

		this.pause();

		this.#currentTrack = track;

		this.emit("track_changed", this.#currentTrack);

		this.#syncPlayState();

		try {
			const res = await trackService.streamTrack(track.uuid);

			this.#audio.src = res.data.streamUrl;

			this.#audio.load();

			await this.play();

			this.emit("player_status_changed", true);
		} catch (error) {
			console.error("Track prepare failed:", error);

			this.#isLoading = false;

			this.emit("track_loading", false);

			if (this.#queue.length > 1) {
				this.nextTrack();
			}
		}
	}

	// =========================
	// Sleep Timer
	// =========================

	setSleepTimer(value, dynamicUnit = "minutes") {
		this.clearSleepTimer();

		if (typeof value !== "number" || value <= 0) return;

		let ms = value;

		if (dynamicUnit === "minutes") ms *= 60 * 1000;

		if (dynamicUnit === "seconds") ms *= 1000;

		this.#sleepTimeRemaining = ms;

		this.emit("sleep_timer_started", this.#sleepTimeRemaining);

		this.#sleepIntervalId = setInterval(() => {
			this.#sleepTimeRemaining -= 1000;

			if (this.#sleepTimeRemaining <= 0) {
				this.#sleepTimeRemaining = 0;

				clearInterval(this.#sleepIntervalId);

				this.#sleepIntervalId = null;
			}

			this.emit("sleep_timer_tick", this.#sleepTimeRemaining);
		}, 1000);

		this.#sleepTimeoutId = setTimeout(() => {
			this.pause();

			this.clearSleepTimer();

			this.emit("sleep_timer_expired");
		}, ms);
	}

	clearSleepTimer() {
		if (this.#sleepTimeoutId) {
			clearTimeout(this.#sleepTimeoutId);
			this.#sleepTimeoutId = null;
		}

		if (this.#sleepIntervalId) {
			clearInterval(this.#sleepIntervalId);
			this.#sleepIntervalId = null;
		}

		this.#sleepTimeRemaining = 0;

		this.emit("sleep_timer_cleared");
	}

	// =========================
	// Share
	// =========================

	async shareCurrentTrack(platform = "generic") {
		if (!this.#currentTrack?.uuid) {
			throw new Error("No active track");
		}

		return await trackService.shareTrack(this.#currentTrack.uuid, platform);
	}

	// =========================
	// Clear
	// =========================

	clear() {
		this.pause();

		this.clearSleepTimer();

		this.#audio.src = "";

		this.#currentTrack = null;

		this.#originalQueue = [];
		this.#queue = [];
		this.#queueIndex = 0;

		this.emit("track_changed", null);

		this.#syncPlayState();

		this.emit("player_status_changed", false);
	}

	init() {
		const savedState = this.storageGet("play_state");

		if (!savedState) return;

		this.#playState = savedState;

		if (savedState.currentTrack) {
			this.#currentTrack = savedState.currentTrack;

			this.emit("track_changed", this.#currentTrack);
		}
	}
}

export { PlayerStore };
