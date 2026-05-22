import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class AuthService extends BaseService {
	// User login
	login(credentials) {
		return this.post(ENDPOINTS.AUTH.LOGIN, credentials);
	}

	// User logout
	logout() {
		return this.post(ENDPOINTS.AUTH.LOGOUT);
	}

	// User register
	register(userData) {
		return this.post(ENDPOINTS.AUTH.REGISTER, userData);
	}

	// Reset password
	resetPassword({ token, password }) {
		return this.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
	}

	// Forgot password
	forgotPassword({ email }) {
		return this.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
	}

	// Resend email
	resendVerification(email) {
		return this.post(ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
	}

	// Refresh token
	refresh() {
		return this.get(ENDPOINTS.AUTH.REFRESH);
	}

	// Verify reset token
	verifyResetToken({ token, signal = null }) {
		return this.get(ENDPOINTS.AUTH.VERIFY_RESET(token), { signal });
	}

	// Verify register token
	verifyRegisterToken({ token, signal = null }) {
		return this.get(ENDPOINTS.AUTH.VERIFY_REGISTER(token), { signal });
	}
}

export const authService = new AuthService();
