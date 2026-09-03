const router = require("express").Router();
const adminController = require("../../controllers/users/admin.controller");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const { verifyRoles } = require("../../middlewares/verify-roles.middleware");
const { rolesList } = require("../../config/roles-list.config");

// All routes in this file require being logged in AND having the Admin role
router.use(verifyJWT);
router.use(verifyRoles(rolesList.Admin));

// ── Global / aggregate ──────────────────────────────────────
router.get("/overview", adminController.getOverview);

// ── Standalone, granular routes ─────────────────────────────
router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.get("/tracks", adminController.getTracks);
router.get("/reports", adminController.getReports);
router.patch("/reports/:uuid", adminController.updateReportStatus);

// ── Content Management ──────────────────────────────────────
router.delete("/tracks/:uuid", adminController.deleteTrackAsAdmin);

// ── User Management ──────────────────────────────────────────
router.patch("/users/:uuid/role", adminController.updateUserRole);
router.patch("/users/:uuid/status", adminController.toggleUserStatus);

module.exports = router;
