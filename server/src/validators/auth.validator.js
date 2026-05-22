const { z } = require("zod");

const registerSchema = z.object({
	firstName: z
		.string({ required_error: "First name is required" })
		.trim()
		.min(2, "First name must be at least 2 characters")
		.max(50),

	lastName: z
		.string({ required_error: "Last name is required" })
		.trim()
		.min(2, "Last name must be at least 2 characters")
		.max(50),

	username: z
		.string({ required_error: "Username is required" })
		.trim()
		.min(3, "Username must be at least 3 characters")
		.max(30)
		.regex(
			/^[a-zA-Z0-9_]+$/,
			"Username can only contain letters, numbers, and underscores",
		),

	email: z
		.string({ required_error: "Email is required" })
		.trim()
		.email("Invalid email address"),

	password: z
		.string({ required_error: "Password is required" })
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),

	dob: z.string({ required_error: "Date of birth is required" }),

	gender: z.string({ required_error: "Gender is required" }),

	country: z.string({ required_error: "Country is required" }),

	genres: z
		.array(z.string(), { required_error: "Genres are required" })
		.min(1, "You must select at least 1 genre")
		.max(5, "You can select up to 5 genres"),

	termsAccepted: z
		.preprocess((val) => {
			return val === true || val === "true";
		}, z.boolean())
		.refine((val) => val === true, {
			message: "You must accept the Terms of Service",
		}),
});

const loginSchema = z.object({
	identifier: z
		.string({ required_error: "Email or username is required" })
		.trim()
		.min(1, "Email or username is required"),
	password: z
		.string({ required_error: "Password is required" })
		.trim()
		.min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.trim()
		.email("Invalid email address"),
});

const resetPasswordSchema = z
	.object({
		token: z
			.string({ required_error: "Reset token is required" })
			.trim()
			.min(1),
		password: z
			.string({ required_error: "Password is required" })
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

module.exports = {
	registerSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
};
