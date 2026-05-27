require("dotenv").config();
const express = require("express");
const path = require("node:path");
const cors = require("cors");
const { corsOptions } = require("./src/config/cors-options.config");
const { logger } = require("./src/middlewares/event-handler.middleware");
const { errorLogger } = require("./src/middlewares/error-handler.middleware");
const { initAdmin } = require("./src/core/init-admin.core");
const cookieParser = require("cookie-parser");
const { credentials } = require("./src/middlewares/credentials.middleware");
const { connectDB } = require("./src/config/db.config");
const mongoose = require("mongoose");
const appConfig = require("./src/config/app.config");
const { seedTracks } = require("./src/services/seed.service");

connectDB(); // Connect to mongodb
const app = express(); // Create App

// ==========================================
// VERCEL DEPLOYMENT FIX: Trust the reverse proxy
// ==========================================
app.set("trust proxy", 1);
console.log("hello world");

const PORT = appConfig.port; // Get PORT

app.use(credentials); // Handle options credentials check - before CORS! and fetch cookies credentials requirement
app.use(cors(corsOptions)); // CORS
app.use(logger); // Logs all Events

// Middle wares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Server html page
app.use("/", require("./src/routes/root.route"));

// Health check
app.use("/api/v1/health", require("./src/routes/health.route"));

// API routes - Note: Routes that require authentication should use the verifyJWT middleware
app.use("/api/v1/auth", require("./src/routes/api/auth.route")); // Authentication routes (Registration, Login, Logout, Token Refresh)
// Note: express-rate-limit will likely be inside your auth.route file, which is perfectly fine as long as trust proxy is set here at the root level!

app.use("/api/v1/oauth", require("./src/routes/api/oauth.route")); // OAuth routes (Google, GitHub, etc.)
app.use("/api/v1/users", require("./src/routes/api/users.route")); // Admin user management
app.use("/api/v1/me", require("./src/routes/api/me.route")); // Current user context routes (Profile, Settings, etc.)
app.use("/api/v1/images", require("./src/routes/api/images.route")); // Image upload routes (avatar, banner, etc.)
app.use("/api/v1/tracks", require("./src/routes/api/tracks.route")); // Music routes (Upload, Stream, Edit, Delete)
app.use("/api/v1/feeds", require("./src/routes/api/feeds.route")); // Feeds routes (Discover, Explore, For You, etc.)
app.use("/api/v1/admin", require("./src/routes/api/admin.route")); // Admin routes (Protected by Admin role middleware)
app.use("/api/v1/search", require("./src/routes/api/search.route")); // Search routes
app.use("/api/v1/playlists", require("./src/routes/api/playlist.route")); // Playlist routes (Create, Edit, Delete, Add/Remove Tracks)

// Catch-all for undefined routes (404)
app.use((_, res) => {
	const filePath = path.join(__dirname, "public", "views", "no-resource.html");
	res.status(404).sendFile(filePath);
});

// Logs all errors
app.use(errorLogger);

// Start server after successful DB connection
mongoose.connection.once("open", () => {
	// TODO: In production, consider moving seeding to a separate script or admin-only endpoint to avoid unintended data resets. For development/testing, this is fine. And only run this once.
	// seedTracks(); // Seed tracks after DB connection is established

	// Create admin on server start
	initAdmin(); // Initialize admin user if not exists

	// Listen for request on port
	app.listen(PORT, () => {
		console.log(`🔥 Server running on "http://localhost:${PORT}"`);
	});
});
