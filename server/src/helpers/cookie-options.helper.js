const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
	httpOnly: true,
	path: "/",
	sameSite: isProd ? "none" : "strict",
	secure: isProd,
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Logout needs same attributes but maxAge: 0 to clear it
const clearCookieOptions = {
	httpOnly: true,
	path: "/",
	sameSite: isProd ? "none" : "strict",
	secure: isProd,
};

module.exports = { cookieOptions, clearCookieOptions };
