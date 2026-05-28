import axios from "axios";
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

	// ── Streaming & Buffer Handling ──────────────────────────
	streamTrack(uuid) {
		return this.get(ENDPOINTS.TRACKS.STREAM(uuid));
	}

	/**
	 * Fetches raw binary audio data from S3/MinIO.
	 * Uses raw axios to bypass BaseService auth headers.
	 */
	async getAudioBuffer(url) {
		try {
			const res = await axios.get(url, {
				withCredentials: true,
				responseType: "arraybuffer",
			});

			// CRITICAL CHECK: Does the buffer actually have content?
			if (!res.data || res.data.byteLength === 0) {
				throw new Error("Received empty audio buffer from server");
			}

			return res.data;
		} catch (error) {
			console.error("[TrackService] Buffer fetch failed:", error);
			throw error;
		}
	}
}

export const trackService = new TrackService();
