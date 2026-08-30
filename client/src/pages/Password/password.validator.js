// Regex patterns for password validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPER = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

/**
 * Validate password meets strength requirements
 * @param {string} password
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
	if (!password) {
		return { isValid: false, message: "Password is required." };
	}

	if (password.length < 8) {
		return {
			isValid: false,
			message: "Password must be at least 8 characters.",
		};
	}

	if (!HAS_UPPER.test(password)) {
		return {
			isValid: false,
			message: "Password must include an uppercase letter.",
		};
	}

	if (!HAS_NUMBER.test(password)) {
		return {
			isValid: false,
			message: "Password must include a number.",
		};
	}

	return { isValid: true, message: "" };
};

/**
 * Validate email for step 1
 * @param {string} email
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
	if (!email) {
		return { isValid: false, message: "Email is required." };
	}

	if (!EMAIL_REGEX.test(email)) {
		return { isValid: false, message: "Please enter a valid email address." };
	}

	return { isValid: true, message: "" };
};

/**
 * Get password strength score
 * @param {string} password
 * @returns {number} 0-4
 */
export const getPasswordStrength = (password) => {
	if (!password) return 0;
	let score = 0;
	if (password.length >= 8) score++;
	if (HAS_UPPER.test(password)) score++;
	if (HAS_NUMBER.test(password)) score++;
	if (HAS_SPECIAL.test(password)) score++;
	return score;
};
