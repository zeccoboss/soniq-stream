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

export const saveRegisterDraft = (updates) => {
	const current = readFromSessionStorage(DRAFT_KEY) || {};
	writeToSessionStorage(DRAFT_KEY, { ...current, ...updates });
};

export const clearRegisterDraft = () => {
	removeFromSessionStorage(DRAFT_KEY);
};
