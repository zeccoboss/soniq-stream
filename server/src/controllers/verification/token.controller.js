const crypto = require("node:crypto");
const UserModel = require("../../models/user.model");
const { resendVerificationMail } = require("../../helpers/mailer.helper");
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
const appConfig = require("../../config/app.config");
const { maskEmail } = require("../../helpers/mask-email.helper");

const handleVerifyEmail = async (req, res) => {
	try {
		const { token } = req.params;

		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		const user = await UserModel.findOne({
			verificationToken: hashedToken,
			verificationTokenExpiry: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired token" });
		}

		// ── Mark as verified ───────────────────────────────────────────────────
		user.verified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiry = undefined;

		// Create default settings for the new user
		const newSettings = await SettingsModel.create({ user: user._id });
		user.settings = newSettings._id;

		// ── Create default images ──────────────────────────────────────────────
		const avatarKey = appConfig.local.userAvatarKey;
		const bannerKey = appConfig.local.bannerKey;

		const [avatarDimensions, bannerDimensions] = await Promise.all([
			getLocalImageDimensions(avatarKey),
			getLocalImageDimensions(bannerKey),
		]);

		if (avatarDimensions && bannerDimensions) {
			const [avatar, banner] = await Promise.all([
				avaterImageHandler({
					user: user._id,
					format: `image/${getImageExtension(avatarKey)}`,
					size: getLocalMediaSize(avatarKey),
					dimensions: avatarDimensions,
					storage: {
						key: avatarKey,
						baseUrl: appConfig.base,
						type: "local",
					},
				}),
				bannerImageHandler({
					user: user._id,
					format: `image/${getImageExtension(bannerKey)}`,
					size: getLocalMediaSize(bannerKey),
					dimensions: bannerDimensions,
					storage: {
						key: bannerKey,
						baseUrl: appConfig.base,
						type: "local",
					},
				}),
			]);

			user.avatar = avatar._id;
			user.cover = banner._id;
		} else {
			// Don't block verification if image creation fails
			console.error(
				"[VerifyEmail] Could not load default image dimensions — skipping image creation",
			);
		}

		await user.save();

		return res
			.status(200)
			.json({ success: true, message: "Email verified successfully" });
	} catch (err) {
		console.error("[VerifyEmail]:", err);
		return res
			.status(500)
			.json({ success: false, message: "Verification failed" });
	}
};

const handleResendEmailVerification = async (req, res) => {
	const user = await UserModel.findOne({ email: req.body.email });

	if (!user) return res.status(404).json({ error: "User not found" });
	if (user?.verified)
		return res.status(400).json({ error: "User already verified" });

	const cooldown = 60 * 1000; // 1 minutes between resend
	const timeLastSent = Date.now() - user.lastUserVerificationSentAt;

	if (timeLastSent < cooldown)
		return res.status(429).json({
			error: "Please wait before requesting another email",
		});

	// Generate a fresh token
	const token = crypto.randomBytes(32).toString("hex");
	const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

	user.verificationToken = hashedToken;
	user.verificationTokenExpiry = Date.now() + 3600000;
	user.lastUserVerificationSentAt = Date.now();

	await user.save();

	// Send the email with the raw token (not hashed)
	try {
		await resendVerificationMail(user.email, token);
	} catch (err) {
		console.error("[ResendVerification] Email send failed:", err);
		return res.status(500).json({
			success: false,
			message: "Failed to send verification email",
		});
	}

	const maskedEmail = maskEmail(user.email);

	res.status(200).json({
		success: true,
		message: `Verification email resent successfully to ${maskedEmail}. Please check your inbox.`,
		email: maskedEmail,
	});
};

module.exports = { handleVerifyEmail, handleResendEmailVerification };
