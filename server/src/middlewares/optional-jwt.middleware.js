const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const verifyToken = promisify(jwt.verify);

const optionalJWT = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;

	// True guest — no token supplied at all. Never block.
	if (!authHeader?.startsWith("Bearer ")) {
		return next();
	}

	const token = authHeader.split(" ")[1];

	let decoded;
	try {
		decoded = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			// Not a guest — a real user with a stale token.
			// Mirror verifyJWT's contract so the axios interceptor triggers refresh + retry.
			return res.status(401).json({
				code: "TOKEN_EXPIRED",
				message: "Access token has expired.",
			});
		}

		// Malformed / bad signature / etc — nothing to refresh, degrade to guest.
		console.warn("[OptionalJWT] Verify failed:", err.name, "-", err.message);
		return next();
	}

	req.user = decoded.UserInfo;
	req.roles = decoded.UserInfo.roles;
	next();
};

module.exports = optionalJWT;
