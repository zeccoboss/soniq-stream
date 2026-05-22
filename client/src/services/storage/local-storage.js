import { appConfig } from "@zecco/config/app.config";

// Helper functions to interact with local storage, namespaced with the app name to avoid conflicts with other data in local storage. Provides functions to read and write data, handling JSON parsing/stringifying and errors gracefully.
const buildKey = (key) => `${appConfig.APP_NAME}--${key}`;

const readFromLocalStorage = (key) => {
	try {
		// Get the data from local storage using the built key, parse it and return. If no data found return null
		const data = localStorage.getItem(buildKey(key));

		// If data is found parse it to an object and return, if not return null
		return data ? JSON.parse(data) : null;
	} catch (err) {
		console.error("[Local Storage]:", err);
		return null;
	}
};

// Stringify the value and save it to local storage using the built key. Handle any errors that may occur during the process.
const writeToLocalStorage = (key, value) => {
	try {
		localStorage.setItem(buildKey(key), JSON.stringify(value)); // Stringify the value and save it to local storage using the built key
	} catch (err) {
		console.error("[Local Storage]:", err);
	}
};

// Function to remove a specific key from local storage, using the built key to ensure it targets the correct data.
const removeFromLocalStorage = (key) => {
	try {
		localStorage.removeItem(buildKey(key)); // Remove the item from local storage using the built key
	} catch (err) {
		console.error("[Local Storage]:", err);
	}
};

export { readFromLocalStorage, writeToLocalStorage, removeFromLocalStorage };
