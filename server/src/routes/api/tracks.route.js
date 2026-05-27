const multer = require("multer");
const uploader = require("../../middlewares/multer.middleware");
const router = require("express").Router();
const { validate } = require("../../middlewares/validate.middleware");
const { updateTrackSchema } = require("../../validators/track.validator");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const { streamTrack } = require("../../controllers/media/stream.controller");

const {
	getAllTracks,
	getTrack,
	uploadTrack,
	updateTrack,
	deleteTrack,
	getTrackMetadata,
	toggleLike,
	addComment,
	incrementShareCount,
} = require("../../controllers/media/track.controller");
// Public routes

// Public reads
router.get("/", getAllTracks);
router.get("/:uuid", getTrack);

// All routes below require authentication
router.use(verifyJWT); // All routes below require authentication

// Actions (resource-based)
router.post("/:uuid/like", verifyJWT, toggleLike);
router.get("/:uuid/stream", verifyJWT, streamTrack);
router.get("/:uuid/metadata", getTrackMetadata);
router.post("/:uuid/comment", verifyJWT, addComment);
router.post("/:uuid/share", incrementShareCount); // Share usually just tracks metrics

// router.get("/:uuid/download", verifyJWT, downloadTrack); // TODO: to be added later

// Upload
router.post("/upload", verifyJWT, uploader.single("track"), uploadTrack);

// Mutations
router.patch("/:uuid", verifyJWT, validate(updateTrackSchema), updateTrack);
router.delete("/:uuid", verifyJWT, deleteTrack); //

// Error handling for Multer (file upload errors)
router.use((err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		return res.status(400).json({ success: false, message: err.message });
	}
	if (err) {
		console.error("Unexpected error in Multer middleware:", err);
		return res.status(400).json({ success: false, message: err.message });
	}
	next();
});

module.exports = router;
