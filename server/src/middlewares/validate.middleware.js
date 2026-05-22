// Reusable middleware factory — wraps any Zod schema
// Pass it a schema, it validates req.body and returns 400 with clear errors if invalid
const validate = (schema) => (req, res, next) => {
	const result = schema.safeParse(req.body);

	if (!result.success) {
		const errors = result.error.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));

		console.log("❌ ZOD VALIDATION FAILED ON FIELDS:", errors);

		return res.status(400).json({
			success: false,
			message: "Validation failed",
			errors,
		});
	}

	// Replace req.body with the parsed + coerced data so controllers
	// always receive clean, typed values
	req.body = result.data;
	next();
};

module.exports = { validate };
