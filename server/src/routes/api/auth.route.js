const router = require("express").Router();
const refreshTokenController = require("../../controllers/auth/refresh.controller");

// Controllers
const authController = require("../../controllers/auth/auth.controller");
const {
	handleVerifyEmail,
	handleResendEmailVerification,
} = require("../../controllers/verification/token.controller");
const {
	handleForgotPassword,
	handleResetPassword,
} = require("../../controllers/verification/password.controller");

// Middlewares
const { validate } = require("../../middlewares/validate.middleware");
const {
	loginLimiter,
	registerLimiter,
	forgotPasswordLimiter,
} = require("../../middlewares/rate-limit.middleware");

// Validators
const {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} = require("../../validators/auth.validator");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");

// ================= AUTH ROUTES =================

// Register
router.post(
	"/register",
	registerLimiter,
	validate(registerSchema),
	authController.handleRegister,
);

// Refresh token
router.get("/refresh", refreshTokenController.handleRefreshToken);

// Login
router.post(
	"/login",
	loginLimiter,
	validate(loginSchema),
	authController.handleLogin,
);

// Logout
router.post("/logout", verifyJWT, authController.handleLogout);

// ================= PASSWORD =================

// Forgot password (send reset link)
router.post(
	"/forgot-password",
	forgotPasswordLimiter,
	validate(forgotPasswordSchema),
	handleForgotPassword,
);

// Reset password (with token)
router.post(
	"/reset-password",
	loginLimiter,
	validate(resetPasswordSchema),
	handleResetPassword,
);

// ================= EMAIL VERIFICATION =================

// Verify email
router.get("/verify/register/:token", handleVerifyEmail);
router.get("/verify/reset:token", handleVerifyEmail);

// Resend verification email
router.post(
	"/resend-verification",
	forgotPasswordLimiter,
	handleResendEmailVerification,
);

module.exports = router;
