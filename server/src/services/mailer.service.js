const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: Number(process.env.MAIL_PORT),
	secure: Number(process.env.MAIL_PORT) === 465,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_APP_PASSWORD,
	},
	connectionTimeout: 15000,
});
transporter.verify((err, success) => {
	if (err) {
		console.error("Transporter error:", err);
	} else {
		console.log("Transporter ready:", success);
	}
});
async function sendMail({ to, subject, text, html }) {
	return new Promise((resolve, reject) => {
		transporter.sendMail(
			{
				from: `"SoniqStream" <ezekielobang@gmail.com>`,
				to,
				subject,
				text,
				html,
			},
			(err, info) => {
				if (err) return reject(err);
				resolve(info);
			},
		);
	}).catch((err) => {
		console.error("❌ Email delivery failed:", err.message);
		return null;
	});
}
module.exports = { sendMail };
