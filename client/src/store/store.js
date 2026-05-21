import {
	readFromLocalStorage,
	removeFromLocalStorage,
	writeToLocalStorage,
} from "@zecco/services/storage/local-storage";

class AppStore {
	// ── Auth ──────────────────────────────────────────────────────────
	#user = null;
	#token = null;

	// ── Player State ──────────────────────────────────────────────────
	#currentTrack = null; // { id, title, artist, coverUrl, streamUrl, duration }
	#originalQueue = []; // Untouched order
	#queue = []; // Active queue (shuffled or sequential)
	#queueIndex = 0;
	#isShuffle = false;
	#repeatMode = "none"; // "none" | "one" | "all"
	#volume = 1; // 0.0 – 1.0

	// ── Audio Engine Nodes & Buffers ──────────────────────────────────
	#audioCtx = null;
	#sourceNode = null; // Recreated on every play/resume iteration
	#gainNode = null; // Controls volume mapping
	#analyserNode = null; // Groundwork hook for future visualizer canvas
	#trackBuffer = null; // RAW Decoded PCM track data in memory
	#prevTrackBuffer = null; // 1-track lookback cache for instant replay
	#prevTrackId = null; // Maps the cached buffer to a track ID
	#startedAt = 0; // AudioContext.currentTime marker when source started
	#pausedAt = 0; // Temporal offset into the track when paused
	#isPlaying = false;

	// ── UI State ──────────────────────────────────────────────────────
	#activePage = "home"; // "home" | "search" | "library" | "upload" | "settings" | "profile" | "auth/login" | "auth/register" | etc.
	#overlayOpen = false;
	#isLoading = false;
	#deepLinkTrackId = null;

	// ═════════════════════════════════════════════════════════════════
	// AUTHENTICATION
	// ═════════════════════════════════════════════════════════════════

	get user() {
		return this.#user;
	}

	set user(data) {
		if (!data || typeof data !== "object") {
			console.error("[Store]: Invalid user data.");
			return;
		}
		this.#user = {
			id: data.id ?? null,
			username: data.username ?? null,
			email: data.email ?? null,
			avatar: data.avatar ?? null,
			isVerified: data.isVerified ?? false,
			isAdmin: data.isAdmin ?? false,
			...data,
		};

		// Persisting only essential user info in localStorage for session restoration; sensitive data should be avoided
		writeToLocalStorage("user", this.#user);
	}

	updateUser(fields) {
		if (!this.#user) {
			console.error("[Store]: No user to update.");
			return;
		}
		this.#user = { ...this.#user, ...fields };
	}

	get token() {
		return this.#token;
	}

	set token(value) {
		if (!value || typeof value !== "string") {
			console.error("[Store]: Invalid token.");
			removeFromLocalStorage("token");
			return;
		}
		this.#token = value;
		writeToLocalStorage("token", value);
	}

	get isLoggedIn() {
		return !!this.#token;
	}

	setAuth(user, token) {
		this.user = user;
		this.token = token;
	}

	get isAuthenticated() {
		return !!this.#token || !!readFromLocalStorage("token");
	}

	// ═════════════════════════════════════════════════════════════════
	// PLAYER GETTERS & SETTERS
	// ═════════════════════════════════════════════════════════════════

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

	set volume(value) {
		if (typeof value !== "number") {
			console.error("[Store]: Volume must be a number.");
			return;
		}
		this.#volume = Math.min(1, Math.max(0, value));
		if (this.#gainNode && this.#audioCtx) {
			// Using exponential/linear standard AudioParam ramp instead of direct mutation
			this.#gainNode.gain.setValueAtTime(
				this.#volume,
				this.#audioCtx.currentTime,
			);
		}
	}

	get analyserNode() {
		return this.#analyserNode;
	}

	get progress() {
		if (!this.#audioCtx || !this.#isPlaying) return this.#pausedAt;
		return this.#audioCtx.currentTime - this.#startedAt + this.#pausedAt;
	}

	// ═════════════════════════════════════════════════════════════════
	// PLAYER CONTROL FLOW
	// ═════════════════════════════════════════════════════════════════

	async loadTrack(track) {
		if (!track?.id) {
			console.error("[Store]: Invalid track object.");
			return;
		}
		this.#originalQueue = [track];
		this.#queue = [track];
		this.#queueIndex = 0;
		await this.#prepare(track);
	}

	async loadQueue(tracks = [], startIndex = 0) {
		if (!tracks.length) {
			console.error("[Store]: Cannot load an empty queue.");
			return;
		}
		this.#originalQueue = tracks;
		this.#queue = [...tracks];
		this.#queueIndex = startIndex;
		await this.#prepare(tracks[startIndex]);
	}

	async nextTrack() {
		if (!this.#queue.length) return;

		let nextIndex;
		if (this.#queueIndex < this.#queue.length - 1) {
			nextIndex = this.#queueIndex + 1;
		} else if (this.#repeatMode === "all") {
			nextIndex = 0;
		} else {
			// End of the queue reached natively, stop pipeline
			this.pause();
			this.#pausedAt = 0;
			this.#rotateAudioCache();
			return;
		}

		this.#queueIndex = nextIndex;
		await this.#prepare(this.#queue[nextIndex]);
	}

	async prevTrack() {
		if (!this.#queue.length) return;

		// If user is more than 3 seconds in, restart the track naturally
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
		await this.#prepare(this.#queue[prevIndex]);
	}

	play() {
		if (!this.#trackBuffer || this.#isPlaying) return;

		this.#ensureAudioContext();

		// Create a clean node instance (AudioBufferSourceNodes are strictly single-use)
		this.#sourceNode = this.#audioCtx.createBufferSource();
		this.#sourceNode.buffer = this.#trackBuffer;

		// Connect the node graph: Source -> Analyser -> Gain -> Output
		this.#sourceNode.connect(this.#analyserNode);
		this.#sourceNode.loop = this.#repeatMode === "one";

		// Safeguard against seeking out-of-bounds metrics
		const offset = Math.min(this.#pausedAt, this.#trackBuffer.duration);
		this.#sourceNode.start(0, offset);

		this.#startedAt = this.#audioCtx.currentTime;
		this.#isPlaying = true;

		// Attach modern event termination handler safely
		this.#sourceNode.onended = () => {
			if (this.#isPlaying) {
				this.nextTrack();
			}
		};
	}

	pause() {
		if (!this.#isPlaying) return;

		this.#pausedAt += this.#audioCtx.currentTime - this.#startedAt;
		this.#isPlaying = false;

		if (this.#sourceNode) {
			// CRITICAL: Sever link immediately before stopping node to bypass manual stop traps
			this.#sourceNode.onended = null;
			this.#sourceNode.stop();
			this.#sourceNode.disconnect();
			this.#sourceNode = null;
		}
	}

	togglePlay() {
		this.#isPlaying ? this.pause() : this.play();
	}

	toggleShuffle() {
		this.#isShuffle = !this.#isShuffle;

		// When toggling shuffle, we need to reconstruct the active queue while keeping the current track in place
		if (this.#isShuffle) {
			const rest = this.#originalQueue.filter(
				(t) => t.id !== this.#currentTrack.id,
			);

			// Fisher-Yates validation mapping
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
	}

	toggleRepeat() {
		const modes = ["none", "one", "all"];
		const next = (modes.indexOf(this.#repeatMode) + 1) % modes.length;
		this.#repeatMode = modes[next];

		if (this.#sourceNode) {
			this.#sourceNode.loop = this.#repeatMode === "one";
		}
	}

	seekTo(seconds) {
		if (!this.#trackBuffer) return;
		const wasPlaying = this.#isPlaying;

		this.pause();
		this.#pausedAt = Math.min(
			Math.max(0, seconds),
			this.#trackBuffer.duration,
		);

		if (wasPlaying) {
			this.play();
		}
	}

	clearPlayer() {
		this.pause();
		this.#rotateAudioCache();

		// Wipe all memory caches explicitly
		this.#trackBuffer = null;
		this.#prevTrackBuffer = null;
		this.#prevTrackId = null;

		this.#currentTrack = null;
		this.#originalQueue = [];
		this.#queue = [];
		this.#queueIndex = 0;
		this.#pausedAt = 0;
		this.#startedAt = 0;
	}

	// ═════════════════════════════════════════════════════════════════
	// PRIVATE ENGINE & RECYCLING ARCHITECTURE
	// ═════════════════════════════════════════════════════════════════

	#ensureAudioContext() {
		if (!this.#audioCtx) {
			this.#audioCtx = new (
				window.AudioContext || window.webkitAudioContext
			)();

			// Establish standard baseline structure
			this.#analyserNode = this.#audioCtx.createAnalyser();
			this.#gainNode = this.#audioCtx.createGain();

			this.#analyserNode.connect(this.#gainNode);
			this.#gainNode.connect(this.#audioCtx.destination);

			this.#gainNode.gain.value = this.#volume;
		}

		if (this.#audioCtx.state === "suspended") {
			this.#audioCtx.resume();
		}
	}

	/**
	 * Stops active playback and rotates the current track into the previous cache slot.
	 * The old cached track is naturally garbage-collected.
	 */
	#rotateAudioCache() {
		if (this.#sourceNode) {
			this.#sourceNode.onended = null;
			this.#sourceNode.disconnect();
			this.#sourceNode = null;
		}

		// Move current buffer to the previous cache slot
		if (this.#trackBuffer && this.#currentTrack) {
			this.#prevTrackBuffer = this.#trackBuffer;
			this.#prevTrackId = this.#currentTrack.id;
		}

		// Clear active slot ready for new download
		this.#trackBuffer = null;
	}

	async #prepare(track) {
		this.#isLoading = true;
		this.#ensureAudioContext();
		this.pause();

		// 1. INSTANT PLAY CACHE HIT: Is the requested track our cached previous track?
		if (track.id === this.#prevTrackId && this.#prevTrackBuffer) {
			console.log(
				"[Store]: Track found in memory cache. Playing instantly.",
			);

			// Swap the active and previous caches so the user can bounce back and forth seamlessly
			const tempBuffer = this.#trackBuffer;
			const tempId = this.#currentTrack?.id;

			this.#trackBuffer = this.#prevTrackBuffer;
			this.#currentTrack = track;

			// The song we just left becomes the new "previous"
			this.#prevTrackBuffer = tempBuffer;
			this.#prevTrackId = tempId || null;

			this.#pausedAt = 0;
			this.#isLoading = false;
			this.play();
			return; // Exit early, bypass network fetch completely!
		}

		// 2. CACHE MISS: Rotate the current track to history, then download the new one
		this.#rotateAudioCache();
		this.#pausedAt = 0;
		this.#currentTrack = track;

		try {
			// Fetch presigned stream configuration endpoint
			const res = await fetch(`/api/media/track/${track.id}/stream`, {
				headers: { Authorization: `Bearer ${this.#token}` },
			});
			const { data } = await res.json();

			// Extract the file as binary data
			const trackRes = await fetch(data.streamUrl);
			const arrayBuffer = await trackRes.arrayBuffer();

			// Decode the binary data into raw audio frames asynchronously
			this.#trackBuffer = await this.#audioCtx.decodeAudioData(arrayBuffer);

			this.#isLoading = false;

			// Fire playback immediately upon buffer completion
			this.play();
		} catch (error) {
			this.#isLoading = false;
			console.error("[Store Audio Engine Error]:", error);
		}
	}

	// ═════════════════════════════════════════════════════════════════
	// UI MANAGEMENT
	// ═════════════════════════════════════════════════════════════════

	get activePage() {
		return this.#activePage;
	}

	set activePage(page) {
		if (!page || typeof page !== "string") {
			console.error("[Store]: Invalid page name.");
			return;
		}
		this.#activePage = page;
	}

	get overlayOpen() {
		return this.#overlayOpen;
	}

	openOverlay() {
		this.#overlayOpen = true;
	}

	closeOverlay() {
		this.#overlayOpen = false;
	}

	get isLoading() {
		return this.#isLoading;
	}

	set isLoading(value) {
		this.#isLoading = value;
	}

	get deepLinkTrackId() {
		return this.#deepLinkTrackId;
	}

	captureDeepLink() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("track");
		if (id) this.#deepLinkTrackId = id;
		return id ?? null;
	}

	clearDeepLink() {
		this.#deepLinkTrackId = null;
	}

	// ═════════════════════════════════════════════════════════════════
	// TEARDOWN LIFECYCLES
	// ═════════════════════════════════════════════════════════════════

	clearAuth() {
		this.#user = null;
		this.#token = null;
		removeFromLocalStorage("token");
	}

	clearAll() {
		this.clearAuth();
		this.clearPlayer();
		this.#activePage = "home";
		this.#overlayOpen = false;
		this.#isLoading = false;
		this.#deepLinkTrackId = null;
	}

	init() {
		const token = readFromLocalStorage("token");
		if (token) this.#token = token;

		const trackId = this.captureDeepLink();
		if (trackId) {
			console.log(`[Store]: Deep link track detected → ${trackId}`);
		}
	}
}

export const store = new AppStore();
