const router = require("express").Router();
const usersControllers = require("../../controllers/users/users.controller");
const { rolesList } = require("../../config/roles-list.config");
const { verifyRoles } = require("../../middlewares/verify-roles.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { createUserSchema } = require("../../validators/user.validator");
const verifyJWT = require("../../middlewares/verify-jwt.middleware");
const optionalJWT = require("../../middlewares/optional-jwt.middleware");

// ── PUBLIC ROUTES ─────────────────────────────────────────────
// /search must come before any bare "/:uuid" — otherwise Express
// would try to treat "search" as a uuid param value.
router.route("/search").get(usersControllers.searchUsers);
router.route("/profile").get(optionalJWT, usersControllers.getUserProfile); // was :identifier
router.route("/:uuid").get(optionalJWT, usersControllers.getUser); // optional auth — guests get the public subset, owner/admin get full data

// ── SELF-SERVICE ROUTES (any logged-in user) ───────────────────
router.use(verifyJWT);

router.route("/me").put(usersControllers.updateUser);
router.route("/:uuid").delete(usersControllers.deleteUser); // controller allows owner OR admin

// ── ADMIN ONLY ROUTES ───────────────────────────────────────────
router.use(verifyRoles(rolesList.Admin));

router
	.route("/")
	.get(usersControllers.getAllUsers)
	.post(validate(createUserSchema), usersControllers.createUser);

module.exports = router;
