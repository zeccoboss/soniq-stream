const { z } = require("zod");

// Schema definition
const syncSearchesSchema = z.object({
	body: z.object({
		searches: z
			.array(
				z
					.string()
					.trim()
					.min(1, "Search term cannot be empty")
					.max(100, "Search term too long"),
			)
			.max(20, "Cannot sync more than 20 items at once"),
	}),
});

// Middleware wrapper
const validateSyncSearches = (req, res, next) => {
	try {
		syncSearchesSchema.parse({
			body: req.body,
		});
		next();
	} catch (error) {
		return res.status(400).json({
			status: "fail",
			errors: error.errors.map((err) => ({
				path: err.path[1], // Tells you which index in the array failed
				message: err.message,
			})),
		});
	}
};

// Schema for updating the player state
const updatePlayerStateSchema = z.object({
	body: z.object({
		// 🔑 Switched key to trackUuid
		trackUuid: z
			.string()
			.uuid("Invalid Track UUID format")
			.nullable()
			.optional(),

		progressMs: z
			.number()
			.min(0, "Progress cannot be negative")
			.int("Progress must be an integer"),

		isPlaying: z.boolean(),
	}),
});

// Middleware wrapper
// Middleware wrapper
const validatePlayerState = (req, res, next) => {
	try {
		updatePlayerStateSchema.parse({
			body: req.body,
		});
		next();
	} catch (error) {
		// 🛡️ Type-Guard: Only run .map() if it is actually a Zod validation error
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				status: "fail",
				// .join('.') safely handles nested paths (e.g., 'body.trackId') without hardcoding indexes
				errors: error.errors.map((err) => ({
					field: err.path.join("."),
					message: err.message,
				})),
			});
		}

		// 🛡️ Fallback: Catch any standard Node.js/Express errors gracefully
		console.error("[Validation Middleware] Unexpected Error:", error);
		return res.status(500).json({
			status: "error",
			message: "Internal server error during payload validation",
		});
	}
};

module.exports = { validatePlayerState, validateSyncSearches };
