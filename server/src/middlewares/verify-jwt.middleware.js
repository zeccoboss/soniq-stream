const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const UserModel = require("../models/user.model");

const verifyToken = promisify(jwt.verify);

const verifyJWT = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({
			code: "UNAUTHENTICATED",
			message: "Access token is missing or invalid format.",
		});
	}

	const token = authHeader.split(" ")[1];

	let decoded;
	try {
		decoded = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return res.status(401).json({
				code: "TOKEN_EXPIRED",
				message: "Access token has expired.",
			});
		}
		return res.status(403).json({
			code: "INVALID_TOKEN",
			message: "Forbidden: Invalid token.",
		});
	}

	try {
		// Using _id to match what was signed in handleLogin
		const user = await UserModel.findById(decoded.UserInfo._id).select(
			"isActive",
		);

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		if (!user.isActive) {
			return res.status(403).json({ message: "Account suspended." });
		}

		// Attach data to request for downstream middlewares
		req.user = decoded.UserInfo;
		req.roles = decoded.UserInfo.roles;

		next();
	} catch (dbError) {
		console.error("[VerifyJWT DB Error]:", dbError);
		return res.status(500).json({ message: "Internal server error." });
	}
};

module.exports = verifyJWT;
