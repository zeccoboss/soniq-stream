const router = require("express").Router();

router.get("/", (req, res) => {
	res.status(200).json({ status: "UP", timestamp: new Date() });
});

module.exports = router;
