import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class MeService extends BaseService {
	getProfile(signal = null) {
		return this.get(ENDPOINTS.ME.BASE);
	}
}

const meService = new MeService();
export default meService;
