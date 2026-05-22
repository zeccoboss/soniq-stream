function maskEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email)) {
		return null;
	}

	const [username, domain] = email.split("@");

	if (username.length <= 4) {
		return (
			username[0] +
			"*".repeat(Math.max(username.length - 2, 0)) +
			username.slice(-1) +
			"@" +
			domain
		);
	}

	return (
		username.slice(0, 2) +
		"*".repeat(username.length - 4) +
		username.slice(-2) +
		"@" +
		domain
	);
}

module.exports = { maskEmail };
