export const validateRegisterStep = (step, data) => {
	const errors = {};

	switch (step) {
		case 1:
			if (!data.firstName) errors.firstName = "First name is required";
			if (!data.lastName) errors.lastName = "Last name is required";
			if (!data.username) errors.username = "Username is required";
			if (!data.email || !/\S+@\S+\.\S+/.test(data.email))
				errors.email = "Valid email is required";
			break;

		case 2:
			if (!data.password || data.password.length < 8)
				errors.password = "Password must be at least 8 characters";
			if (data.password !== data.confirmPassword)
				errors.confirmPassword = "Passwords do not match";
			break;

		case 3:
			if (!data.dob) errors.dob = "Date of birth is required";
			if (!data.gender) errors.gender = "Gender is required";
			if (!data.termsAccepted) errors.terms = "You must accept the terms";
			break;
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};
