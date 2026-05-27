const verifyRoles = (...allowedRoles) => {
	return (req, res, next) => {
		// Reject if req.roles wasn't attached by verifyJWT
		if (!req?.roles || req.roles.length === 0) {
			return res.status(401).json({
				code: "UNAUTHENTICATED",
				message: "Unauthorized: No roles assigned.",
			});
		}

		const rolesArray = [...allowedRoles];

		// Check if user has at least one of the required roles
		const hasRole = req.roles.some((role) => rolesArray.includes(role));

		// If they are logged in but lack the role, it's 403 Forbidden
		if (!hasRole) {
			return res.status(403).json({
				code: "FORBIDDEN",
				message: "Forbidden: Insufficient permissions.",
			});
		}

		next();
	};
};

module.exports = { verifyRoles };
