import { appConfig } from "@zecco/config/app.config";

// Helper functions to interact with session storage, namespaced with the app name to avoid conflicts with other data in session storage. Provides functions to read and write data, handling JSON parsing/stringifying and errors gracefully.

const buildKey = (key) => `${appConfig.APP_NAME}--${key}`;

const readFromSessionStorage = (key) => {
	try {
		// Get the data from session storage using the built key, parse it and return. If no data found return null
		const data = sessionStorage.getItem(buildKey(key));

		// If data is found parse it to an object and return, if not return null
		return data ? JSON.parse(data) : null;
	} catch (err) {
		console.error("[Session Storage]:", err);
		return null;
	}
};

// Stringify the value and save it to session storage using the built key. Handle any errors that may occur during the process.
const writeToSessionStorage = (key, value) => {
	try {
		sessionStorage.setItem(buildKey(key), JSON.stringify(value));
	} catch (err) {
		console.error("[Session Storage]:", err);
	}
};

// Function to remove a specific key from session storage, using the built key to ensure it targets the correct data.
const removeFromSessionStorage = (key) => {
	try {
		sessionStorage.removeItem(buildKey(key));
	} catch (err) {
		console.error("[Session Storage]:", err);
	}
};

export {
	readFromSessionStorage,
	writeToSessionStorage,
	removeFromSessionStorage,
};
