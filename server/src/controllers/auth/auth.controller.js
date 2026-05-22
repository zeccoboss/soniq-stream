const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { v4: uuidV4 } = require("uuid");
const { rolesList } = require("../../config/roles-list.config");
const { sendVerificationMail } = require("../../helpers/mailer.helper");
const UserModel = require("../../models/user.model");
const {
	cookieOptions,
	clearCookieOptions,
} = require("../../helpers/cookie-options.helper");

const handleRegister = async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			username,
			email,
			password,
			dob,
			gender,
			country,
			genres,
			termsAccepted,
		} = req.body;

		const existingEmail = await UserModel.findOne({ email });
		if (existingEmail) {
			return res
				.status(409)
				.json({ success: false, message: "Email already exists" });
		}

		const oauthUser = await UserModel.findOne({
			email,
			authProviders: { $in: ["google", "github"] },
		});
		if (oauthUser) {
			return res.status(409).json({
				success: false,
				message:
					"This email is linked to OAuth. Please sign in with Google or GitHub.",
			});
		}

		const token = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		const user = await UserModel.create({
			uuid: uuidV4(),
			firstName,
			lastName,
			username,
			email,
			password: await bcrypt.hash(password, 10),
			roles: [rolesList.User],
			verified: false,
			authProviders: ["local"],
			dob,
			gender,
			country,
			genres,
			termsAccepted,
			verificationToken: hashedToken,
			verificationTokenExpiry: Date.now() + 3600000,
			lastUserVerificationSentAt: Date.now(),
		});

		await sendVerificationMail(user.email, token);

		return res.status(201).json({
			success: true,
			message: "Account created. Check your email to verify.",
			email: user.email,
		});
	} catch (err) {
		console.error("[Register]:", err);
		res.status(500).json({ success: false, message: "Registration failed" });
	}
};

const handleLogin = async (req, res) => {
	try {
		const { identifier, password } = req.body;

		const foundUser = await UserModel.findOne({
			$or: [{ email: identifier }, { username: identifier }],
		});

		// Check if user exists
		if (!foundUser) {
			return res
				.status(403)
				.json({ success: false, message: "No account found" });
		}

		// Check if user is banned
		if (foundUser.isActive === false) {
			return res.status(403).json({
				message: "This account has been suspended. Please contact support.",
			});
		}

		// If user only has OAuth providers — no usable password
		if (!foundUser.authProviders?.includes("local")) {
			return res.status(403).json({
				success: false,
				message: `This account uses ${foundUser.authProviders?.join(" or ")} to sign in.`,
			});
		}

		// Check if email is verified
		if (!foundUser.verified) {
			return res.status(403).json({
				success: false,
				message: "Email not verified. Check your inbox.",
			});
		}

		// Compare password
		const match = await bcrypt.compare(password, foundUser.password);
		if (!match) {
			return res
				.status(403)
				.json({ success: false, message: "Incorrect password" });
		}

		// Generate JWTs
		const accessToken = jwt.sign(
			{
				UserInfo: {
					_id: foundUser._id,
					uuid: foundUser.uuid,
					roles: foundUser.roles,
				},
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" },
		);

		const refreshToken = jwt.sign(
			{ _id: foundUser._id, uuid: foundUser.uuid },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "7d" },
		);

		foundUser.refreshToken = refreshToken;
		await foundUser.save();

		return res
			.status(200)
			.cookie("jwt", refreshToken, cookieOptions)
			.json({ success: true, accessToken });
	} catch (err) {
		console.error("[Login]:", err);
		res.status(500).json({ success: false, message: "Login failed" });
	}
};

const handleLogout = async (req, res) => {
	const refreshToken = req.cookies?.jwt;
	if (!refreshToken) return res.sendStatus(204);

	const user = await UserModel.findOne({ refreshToken });

	if (!user) {
		res.clearCookie("jwt", clearCookieOptions);
		return res.sendStatus(204);
	}

	user.refreshToken = null;
	await user.save();

	res.clearCookie("jwt", clearCookieOptions);
	return res
		.status(200)
		.json({ success: true, message: "Logged out successfully" });
};

module.exports = { handleLogin, handleRegister, handleLogout };
