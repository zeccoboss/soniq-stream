import { BaseStore } from "./base.store";

class PlayerStore extends BaseStore {
	// Core Metadata
	#currentTrack = null;
	#originalQueue = [];
	#queue = [];
	#queueIndex = 0;
	#isShuffle = false;
	#repeatMode = "none"; // "none" | "one" | "all"
	#volume = 1;

	// Audio Context Graph Nodes
	#audioCtx = null;
	#sourceNode = null;
	#gainNode = null;
	#analyserNode = null;
	#trackBuffer = null;
	#prevTrackBuffer = null;
	#prevTrackId = null;
	#startedAt = 0;
	#pausedAt = 0;
	#isPlaying = false;
	#isLoading = false;

	// Getters
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

	get progress() {
		if (!this.#audioCtx || !this.#isPlaying) return this.#pausedAt;
		return this.#audioCtx.currentTime - this.#startedAt + this.#pausedAt;
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

	// Playback Core Systems
	async loadTrack(track) {
		if (!track?.id) return;
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
	}

	pause() {
		if (!this.#isPlaying) return;
		this.#pausedAt += this.#audioCtx.currentTime - this.#startedAt;
		this.#isPlaying = false;

		if (this.#sourceNode) {
			this.#sourceNode.onended = null;
			this.#sourceNode.stop();
			this.#sourceNode.disconnect();
			this.#sourceNode = null;
		}
		this.emit("play_state_changed", { isPlaying: false });
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
	}

	toggleShuffle() {
		this.#isShuffle = !this.#isShuffle;
		if (this.#isShuffle) {
			const rest = this.#originalQueue.filter(
				(t) => t.id !== this.#currentTrack.id,
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
				(t) => t.id === this.#currentTrack.id,
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
			this.#prevTrackId = this.#currentTrack.id;
		}
		this.#trackBuffer = null;
	}

	async prepare(track, token) {
		this.#isLoading = true;
		this.emit("track_loading", true);
		this.ensureAudioContext();
		this.pause();

		if (track.id === this.#prevTrackId && this.#prevTrackBuffer) {
			const tempBuffer = this.#trackBuffer;
			const tempId = this.#currentTrack?.id;
			this.#trackBuffer = this.#prevTrackBuffer;
			this.#currentTrack = track;
			this.#prevTrackBuffer = tempBuffer;
			this.#prevTrackId = tempId || null;
			this.#pausedAt = 0;
			this.#isLoading = false;
			this.emit("track_changed", this.#currentTrack);
			this.emit("track_loading", false);
			this.play();
			return;
		}

		this.rotateAudioCache();
		this.#pausedAt = 0;
		this.#currentTrack = track;
		this.emit("track_changed", this.#currentTrack);

		try {
			const res = await fetch(`/api/media/track/${track.id}/stream`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const { data } = await res.json();
			const trackRes = await fetch(data.streamUrl);
			const arrayBuffer = await trackRes.arrayBuffer();
			this.#trackBuffer = await this.#audioCtx.decodeAudioData(arrayBuffer);
			this.#isLoading = false;
			this.emit("track_loading", false);
			this.play();
		} catch (error) {
			this.#isLoading = false;
			this.emit("track_loading", false);
			this.emit("track_error", error);
			console.error("[PlayerStore Audio Engine Error]:", error);
		}
	}

	clear() {
		this.pause();
		this.rotateAudioCache();
		this.#trackBuffer = null;
		this.#prevTrackBuffer = null;
		this.#prevTrackId = null;
		this.#currentTrack = null;
		this.#originalQueue = [];
		this.#queue = [];
		this.#queueIndex = 0;
		this.#pausedAt = 0;
		this.#startedAt = 0;
		this.emit("track_changed", null);
	}
}
export { PlayerStore };
