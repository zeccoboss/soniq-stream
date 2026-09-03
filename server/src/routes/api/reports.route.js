const router = require("express").Router();
const reportsController = require("../../controllers/reports/reports.controller");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");

// Filing a report requires being logged in — no anonymous reports
router.use(verifyJWT);

router.post("/", reportsController.submitReport);

module.exports = router;
