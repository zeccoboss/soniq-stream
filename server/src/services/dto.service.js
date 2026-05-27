/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <Skip the foreach return> */
const { rolesList } = require("../config/roles-list.config");

// Create a reverse map for easy lookup: { 8840: "Admin", 9910: "Editor", 2442: "User" }
const rolesMap = Object.entries(rolesList).reduce((acc, [key, value]) => {
	acc[value] = key;
	return acc;
}, {});

/**
 * Recursively removes Mongo-specific metadata keys from plain objects/arrays.
 * Keeps business fields intact while stripping transport noise.
 */
function stripMongoMeta(value) {
	if (Array.isArray(value)) {
		return value.map(stripMongoMeta);
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	const plain =
		typeof value.toObject === "function"
			? value.toObject({ getters: true, virtuals: true, flattenMaps: true })
			: value;

	const out = {};
	for (const [key, val] of Object.entries(plain)) {
		if (key === "_id" || key === "__v" || key === "id") continue;
		out[key] = stripMongoMeta(val);
	}
	return out;
}

/**
 * Sanitizes user data for frontend consumption.
 * Removes sensitive fields, Mongo metadata, transforms roles, replaces arrays with counts, and cleans image objects.
 */
function sanitizeUserData(data) {
	if (!data) return null;

	// 1. Convert Mongoose Document → plain object (WITH virtuals enabled)
	const doc =
		typeof data.toObject === "function"
			? data.toObject({
					getters: true,
					virtuals: true,
					flattenMaps: true,
				})
			: JSON.parse(JSON.stringify(data));

	const sensitiveFields = [
		"verificationToken",
		"verificationTokenExpiry",
		"passwordVerificationToken",
		"passwordVerificationTokenExpiry",
		"lastUserVerificationSentAt",
		"lastPasswordVerificationSentAt",
	];

	// 2. Remove sensitive fields
	sensitiveFields.forEach((field) => delete doc[field]);
	delete doc.password;
	delete doc.refreshToken;

	// 3. Remove heavy relational arrays (counts now come from virtuals)
	const arrayToRemove = [
		"followingId",
		"followersId",
		"uploadsTracksId",
		"likedTracksIds",
		"playlistIds",
		"recentPlaysIds",
	];

	arrayToRemove.forEach((key) => {
		delete doc[key];
	});

	// 4. Transform roles into readable names
	if (Array.isArray(doc.roles)) {
		doc.roles = doc.roles.map((roleCode) => rolesMap[roleCode] || "Guest");
	}

	// 5. Clean nested image objects
	const cleanImage = (img) => {
		if (!img) return null;

		const cleaned = stripMongoMeta(img);
		delete cleaned.user;

		// Some lean/populated payloads may miss image virtuals; compute url defensively.
		if (
			!cleaned.url &&
			cleaned.storage?.baseUrl &&
			cleaned.storage?.key
		) {
			try {
				cleaned.url = new URL(cleaned.storage.key, cleaned.storage.baseUrl).href;
			} catch (_e) {
				// Keep payload stable even if a malformed storage URL exists.
			}
		}

		return cleaned;
	};

	if (doc.avatar) doc.avatar = cleanImage(doc.avatar);
	if (doc.banner) doc.banner = cleanImage(doc.banner);

	// 6. Clean settings object
	if (doc.settings) {
		doc.settings = stripMongoMeta(doc.settings);
		delete doc.settings.user;
	}

	// 7. Remove root mongo metadata
	delete doc._id;
	delete doc.id;
	delete doc.__v;

	return doc;
}

module.exports = { sanitizeUserData };
