const User = require("../../models/user.model");
const Settings = require("../../models/settings.model"); // <-- Make sure to import this now!

/**
 * Helper function to flatten nested objects into MongoDB dot notation.
 * Keeps your PATCH requests truly dynamic.
 */
const flattenObject = (obj, prefix = "") => {
	return Object.keys(obj).reduce((acc, k) => {
		const pre = prefix.length ? prefix + "." : "";
		if (
			typeof obj[k] === "object" &&
			obj[k] !== null &&
			!Array.isArray(obj[k]) &&
			!(obj[k] instanceof Date)
		) {
			Object.assign(acc, flattenObject(obj[k], pre + k));
		} else {
			acc[pre + k] = obj[k];
		}
		return acc;
	}, {});
};

/**
 * Updates a user's settings.
 * @param {string} userId - The database ID of the authenticated user.
 * @param {Object} newSettings - The partial payload to update.
 */
const updateSettingsFeed = async (userId, newSettings) => {
	try {
		// 1. Fetch the user to find their specific settings ObjectId reference
		const user = await User.findById(userId).select("settings");

		if (!user || !user.settings) {
			throw new Error("User or settings reference not found");
		}

		// 2. Convert the incoming req.body payload into a flat dot-notation object
		// Example input:  { notifications: { email: false }, theme: "dark" }
		// Example output: { "notifications.email": false, theme: "dark" }
		const flattenedUpdate = flattenObject(newSettings);

		// 3. Update the Settings collection directly using the user's settings ID
		const updatedSettings = await Settings.findByIdAndUpdate(
			user.settings,
			{ $set: flattenedUpdate },
			{ returnDocument: "after", runValidators: true },
		);

		return updatedSettings;
	} catch (error) {
		console.error("Update Settings Service Error:", error.message);
		throw error;
	}
};

/**
 * Fetches or initializes a user's private settings.
 * @param {string} userId - The database ID of the authenticated user.
 * @returns {Promise<Object>} The user's settings object.
 */
const getSettingsFeed = async (userId) => {
	try {
		const user = await User.findById(userId).select("settings");

		log("User fetched for settings:", user);

		if (!user) {
			throw new Error("User not found");
		}

		const settings = await Settings.findById(user.settings);

		// Fallback: If settings don't exist yet for the user, return a default schema structure
		if (!user.settings) {
			user.settings = {
				theme: "dark",
				notifications: { email: true, push: false },
				streamingQuality: "high",
			};
			await user.save();
		}

		return user.settings;
	} catch (error) {
		console.error("Get Settings Service Error:", error.message);
		throw error;
	}
};

module.exports = {
	getSettingsFeed,
	updateSettingsFeed, // <-- Now properly exported for your controller to use!
};
