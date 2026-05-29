import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class TrackService extends BaseService {
	// ── Feed Methods ──────────────────────────────────────────
	getDiscoverFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.DISCOVER, { params, signal });
	}

	getExploreFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.EXPLORE, { params, signal });
	}

	getForYouFeed(params, signal) {
		return this.get(ENDPOINTS.FEEDS.FOR_YOU, { params, signal });
	}

	// ── Track Resource Methods ────────────────────────────────
	getTrending(params, signal) {
		return this.get(ENDPOINTS.TRACKS.TRENDING, { params, signal });
	}

	getNewUploads(params, signal) {
		return this.get(ENDPOINTS.TRACKS.NEW_UPLOADS, { params, signal });
	}

	getTopTracks(params, signal) {
		return this.get(ENDPOINTS.TRACKS.TOP_TRACKS, { params, signal });
	}

	getPopular(params, signal) {
		return this.get(ENDPOINTS.TRACKS.POPULAR, { params, signal });
	}

	searchTracks(params, signal) {
		return this.get(ENDPOINTS.TRACKS.SEARCH, { params, signal });
	}

	uploadTrack(formData, options = {}) {
		return this.post(ENDPOINTS.TRACKS.UPLOAD, formData, options);
	}

	getTrackByUuid(uuid) {
		return this.get(ENDPOINTS.TRACKS.BY_uuid(uuid));
	}

	likeTrack(uuid) {
		return this.post(ENDPOINTS.TRACKS.LIKE(uuid));
	}

	getMetadata(uuid) {
		return this.get(ENDPOINTS.TRACKS.METADATA(uuid));
	}

	postComment(uuid, commentData) {
		return this.post(ENDPOINTS.TRACKS.COMMENT(uuid), commentData);
	}

	shareTrack(uuid, shareData) {
		return this.post(ENDPOINTS.TRACKS.SHARE(uuid), shareData);
	}

	// ── Streaming ────────────────────────────────────────────
	streamTrack(uuid) {
		return this.get(ENDPOINTS.TRACKS.STREAM(uuid));
	}

	async syncPlayerStateWithDatabase(payload) {
		return await this.patch(ENDPOINTS.TRACKS.PLAY_STATE, payload);
	}
}

export const trackService = new TrackService();
