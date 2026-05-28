const multer = require("multer");

const uploader = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit for tracks
	},
});

module.exports = uploader;
