// client/src/features/password/password.helpers.js
import {
	readFromSessionStorage,
	writeToSessionStorage,
	removeFromSessionStorage,
} from "@zecco/services/storage/session-storage.js";

const DRAFT_KEY = "pwd_draft";

export const savePwdDraft = (updates) => {
	const current = readFromSessionStorage(DRAFT_KEY) || {};
	writeToSessionStorage(DRAFT_KEY, { ...current, ...updates });
};

export const clearPwdDraft = () => {
	removeFromSessionStorage(DRAFT_KEY);
	removeFromSessionStorage("pwd_prev_step");
	removeFromSessionStorage("pwd_token");
};
