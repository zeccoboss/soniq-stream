// client/src/features/register/register.helpers.js
import {
	readFromSessionStorage,
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

const DRAFT_KEY = "reg_draft";

export const getStrength = (password) => {
	let score = 0;
	if (password.length > 8) score++; // Length
	if (/[A-Z]/.test(password)) score++; // Uppercase
	if (/[0-9]/.test(password)) score++; // Numbers
	if (/[^A-Za-z0-9]/.test(password)) score++; // Special chars
	return score; // 0-4
};

// client/src/features/register/register.helpers.js

export const saveRegisterDraft = (updates) => {
	const current = readFromSessionStorage(DRAFT_KEY) || {};

	// Create a copy of the new data to filter for storage
	const safeUpdates = { ...updates };
	delete safeUpdates.password; // Prevent password from ever touching storage

	// Only write if there's non-password data to save
	if (Object.keys(safeUpdates).length > 0) {
		writeToSessionStorage(DRAFT_KEY, { ...current, ...safeUpdates });
	}
};
export const clearRegisterDraft = () => {
	removeFromSessionStorage(DRAFT_KEY);
};
