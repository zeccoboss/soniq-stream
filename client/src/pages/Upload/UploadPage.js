import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { UploadDesktop } from "./UploadDesktop.js";
import { UploadMobile } from "./UploadMobile.js";
import { uploadEvents } from "@zecco/features/upload/upload.events.js";
import { store } from "@zecco/store/store.js";
import {
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

// @zecco/features/upload/UploadPage.js
export const UploadPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "upload-page";

	let state = "skeleton"; // Start at skeleton
	let isMounted = true;
	let controller = null;

	let fileData = (() => {
		try {
			return (
				JSON.parse(sessionStorage.getItem("upload_draft") || "null") ?? {}
			);
		} catch {
			return {};
		}
	})();

	const saveFileData = (updates) => {
		fileData = { ...fileData, ...updates };
		try {
			writeToSessionStorage("upload_draft", fileData);
		} catch {}
	};

	const clearFileData = () => {
		fileData = {};
		removeFromSessionStorage("upload_draft");
	};

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? UploadMobile : UploadDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;

		// Removed hardcoded state = "dropzone" here
		const view = await UI({ state, ctx, data: fileData });
		root.replaceChildren(view);

		uploadEvents(root, {
			state,
			setState,
			saveFileData,
			clearFileData,
			getFileData: () => fileData,
			startUpload,
		});
	};

	// ── State updater ────────────────────────────────────────
	const setState = async (newState, data = {}) => {
		if (Object.keys(data).length > 0) saveFileData(data);
		state = newState;
		await render();
	};

	// ── Upload handler ───────────────────────────────────────
	const startUpload = async () => {
		try {
			state = "uploading";
			await render();
			controller = new AbortController();

			// Mock/Future API call here...
			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (!isMounted) return;
			clearFileData();
			state = "completed";
			await render();
		} catch (err) {
			if (err?.name !== "AbortError" && isMounted) {
				state = "error";
				await render();
			}
		}
	};

	// ── Initial load ─────────────────────────────────────────
	const loadData = async () => {
		// Ensure skeleton shows first
		state = "skeleton";
		await render();

		const user = store.getUser?.() ?? null;
		if (!store.isLoggedIn) {
			state = "auth";
		} else if (fileData.fileName) {
			state = "form";
		} else {
			state = "dropzone";
		}
		await render();
	};

	loadData();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};

// import { mobileScreen } from "@zecco/core/screen-break-points.js";
// import { UploadDesktop } from "./UploadDesktop.js";
// import { UploadMobile } from "./UploadMobile.js";
// import { uploadEvents } from "@zecco/features/upload/upload.events.js";
// import { store } from "@zecco/store/store.js";
// import {
// 	removeFromSessionStorage,
// 	writeToSessionStorage,
// } from "@zecco/services/storage/session-storage.js";

// /**
//  * UploadPage — Upload orchestrator
//  *
//  * State machine:
//  *   skeleton  → check auth via store
//  *   auth      → not logged in
//  *   dropzone  → logged in, awaiting file
//  *   form      → file selected, filling details
//  *   uploading → XHR/fetch in progress
//  *   completed → server confirmed upload
//  *   error     → upload failed
//  *
//  * Data flow:
//  *   File metadata is stored in `fileData` and passed into the
//  *   view on each render — the view is purely driven by state + data.
//  *   sessionStorage preserves file data across accidental refreshes.
//  *
//  * @async
//  * @param {Object} ctx - Router context
//  * @returns {Promise<Element>}
//  */
// export const UploadPage = async (ctx) => {
// 	const root = document.createElement("section");
// 	root.className = "upload-page";

// 	let state = "skeleton";
// 	let isMounted = true;
// 	let controller = null;

// 	// ── Persisted file data ──────────────────────────────────
// 	// Survives page refresh via sessionStorage.
// 	// Cleared on completed or when user removes file.
// 	let fileData = (() => {
// 		try {
// 			return (
// 				JSON.parse(sessionStorage.getItem("upload_draft") || "null") ?? {}
// 			);
// 		} catch {
// 			return {};
// 		}
// 	})();

// 	const saveFileData = (updates) => {
// 		fileData = { ...fileData, ...updates };
// 		try {
// 			writeToSessionStorage("upload_draft", fileData);
// 		} catch {
// 			/* storage full — not critical */
// 		}
// 	};

// 	const clearFileData = () => {
// 		fileData = {};
// 		removeFromSessionStorage("upload_draft");
// 	};

// 	const isMobile = mobileScreen.matches;
// 	const UI = isMobile ? UploadMobile : UploadDesktop;

// 	// ── Render ───────────────────────────────────────────────
// 	const render = async () => {
// 		if (!isMounted) return;
// 		// setState("dropzone");
// 		state = "dropzone";
// 		const view = await UI({ state, ctx, data: fileData });
// 		root.replaceChildren(view);
// 		uploadEvents(root, {
// 			state,
// 			setState,
// 			saveFileData,
// 			clearFileData,
// 			getFileData: () => fileData,
// 			startUpload,
// 		});
// 	};

// 	// ── State updater ────────────────────────────────────────
// 	const setState = async (newState, data = {}) => {
// 		if (Object.keys(data).length > 0) saveFileData(data);
// 		state = newState;
// 		await render();
// 	};

// 	// ── Upload handler ───────────────────────────────────────
// 	// Called by uploadEvents when the submit button is clicked.
// 	// Drives the uploading → completed | error transition.
// 	const startUpload = async () => {
// 		try {
// 			state = "uploading";
// 			await render();

// 			controller = new AbortController();

// 			// TODO: replace with real upload service call
// 			// const result = await trackService.upload({
// 			//   file:       fileData.file,
// 			//   genre:      fileData.genre,
// 			//   visibility: fileData.visibility,
// 			//   signal:     controller.signal,
// 			//   onProgress: (pct) => {
// 			//     const fill = document.getElementById("upload-progress-fill");
// 			//     const pctEl = document.getElementById("upload-pct");
// 			//     if (fill)  fill.style.width = `${pct}%`;
// 			//     if (pctEl) pctEl.textContent = `${pct}%`;
// 			//   },
// 			// });

// 			if (!isMounted) return;

// 			clearFileData();
// 			state = "completed";
// 			await render();
// 		} catch (err) {
// 			if (err?.name !== "AbortError" && isMounted) {
// 				console.error("[UploadPage] Upload error:", err);
// 				state = "error";
// 				await render();
// 			}
// 		}
// 	};

// 	// ── Initial load ─────────────────────────────────────────
// 	const loadData = async () => {
// 		try {
// 			state = "skeleton";
// 			await render();

// 			// Read auth from store — no manual localStorage access
// 			const user = store.getUser?.() ?? null;
// 			if (!user) {
// 				state = "auth";
// 				await render();
// 				return;
// 			}

// 			// If a draft exists from a previous session, restore to form
// 			if (fileData.fileName) {
// 				state = "form";
// 			} else {
// 				state = "dropzone";
// 			}

// 			await render();
// 		} catch (err) {
// 			if (isMounted) {
// 				console.error("[UploadPage] Load error:", err);
// 				state = "error";
// 				await render();
// 			}
// 		}
// 	};

// 	loadData();

// 	// ── Lifecycle ────────────────────────────────────────────
// 	root.__onUnmount = () => {
// 		isMounted = false;
// 		controller?.abort();
// 		// Don't clear fileData on unmount — preserve draft
// 		// so if user navigates away and comes back it's restored
// 	};

// 	return root;
// };
