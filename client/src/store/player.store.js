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

	#audioCtx = null;
	#sourceNode = null;
	#gainNode = null;
	#analyserNode = null;
	#trackBuffer = null;
	#prevTrackBuffer = null;
	#prevTrackUuid = null;
	#startedAt = 0;
	#pausedAt = 0;
	#isPlaying = false;
	#isLoading = false;

	#dbSyncIntervalId = null;
	#SYNC_HEARTBEAT_MS = 30000;

	// Sleep Timer State
	#sleepTimeoutId = null;
	#sleepIntervalId = null;
	#sleepTimeRemaining = 0; // in milliseconds

	constructor() {
		super();
		window.addEventListener("beforeunload", () => this.#handleUnload());

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.#syncPlayState();
			}
		});
	}

	// --- Getters ---
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
	get sleepTimeRemaining() {
		return this.#sleepTimeRemaining;
	}

	get progress() {
		if (!this.#audioCtx || !this.#isPlaying) return this.#pausedAt;
		return this.#audioCtx.currentTime - this.#startedAt + this.#pausedAt;
	}

	get duration() {
		return this.#trackBuffer?.duration ?? 0;
	}

	set volume(value) {
		if (typeof value !== "number") return;
		this.#volume = Math.min(1, Math.max(0, value));
		if (this.#gainNode && this.#audioCtx) {
			this.#gainNode.gain.setValueAtTime(
				this.#volume,
				this.#audioCtx.currentTime,
			);
		}
		this.emit("volume_changed", this.#volume);
	}

	/**
	 * Helper parsing local cache tokens safely to prevent dependency loops.
	 */
	#isAuthenticated() {
		const token = this.storageGet("token");
		if (!token) return false;
		return !!token;
	}

	async #syncPlayState() {
		const currentProgressMs = Math.round(this.progress * 1000);
		this.#playState = {
			trackUuid: this.#currentTrack ? this.#currentTrack.uuid : null,
			progressMs: this.#currentTrack ? currentProgressMs : 0,
			isPlaying: this.#isPlaying,
		};

		// Always update local cache state configuration
		this.storageSet("play_state", this.#playState);

		// Synchronize upstream only if verification token is valid
		if (!this.#isAuthenticated()) return;

		try {
			await trackService.syncPlayerStateWithDatabase(this.#playState);
		} catch (err) {
			console.warn(
				"[PlayerStore] Background DB sync suspended:",
				err.message,
			);
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

	// --- Queue Operations ---
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

	/**
	 * Appends an array of tracks or single track context object onto the tail edge of the queue array stack frame list structures.
	 */
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

	/**
	 * Places specified selection directly into the immediate next array stack index slot sequence.
	 */
	playNext(track) {
		if (!track?.uuid) return;

		// Clean duplicates safely across existing reference pools
		this.#originalQueue = this.#originalQueue.filter(
			(t) => t.uuid !== track.uuid,
		);
		this.#queue = this.#queue.filter((t) => t.uuid !== track.uuid);

		// Re-align our index markers to historical baseline tracks if current frame moved
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

	// --- Audio Transport Control Layer Core Actions ---
	play() {
		if (!this.#trackBuffer || this.#isPlaying) return;
		this.ensureAudioContext();

		this.#sourceNode = this.#audioCtx.createBufferSource();
		this.#sourceNode.buffer = this.#trackBuffer;
		this.#sourceNode.connect(this.#analyserNode);
		this.#sourceNode.loop = this.#repeatMode === "one";

		const offset = Math.min(this.#pausedAt, this.#trackBuffer.duration);
		this.#sourceNode.start(0, offset);
		this.#startedAt = this.#audioCtx.currentTime;
		this.#isPlaying = true;

		this.#sourceNode.onended = () => {
			if (this.#isPlaying) this.nextTrack();
		};

		this.emit("play_state_changed", { isPlaying: true });
		this.#syncPlayState();

		if (this.#dbSyncIntervalId) clearInterval(this.#dbSyncIntervalId);
		this.#dbSyncIntervalId = setInterval(
			() => this.#syncPlayState(),
			this.#SYNC_HEARTBEAT_MS,
		);
	}

	pause() {
		if (!this.#isPlaying) return;
		this.#pausedAt += this.#audioCtx.currentTime - this.#startedAt;
		this.#isPlaying = false;

		if (this.#dbSyncIntervalId) {
			clearInterval(this.#dbSyncIntervalId);
			this.#dbSyncIntervalId = null;
		}

		if (this.#sourceNode) {
			this.#sourceNode.onended = null;
			this.#sourceNode.stop();
			this.#sourceNode.disconnect();
			this.#sourceNode = null;
		}
		this.emit("play_state_changed", { isPlaying: false });
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
			this.#pausedAt = 0;
			this.rotateAudioCache();
			this.#syncPlayState();
			return;
		}
		this.#queueIndex = nextIndex;
		await this.prepare(this.#queue[nextIndex]);
	}

	async prevTrack() {
		if (!this.#queue.length) return;
		if (this.progress > 3) {
			this.#pausedAt = 0;
			if (this.#isPlaying) {
				this.pause();
				this.play();
			}
			this.#syncPlayState();
			return;
		}
		const prevIndex = this.#queueIndex > 0 ? this.#queueIndex - 1 : 0;
		this.#queueIndex = prevIndex;
		await this.prepare(this.#queue[prevIndex]);
	}

	seekTo(seconds) {
		if (!this.#trackBuffer) return;
		const wasPlaying = this.#isPlaying;
		this.pause();
		this.#pausedAt = Math.min(
			Math.max(0, seconds),
			this.#trackBuffer.duration,
		);
		if (wasPlaying) this.play();
		this.emit("seeked", this.#pausedAt);
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
		if (this.#sourceNode) this.#sourceNode.loop = this.#repeatMode === "one";
		this.emit("repeat_changed", this.#repeatMode);
	}

	// --- Sleep Timer Utility Functions ---
	/**
	 * Sets up custom automated tracking teardown threads using standard time formats.
	 * @param {number} value The raw length configuration value.
	 * @param {"minutes" | "seconds" | "milliseconds"} dynamicUnit Type definition framework map selection.
	 */
	setSleepTimer(value, dynamicUnit = "minutes") {
		this.clearSleepTimer();

		if (typeof value !== "number" || value <= 0) return;

		let ms = value;
		if (dynamicUnit === "minutes") ms = value * 60 * 1000;
		if (dynamicUnit === "seconds") ms = value * 1000;

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

	// --- Social System Interaction Share Route ---
	async shareCurrentTrack(platform = "generic") {
		if (!this.#currentTrack?.uuid)
			throw new Error("No active audio asset track context found to map.");
		return await trackService.shareTrack(this.#currentTrack.uuid, platform);
	}

	// --- Audio Context Infrastructure Core State Engines ---
	ensureAudioContext() {
		if (!this.#audioCtx) {
			this.#audioCtx = new (
				window.AudioContext || window.webkitAudioContext
			)();
			this.#analyserNode = this.#audioCtx.createAnalyser();
			this.#gainNode = this.#audioCtx.createGain();
			this.#analyserNode.connect(this.#gainNode);
			this.#gainNode.connect(this.#audioCtx.destination);
			this.#gainNode.gain.value = this.#volume;
		}
		if (this.#audioCtx.state === "suspended") this.#audioCtx.resume();
	}

	rotateAudioCache() {
		if (this.#sourceNode) {
			this.#sourceNode.onended = null;
			this.#sourceNode.disconnect();
			this.#sourceNode = null;
		}
		if (this.#trackBuffer && this.#currentTrack) {
			this.#prevTrackBuffer = this.#trackBuffer;
			this.#prevTrackUuid = this.#currentTrack.uuid;
		}
		this.#trackBuffer = null;
	}

	async prepare(track) {
		this.#isLoading = true;
		this.emit("track_loading", true);
		this.ensureAudioContext();
		this.pause();

		this.rotateAudioCache();
		this.#pausedAt = 0;
		this.#currentTrack = track;
		this.emit("track_changed", this.#currentTrack);
		this.#syncPlayState();

		this.emit("player_status_changed", true);

		try {
			const res = await trackService.streamTrack(track.uuid);
			const arrayBuffer = await trackService.getAudioBuffer(
				res.data.streamUrl,
			);
			this.#trackBuffer = await this.#audioCtx.decodeAudioData(arrayBuffer);

			this.#isLoading = false;
			this.emit("track_loading", false);
			this.play();
		} catch (error) {
			this.#isLoading = false;
			this.emit("track_loading", false);
			if (this.#queue.length > 1) {
				console.warn("Stream failed, skipping to next track...");
				this.nextTrack();
			}
		}
	}

	clear() {
		this.pause();
		this.clearSleepTimer();
		this.rotateAudioCache();
		this.#trackBuffer = null;
		this.#prevTrackBuffer = null;
		this.#prevTrackUuid = null;
		this.#currentTrack = null;
		this.#originalQueue = [];
		this.#queue = [];
		this.#queueIndex = 0;
		this.#pausedAt = 0;
		this.#startedAt = 0;
		this.emit("track_changed", null);
		this.#syncPlayState();
		this.emit("player_status_changed", false);
	}

	init() {
		const savedState = this.storageGet("play_state");
		if (savedState) {
			this.#playState = savedState;
			this.#pausedAt = (savedState.progressMs || 0) / 1000;
			this.#isPlaying = false;

			if (savedState.currentTrack) {
				this.#currentTrack = savedState.currentTrack;
				this.emit("track_changed", this.#currentTrack);
			}
		}
	}
}

export { PlayerStore };
