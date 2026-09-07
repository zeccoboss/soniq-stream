import { BaseService } from "./base.service.js";
import { ENDPOINTS } from "./endpoints.js";

class SocialService extends BaseService {
	follow(uuid) {
		return this.post(ENDPOINTS.SOCIAL.FOLLOW(uuid));
	}

	unfollow(uuid) {
		return this.delete(ENDPOINTS.SOCIAL.FOLLOW(uuid));
	}
}

export const socialService = new SocialService();
