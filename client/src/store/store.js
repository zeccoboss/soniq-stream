import { BaseStore } from "./base.store";
import { AuthStore } from "./auth.store";
import { PlayerStore } from "./player.store";
import { UiStore } from "./ui.store";

class AppStore extends BaseStore {
	constructor() {
		super();
		// Initialize isolated sub-domain storage nodes
		this.auth = new AuthStore();
		this.player = new PlayerStore();
		this.ui = new UiStore();
	}

	/**
	 * Custom wrapper method inside orchestrator to cleanly wire cross-module values.
	 * This allows the player engine to fetch the authenticated token dynamically!
	 */
	async playTrackWithAuth(track) {
		const currentToken = this.auth.token;
		await this.player.prepare(track, currentToken);
	}

	clearAll() {
		this.auth.clear();
		this.player.clear();
		this.ui.clear();
		this.preferences.clear();
	}

	init() {
		this.auth.init();

		const trackId = this.ui.captureDeepLink();
		if (trackId) {
			console.log(`[Store]: Deep link track detected → ${trackId}`);
		}
	}
}

const store = new AppStore();
export { store };
