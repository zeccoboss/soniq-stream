/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <Skip the foreach return> */
const { rolesList } = require("../config/roles-list.config");

const SENSITIVE_USER_FIELDS = [
	"password",
	"refreshToken",
	"verificationToken",
	"verificationTokenExpiry",
	"passwordVerificationToken",
	"passwordVerificationTokenExpiry",
];

function sanitizeReportData(data) {
	if (Array.isArray(data)) return data.map(sanitizeReportData);
	if (!data) return null;

	const cleaned = stripMongoMeta(data);

	for (const key of ["targetId", "reportedBy", "reviewedBy"]) {
		if (cleaned[key] && typeof cleaned[key] === "object") {
			SENSITIVE_USER_FIELDS.forEach((f) => delete cleaned[key][f]);
		}
	}

	return cleaned;
}

// Create a reverse map for easy lookup: { 8840: "Admin", 9910: "Editor", 2442: "User" }
const rolesMap = Object.entries(rolesList).reduce((acc, [key, value]) => {
	acc[value] = key;
	return acc;
}, {});

/**
 * Recursively removes Mongo-specific metadata keys from plain objects/arrays.
 * Keeps business fields intact while stripping transport noise.
 */
// dto.service.js
function stripMongoMeta(value) {
	if (Array.isArray(value)) {
		return value.map(stripMongoMeta);
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	// Unpopulated ref — return as a plain string instead of walking its internal buffer
	if (
		value._bsontype === "ObjectID" ||
		value.constructor?.name === "ObjectId"
	) {
		return value.toString();
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

// Sanitizes track data for frontend consumption, removing Mongo metadata and cleaning populated user sub-docs.
function sanitizeTrackData(data) {
	if (Array.isArray(data)) return data.map(sanitizeTrackData);

	const cleaned = stripMongoMeta(data); // handles _id/__v/id recursively, including nested populated user

	// populated user sub-doc, if present, still needs its own sensitive-field treatment
	if (cleaned.user && typeof cleaned.user === "object") {
		cleaned.user = stripMongoMeta(cleaned.user);
	}

	return cleaned;
}

/**
 * Sanitizes user data for frontend consumption.
 * Removes sensitive fields, Mongo metadata, transforms roles, replaces arrays with counts, and cleans image objects.
 */
function sanitizeUserData(data) {
	if (Array.isArray(data)) return data.map(sanitizeUserData);
	if (!data) return null;

	const doc =
		typeof data.toObject === "function"
			? data.toObject({ getters: true, virtuals: true, flattenMaps: true })
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
		if (!cleaned.url && cleaned.storage?.baseUrl && cleaned.storage?.key) {
			try {
				cleaned.url = new URL(
					cleaned.storage.key,
					cleaned.storage.baseUrl,
				).href;
			} catch (_e) {
				// Keep payload stable even if a malformed storage URL exists.
			}
		}

		// Remove Mongo metadata from image object
		delete cleaned._id;
		delete cleaned.id;
		delete cleaned.__v;
		delete cleaned?.user;

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

	//	console.log("Sanitized user data:", doc); // Debugging log to inspect the sanitized output

	return doc;
}

// Full-ish public profile — what you see visiting someone's page
function sanitizePublicProfile(data) {
	if (!data) return null;
	if (Array.isArray(data)) return data.map(sanitizePublicProfile);

	const doc = stripMongoMeta(data);

	// Public profile never exposes these, regardless of who's asking
	delete doc.email;
	delete doc.roles;
	delete doc.settings;
	delete doc.isActive;

	return doc;
}

// Minimal shape for search/autocomplete results — array of many, not one
function sanitizeUserSearchResult(data) {
	if (!data) return null;
	if (Array.isArray(data)) return data.map(sanitizeUserSearchResult);

	const doc = stripMongoMeta(data);

	// Search results should be lightweight — this is a list item, not a profile page
	return {
		uuid: doc.uuid,
		username: doc.username,
		displayName: doc.displayName ?? doc.username,
		avatar: doc.avatar ?? null,
		isVerified: doc.isVerified ?? false,
	};
}

// Sanitizes playlist data for frontend consumption, removing Mongo metadata and cleaning populated track and image objects.
function sanitizePlaylistData(data) {
	if (Array.isArray(data)) return data.map(sanitizePlaylistData);
	if (!data) return null;

	const cleaned = stripMongoMeta(data);

	delete cleaned.nameLower; // internal only, never leaves the server
	delete cleaned.savedByIds; // heavy array — savesCount virtual covers the count

	if (cleaned.trackIds && Array.isArray(cleaned.trackIds)) {
		cleaned.trackIds = sanitizeTrackData(cleaned.trackIds);
	}
	if (cleaned.cover && typeof cleaned.cover === "object") {
		cleaned.cover = stripMongoMeta(cleaned.cover);
	}
	if (cleaned.user && typeof cleaned.user === "object") {
		cleaned.user = stripMongoMeta(cleaned.user); // creator attribution for saved playlists
	}

	return cleaned;
}

module.exports = {
	sanitizeUserData,
	sanitizeTrackData,
	sanitizeReportData,
	sanitizePublicProfile,
	sanitizeUserSearchResult,
	sanitizePlaylistData,
};
