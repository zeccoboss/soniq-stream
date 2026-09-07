const router = require("express").Router();
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const {
	followUser,
	unfollowUser,
} = require("../../controllers/users/social.controller");

router.use(verifyJWT);
router.post("/:targetUuid/follow", followUser);
router.delete("/:targetUuid/follow", unfollowUser);

module.exports = router;
