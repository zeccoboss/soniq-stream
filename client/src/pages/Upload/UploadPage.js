// @zecco/features/upload/UploadPage.js
import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { UploadDesktop } from "./UploadDesktop.js";
import { UploadMobile } from "./UploadMobile.js";
import { uploadEvents } from "@zecco/features/upload/upload.events.js";
import { store } from "@zecco/store/store.js";
import meService from "@zecco/services/api/me.service.js"; // ◄ Now imported for live backend requests
import { toast } from "@zecco/components/Toast/Toast.js";
import {
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

export const UploadPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "upload-page";

	let state = "skeleton";
	let isMounted = true;
	let controller = null;

	// Data Persistence
	let fileData = (() => {
		try {
			const data =
				JSON.parse(sessionStorage.getItem("upload_draft") || "null") ?? {};
			return { visibility: "public", ...data };
		} catch {
			return { visibility: "public" };
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

	const setState = async (newState, data = {}) => {
		if (Object.keys(data).length > 0) saveFileData(data);
		state = newState;
		await render();
	};

	const render = async () => {
		if (!isMounted) return;

		const isMobile = mobileScreen.matches;
		const UI = isMobile ? UploadMobile : UploadDesktop;

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

	// ── LIVE BACKEND STREAMING METHOD ─────────────────────────
	const startUpload = async () => {
		try {
			if (!fileData.file) {
				return toast({ message: "No track file selected.", type: "error" });
			}

			state = "uploading";
			await render();
			controller = new AbortController();

			// Prepare Multi-part form stream payload
			const formData = new FormData();
			formData.append("track", fileData.file); // Matches backend structure (e.g. upload.single("track"))
			formData.append("genre", fileData.genre);
			formData.append("visibility", fileData.visibility);

			// Call your network service instance
			await meService.uploadTrack(
				formData,
				(percent) => {
					if (!isMounted) return;

					// Dynamically stream completion values to template percentage slots
					const pctLabel = root.querySelector(
						"#upload-pct, #upload-mob-pct",
					);
					if (pctLabel) pctLabel.textContent = `${percent}%`;

					// Smoothly increment template progress CSS node bars
					const pctFill = root.querySelector(
						"#upload-progress-fill, #upload-mob-progress-fill",
					);
					if (pctFill) pctFill.style.width = `${percent}%`;
				},
				controller.signal,
			);

			if (!isMounted) return;

			clearFileData();
			state = "completed";
			await render();
			toast({ message: "Track published successfully!", type: "success" });
		} catch (err) {
			if (err?.name === "AbortError" || !isMounted) return;

			// If the user is unauthenticated or forbidden, boot them to auth state
			if (err?.status === 401 || err?.status === 403) {
				toast({
					message: "Session expired. Please log in again.",
					type: "error",
				});
				state = "auth";
				await render();
				return;
			}

			// Standard file errors...
			console.error("[Upload Layer Error]:", err);
			state = "error";
			await render();
		}
	};

	// Initial load logic
	const loadData = async () => {
		try {
			state = "skeleton";
			await render();

			const isLoggedIn = store?.auth.isLoggedIn ?? false;

			if (!isLoggedIn) {
				state = "auth";
			} else if (fileData.fileName) {
				state = "form";
			} else {
				state = "dropzone";
			}
			await render();
		} catch (err) {
			if (isMounted) {
				state = "error";
				await render();
			}
		}
	};

	loadData();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
