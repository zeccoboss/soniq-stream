const jwt = require("jsonwebtoken");
const { v4: uuidV4 } = require("uuid");
const bcrypt = require("bcrypt");
const UserModel = require("../../models/user.model");
const { rolesList } = require("../../config/roles-list.config");
const { cookieOptions } = require("../../helpers/cookie-options.helper");
const {
	getGoogleAuthUrl,
	exchangeGoogleCode,
	getGoogleProfile,
	getGitHubAuthUrl,
	exchangeGitHubCode,
	getGitHubProfile,
} = require("../../services/oauth.service");
const appConfig = require("../../config/app.config");
const {
	avaterImageHandler,
	bannerImageHandler,
	getImageExtension,
} = require("../../helpers/handle-images.helpers");
const {
	getLocalMediaSize,
	getLocalImageDimensions,
} = require("../../helpers/media.helpers");
const SettingsModel = require("../../models/settings.model");

// ── Shared: issue tokens and redirect ─────────────────────────────────────────
const issueTokensAndRedirect = async (user, res) => {
	// Generate JWTs with consistent _id naming
	const accessToken = jwt.sign(
		{
			UserInfo: {
				_id: user._id,
				uuid: user.uuid,
				roles: user.roles,
			},
		},
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: "15m" },
	);

	const refreshToken = jwt.sign(
		{ _id: user._id },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: "7d" },
	);

	user.refreshToken = refreshToken;
	await user.save();

	res.cookie("jwt", refreshToken, cookieOptions);
	res.redirect(
		`${process.env.OAUTH_SUCCESS_REDIRECT}?accessToken=${accessToken}`,
	);
};

// ── Shared: create default images for new user ────────────────────────────────
const createDefaultImages = async (user) => {
	const avatarKey = appConfig.local.userAvatarKey;
	const bannerKey = appConfig.local.bannerKey;

	const [avatarDimensions, bannerDimensions] = await Promise.all([
		getLocalImageDimensions(avatarKey),
		getLocalImageDimensions(bannerKey),
	]);

	if (!avatarDimensions || !bannerDimensions) return;

	const [avatar, banner] = await Promise.all([
		avaterImageHandler({
			user: user._id,
			format: `image/${getImageExtension(avatarKey)}`,
			size: getLocalMediaSize(avatarKey),
			dimensions: avatarDimensions,
			storage: { key: avatarKey, baseUrl: appConfig.base, type: "local" },
		}),
		bannerImageHandler({
			user: user._id,
			format: `image/${getImageExtension(bannerKey)}`,
			size: getLocalMediaSize(bannerKey),
			dimensions: bannerDimensions,
			storage: { key: bannerKey, baseUrl: appConfig.base, type: "local" },
		}),
	]);

	user.avatar = avatar._id;
	user.cover = banner._id;
	await user.save();
};

// ── Shared: find or create user from OAuth profile ────────────────────────────
const findOrCreateUser = async ({ email, fullname, username, provider }) => {
	let user = await UserModel.findOne({ email });

	if (user) {
		// Existing user — add provider if not already tracked
		if (!user.authProviders?.includes(provider)) {
			user.authProviders = [...(user.authProviders ?? []), provider];
			await user.save();
		}
		return user;
	}

	// New OAuth user
	user = await UserModel.create({
		uuid: uuidV4(),
		email,
		fullname: fullname ?? null,
		username: `${username ?? email.split("@")[0]}_${uuidV4().slice(0, 6)}`,
		password: await bcrypt.hash(uuidV4(), 10), // unusable random password
		roles: [rolesList.User],
		verified: true,
		authProviders: [provider],
		avatar: null,
		cover: null,
	});

	// Create default settings for the new user
	const newSettings = await SettingsModel.create({ user: user._id });
	user.settings = newSettings._id;
	user.save();

	// Create default images — don't block if it fails
	try {
		await createDefaultImages(user);
	} catch (err) {
		console.error("[OAuth] Default image creation failed:", err);
	}

	return user;
};

// ── Google ─────────────────────────────────────────────────────────────────────
const googleRedirect = (_req, res) => res.redirect(getGoogleAuthUrl());

const googleCallback = async (req, res) => {
	const { code, error } = req.query;
	if (error || !code) return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);

	try {
		const tokens = await exchangeGoogleCode(code);
		const profile = await getGoogleProfile(tokens.access_token);

		if (!profile.email_verified) {
			return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
		}

		const user = await findOrCreateUser({
			email: profile.email,
			fullname: profile.name,
			username: profile.email.split("@")[0],
			provider: "google",
		});

		await issueTokensAndRedirect(user, res);
	} catch (err) {
		console.error("[OAuth] Google callback error:", err);
		res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
	}
};

// ── GitHub ─────────────────────────────────────────────────────────────────────
const gitHubRedirect = (_req, res) => res.redirect(getGitHubAuthUrl());

const gitHubCallback = async (req, res) => {
	const { code, error } = req.query;
	if (error || !code) return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);

	try {
		const tokens = await exchangeGitHubCode(code);
		const profile = await getGitHubProfile(tokens.access_token);

		if (!profile.email) {
			return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
		}

		const user = await findOrCreateUser({
			email: profile.email,
			fullname: profile.name,
			username: profile.login,
			provider: "github",
		});

		await issueTokensAndRedirect(user, res);
	} catch (err) {
		console.error("[OAuth] GitHub callback error:", err);
		res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
	}
};

module.exports = {
	googleRedirect,
	googleCallback,
	gitHubRedirect,
	gitHubCallback,
};
