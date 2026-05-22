const appConfig = require("../config/app.config");
const { sendMail } = require("../services/mailer.service");

const baseStyle = `
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #1a1a2e; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .body { padding: 40px 30px; color: #333333; }
        .body p { line-height: 1.6; font-size: 15px; }
        .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background-color: #e94560; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold; }
        .footer { background-color: #f4f4f4; padding: 20px 30px; text-align: center; font-size: 12px; color: #999999; }
    </style>
`;

const layout = (content) => `
    <!DOCTYPE html>
    <html>
    <head>${baseStyle}</head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${appConfig.appName}</h1>
            </div>
            <div class="body">
                ${content}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} ${appConfig.appName}. All rights reserved.</p>
                <p>If you did not request this email, you can safely ignore it.</p>
            </div>
        </div>
    </body>
    </html>
`;

function welcomeAdmin(email) {
	return sendMail({
		to: email,
		subject: `Welcome to ${appConfig.appName} 🎵`,
		html: layout(`
            <p>Hi there,</p>
            <p>Welcome aboard! 🎉 You've been added as an <strong>Admin</strong> on <strong>${appConfig.appName}</strong>.</p>
            <p>You now have full access to manage the platform. We're excited to have you on the team and can't wait to see what you'll bring to the table.</p>
            <p>If you have any questions or need support, don't hesitate to reach out.</p>
            <a href="${appConfig.client}" class="btn">Go to Dashboard</a>
            <p>All the best,<br/>The ${appConfig.appName} Team</p>
        `),
	});
}

function sendVerificationMail(email, token) {
	const verificationUrl = `${appConfig.client}/auth/verify/?token=${token}&type=register`;

	return sendMail({
		to: email,
		subject: `Verify Your Email – ${appConfig.appName}`,
		html: layout(`
            <p>Hi there,</p>
            <p>Thanks for signing up on <strong>${appConfig.appName}</strong>! We're thrilled to have you.</p>
            <p>Please verify your email address by clicking the button below. This link will expire in <strong>24 hours</strong>.</p>
            <a href="${verificationUrl}" class="btn">Verify My Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 13px; color: #666;">${verificationUrl}</p>
            <p>Cheers,<br/>The ${appConfig.appName} Team</p>
        `),
	});
}

function resendVerificationMail(email, token) {
	const verificationUrl = `${appConfig.client}/auth/verify/?token=${token}&type=register`;

	return sendMail({
		to: email,
		subject: `New Verification Link – ${appConfig.appName}`,
		html: layout(`
            <p>Hi there,</p>
            <p>You requested a new verification link — no worries, we've got you covered!</p>
            <p>Click the button below to verify your email. This link will expire in <strong>24 hours</strong>.</p>
            <a href="${verificationUrl}" class="btn">Verify My Email</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 13px; color: #666;">${verificationUrl}</p>
            <p>Cheers,<br/>The ${appConfig.appName} Team</p>
        `),
	});
}

function sendPasswordResetMail(email, token) {
	const resetUrl = `${appConfig.client}/auth/verify/?token=${token}&type=reset`;

	return sendMail({
		to: email,
		subject: `Password Reset Request – ${appConfig.appName}`,
		html: layout(`
            <p>Hi there,</p>
            <p>We received a request to reset your password. Click the button below to proceed.</p>
            <p>This link will expire in <strong>1 hour</strong> for your security.</p>
            <a href="${resetUrl}" class="btn">Reset My Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 13px; color: #666;">${resetUrl}</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
            <p>Stay safe,<br/>The ${appConfig.appName} Team</p>
        `),
	});
}

function resendPasswordResetMail(email, token) {
	const resetUrl = `${appConfig.client}/auth/verify/?token=${token}&type=reset`;

	return sendMail({
		to: email,
		subject: `New Password Reset Link – ${appConfig.appName}`,
		html: layout(`
				<p>Hi there,</p>
				<p>You requested a new password reset link. Here it is!</p>
				<p>This link will expire in <strong>1 hour</strong> for your security.</p>
				<a href="${resetUrl}" class="btn">Reset My Password</a>
				<p>If the button doesn't work, copy and paste this link into your browser:</p>
				<p style="word-break: break-all; font-size: 13px; color: #666;">${resetUrl}</p>
				<p>If you didn't request this, please ignore this email.</p>
				<p>Stay safe,<br/>The appConfig.appName Team</p>
        `),
	});
}

module.exports = {
	welcomeAdmin,
	sendVerificationMail,
	resendVerificationMail,
	sendPasswordResetMail,
	resendPasswordResetMail,
};
