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

	constructor() {
		super();
		window.addEventListener("beforeunload", () => this.#handleUnload());

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "visible") {
				this.#syncPlayState();
			}
		});
	}

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

	get progress() {
		if (!this.#audioCtx || !this.#isPlaying) return this.#pausedAt;
		return this.#audioCtx.currentTime - this.#startedAt + this.#pausedAt;
	}

	get duration() {
		return this.#trackBuffer?.duration ?? 0;
	}

	get queueIndex() {
		return this.#queueIndex;
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

	async #syncPlayState() {
		const currentProgressMs = Math.round(this.progress * 1000);
		this.#playState = {
			trackUuid: this.#currentTrack ? this.#currentTrack.uuid : null,
			progressMs: this.#currentTrack ? currentProgressMs : 0,
			isPlaying: this.#isPlaying,
		};

		this.storageSet("play_state", this.#playState);

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
		const blob = new Blob([JSON.stringify(state)], {
			type: "application/json",
		});
		navigator.sendBeacon("/api/v1/me/player", blob);
	}

	async loadTrack(track) {
		if (!track?.uuid) return;
		this.#originalQueue = [track];
		this.#queue = [track];
		this.#queueIndex = 0;
		await this.prepare(track);
	}

	async loadQueue(tracks = [], startIndex = 0) {
		if (!tracks.length) return;
		this.#originalQueue = tracks;
		this.#queue = [...tracks];
		this.#queueIndex = startIndex;
		await this.prepare(tracks[startIndex]);
	}

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
			// Add this logic:
			if (this.#queue.length > 1) {
				console.warn("Stream failed, skipping to next track...");
				this.nextTrack();
			}
		}
	}

	clear() {
		this.pause();
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
	}

	// Inside your PlayerStore.js
	init() {
		const savedState = this.storageGet("play_state");
		if (savedState) {
			this.#playState = savedState;
			this.#pausedAt = (savedState.progressMs || 0) / 1000;
			this.#isPlaying = false;

			if (savedState.currentTrack) {
				this.#currentTrack = savedState.currentTrack;
				// Trigger an update so listeners (like FooterDesktop) know data is ready
				this.emit("track_changed", this.#currentTrack);
			}
		}
	}
}

export { PlayerStore };
