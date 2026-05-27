const { allowedOrigins } = require("./allowed-origins.config");

const corsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.includes(origin) || !origin) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["PUT", "POST", "GET", "DELETE", "PATCH"],
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
	maxAge: 600,
	optionsSuccessStatus: 204,
};

module.exports = { corsOptions };
