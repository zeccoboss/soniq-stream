const router = require("express").Router();
const playlistController = require("../../controllers/media/playlist.controller");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const optionalJWT = require("../../middlewares/optional-jwt.middleware");

router.get("/", verifyJWT, playlistController.getMyPlaylists);
router.get("/:uuid", optionalJWT, playlistController.getPlaylist);
router.post("/", verifyJWT, playlistController.createPlaylist);

router.patch("/:uuid", verifyJWT, playlistController.updatePlaylist);
router.patch("/:uuid/save", verifyJWT, playlistController.toggleSavePlaylist);
router.delete("/:uuid", verifyJWT, playlistController.deletePlaylist);

router.post(
	"/items/toggle",
	verifyJWT,
	playlistController.toggleTrackInPlaylist,
);

module.exports = router;
