import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class AuthService extends BaseService {
	login(credentials) {
		return this.post(ENDPOINTS.AUTH.LOGIN, credentials);
	}
	logout() {
		return this.post(ENDPOINTS.AUTH.LOGOUT);
	}
	register(userData) {
		return this.post(ENDPOINTS.AUTH.REGISTER, userData);
	}
	resetPassword({ token, password }) {
		return this.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
	}
	forgotPassword({ email }) {
		return this.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
	}
	verifyToken(token) {
		return this.post(ENDPOINTS.AUTH.VERIFY_TOKEN, { token });
	}
	resendVerification(email) {
		return this.post("/auth/resend-verification", { email });
	}
}

export const authService = new AuthService();
