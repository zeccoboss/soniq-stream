const express = require("express");
const router = express.Router();
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const {
	getMyNotifications,
	getMyUnreadCount,
	readNotification,
	readAllNotifications,
} = require("../../controllers/users/notification.controller");

router.use(verifyJWT); // every notification route requires a logged-in user

router.get("/", getMyNotifications);
router.get("/unread-count", getMyUnreadCount);
router.patch("/:uuid/read", readNotification);
router.patch("/read-all", readAllNotifications);

module.exports = router;
