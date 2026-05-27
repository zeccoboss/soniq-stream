const router = require("express").Router();
const meController = require("../../controllers/users/me.controller");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { updateSettingsSchema } = require("../../validators/user.validator");
const {
	validatePlayerState,
	validateSyncSearches,
} = require("../../validators/me.validator");

// Apply Auth to all /me routes
router.use(verifyJWT);

router.get("/", meController.getMe); // Standard profile fetch
router.get("/settings", meController.getSettings); // Get or create user settings

// Update user settings (theme, notifications, etc.)
router.patch(
	"/settings",
	validate(updateSettingsSchema),
	meController.updateSettings,
);
router.get("/library", meController.getMyLibrary); // Fetch user music library (liked tracks, playlists, upload)
router.post("/searches", meController.syncSearches); // Sync recent searches from client to server
router.patch("/player", validatePlayerState, meController.savePlayerState); // Update the state (called on pause or heartbeat)
router.get("/player", meController.getPlayerState); // Retrieve the last played track and progress

// Get the user's liked tracks list
router.get("/library/likes", verifyJWT, meController.fetchLikes);

// Settings update (Theme, Quality, etc.)
router.patch(
	"/settings",
	verifyJWT,
	validate(updateSettingsSchema),
	meController.updateSettings,
);

router.post("/recent-searches", meController.addRecentSearch);
router.post("/searches/sync", validateSyncSearches, meController.syncSearches);

module.exports = router;
