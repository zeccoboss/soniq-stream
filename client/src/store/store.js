import { BaseStore } from "./base.store";
import { AuthStore } from "./auth.store";
import { PlayerStore } from "./player.store";
import { UiStore } from "./ui.store";

class AppStore extends BaseStore {
	constructor() {
		super();

		this.auth = new AuthStore();
		this.player = new PlayerStore();
		this.ui = new UiStore();

		// if you actually have it, otherwise remove this line entirely
		this.preferences = new BaseStore();
	}

	// -----------------------------
	// Player orchestration
	// -----------------------------

	async playTrack(track) {
		// no token passing needed
		await this.player.prepare(track);
		this.player.play();
	}

	// -----------------------------
	// Deep link handling
	// -----------------------------

	async initDeepLink() {
		const trackId = this.ui.captureDeepLink?.();

		if (!trackId) return;

		console.log(`[AppStore]: Deep link detected → ${trackId}`);

		try {
			// assuming you have a method somewhere to fetch track
			const track = await this.player.trackService?.getTrackByUuid(trackId);

			if (track) {
				await this.player.prepare(track);
			}
		} catch (err) {
			console.error("Deep link failed:", err);
		}
	}

	// -----------------------------
	// Lifecycle
	// -----------------------------

	clearAll() {
		this.auth.clear();
		this.player.clear();
		this.ui.clear();

		// safe guard
		this.preferences?.clear?.();
	}

	init() {
		this.auth.init();
		// this.player.init();
		this.initDeepLink();
	}
}

const store = new AppStore();
export { store };
