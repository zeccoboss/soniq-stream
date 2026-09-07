import { BaseService } from "./base.service.js";
import { ENDPOINTS } from "./endpoints.js";

class PlaylistService extends BaseService {
	getMine({ signal } = {}) {
		return this.get(ENDPOINTS.PLAYLIST.BASE, { signal });
	}

	create({ name, visibility, description } = {}) {
		return this.post(ENDPOINTS.PLAYLIST.BASE, {
			name,
			visibility,
			description,
		});
	}
}

export const playlistService = new PlaylistService();
