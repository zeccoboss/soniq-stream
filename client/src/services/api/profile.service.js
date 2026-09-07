import { BaseService } from "./base.service.js";
import { ENDPOINTS } from "./endpoints.js";

class ProfileService extends BaseService {
	/**
	 * @param {string} identifier - uuid or username
	 */
	getProfile(identifier, { signal } = {}) {
		return this.get(ENDPOINTS.USER.PUBLIC_PROFILE(identifier), { signal });
	}
}

export const profileService = new ProfileService();
