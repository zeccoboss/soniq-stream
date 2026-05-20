const { updateImage } = require("../../controllers/media/images.controller");
const router = require("express").Router();
const multer = require("multer");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");

// ── Multer: memory storage, images only, 5 MB cap ─────────────────────────────
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (!file.mimetype.startsWith("image/")) {
			return cb(new Error("Only image files are allowed"));
		}
		cb(null, true);
	},
});

router.patch("/", verifyJWT, upload.single("image"), updateImage);

// ── Image Routes ─────────────────────────────────────────────────────────────

/**
 * TODO: PROFILE AVATAR
 * Logic:
 * 1. Process via handle-images.helpers (crop 200x200).
 * 2. Upload buffer to S3 'avatars' bucket.
 * 3. Update 'avatarUrl' in MongoDB Atlas for current user (req.user.id).
 */
// router.patch("/avatar", verifyJWT, upload.single("image"), updateUserAvatar);

/**
 * TODO: TRACK COVERS
 * Logic:
 * 1. Ensure image is high-res square (500x500).
 * 2. Upload to 'covers' bucket in S3.
 * 3. Return the URL so it can be saved in the Track document.
 */
// router.post("/track-cover", verifyJWT, upload.single("image"), uploadTrackCover);

/**
 * TODO: PLAYLIST ART
 * Logic:
 * 1. Basic optimization (compression).
 * 2. Store in 'playlists' bucket.
 */
// router.post("/playlist", verifyJWT, upload.single("image"), uploadPlaylistArt);

// Catches Multer errors specifically — must be defined after the route
router.use((err, _req, res, next) => {
	if (err instanceof multer.MulterError) {
		// e.g. LIMIT_FILE_SIZE
		return res.status(400).json({ success: false, message: err.message });
	}
	if (err) {
		// fileFilter rejection — "Only image files are allowed"
		return res.status(400).json({ success: false, message: err.message });
	}
	next();
});

module.exports = router;
