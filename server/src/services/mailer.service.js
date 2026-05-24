const { BrevoClient } = require("@getbrevo/brevo");

// Initialize the new unified Brevo client
const brevo = new BrevoClient({
	apiKey: process.env.MAIL_APP_PASSWORD,
});

function sendMail({ to, subject, text, html }) {
	// In v4, you pass a clean object directly to the method
	return brevo.transactionalEmails
		.sendTransacEmail({
			subject: subject,
			htmlContent: html || text,
			textContent: text,

			// Crucial: Must be your verified personal sender email on Brevo
			sender: { name: "SoniqStream", email: "ezekielobang@gmail.com" },

			// Brevo still expects recipients structured inside an array of objects
			to: [{ email: to }],
		})
		.then((data) => {
			console.log("✓ Email dispatched successfully via Brevo v4 HTTP API");
			return data;
		})
		.catch((err) => {
			console.error("❌ HTTP Email delivery failed:", err.message);
			return null;
		});
}

module.exports = { sendMail };
