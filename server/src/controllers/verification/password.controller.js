const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const UserModel = require("../../models/user.model");
const { sendPasswordResetMail } = require("../../helpers/mailer.helper");

const handleForgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await UserModel.findOne({ email });
		if (!user) return res.status(404).json({ error: "User not found" });
		if (!user.verified)
			return res.status(400).json({ error: "User not verified" });

		// ── Rate limit check ───────────────────────────────────────────────────
		if (user.lastPasswordVerificationSentAt) {
			const diff =
				Date.now() -
				new Date(user.lastPasswordVerificationSentAt).getTime();
			const tenMinutes = 10 * 60 * 1000;
			if (diff < tenMinutes) {
				const retryAfter = Math.ceil((tenMinutes - diff) / 60000);
				return res.status(429).json({
					success: false,
					message: `Please wait ${retryAfter} minute(s) before requesting another reset email`,
				});
			}
		}

		// ── Generate token ─────────────────────────────────────────────────────
		const token = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		user.passwordVerificationToken = hashedToken;
		user.passwordVerificationTokenExpiry = Date.now() + 5 * 60 * 1000;
		user.lastPasswordVerificationSentAt = Date.now();
		await user.save();

		// ── Send email ─────────────────────────────────────────────────────────
		try {
			sendPasswordResetMail(email, token);
		} catch (err) {
			console.error("[ForgotPassword] Email send failed:", err);
			return res
				.status(500)
				.json({ success: false, message: "Failed to send reset email" });
		}

		res.status(200).json({
			success: true,
			message: "Password reset email sent",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Password reset failed" });
	}
};

const handleResetPassword = async (req, res) => {
	try {
		const { token, password } = req.body;

		if (!password)
			return res.status(400).json({ error: "Password required" });

		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		const user = await UserModel.findOne({
			passwordVerificationToken: hashedToken,
			passwordVerificationTokenExpiry: { $gt: Date.now() },
		});

		if (!user)
			return res.status(400).json({ error: "Invalid or expired token" });
		if (!user.verified)
			return res.status(400).json({
				error: "Unverified account, complete registration process",
			});

		user.password = await bcrypt.hash(password, 10);
		user.passwordVerificationToken = undefined;
		user.passwordVerificationTokenExpiry = undefined;

		await user.save();

		res.status(200).json({ message: "Password reset successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Password reset failed" });
	}
};

module.exports = { handleResetPassword, handleForgotPassword };
