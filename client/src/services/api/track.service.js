import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class AudioService extends BaseService {
	// FEEDS (UI-level)
	getDiscoverFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.DISCOVER, { params, signal });
	}

	getExploreFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.EXPLORE, { params, signal });
	}

	getForYouFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.FOR_YOU, { params, signal });
	}

	// RAW RESOURCES (still needed sometimes)
	getTrackFeed(params, signal) {
		return this.get(ENDPOINTS.TRACKS.ALL, { params, signal });
	}

	getTrackById(id) {
		return this.get(ENDPOINTS.TRACKS.BY_ID(id));
	}

	likeTrack(id) {
		return this.post(ENDPOINTS.TRACKS.LIKE(id));
	}
}

export const trackService = new AudioService();
