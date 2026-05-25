// @zecco/features/upload/upload-events.js
import { networkHandler } from "@zecco/core/network-handler.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { parseAudioMetadata } from "./upload.helpers.js";

export const uploadEvents = (
	root,
	{ state, setState, saveFileData, clearFileData, getFileData, startUpload },
) => {
	if (root.hasAttribute("data-events-bound")) return;
	root.setAttribute("data-events-bound", "true");

	const handleFileSelection = async (file) => {
		if (!file) return;

		if (!file.type.startsWith("audio/")) {
			toast({ message: "Please select a valid audio file.", type: "error" });
			return;
		}

		if (file.size > 50 * 1024 * 1024) {
			toast({ message: "File exceeds 50MB limit.", type: "error" });
			return;
		}

		toast({
			message: "Analyzing audio file...",
			type: "info",
			duration: 1500,
		});

		try {
			const metadata = await parseAudioMetadata(file);
			saveFileData(metadata);
			setState("form");
		} catch (error) {
			console.error("File processing error:", error);
			toast({ message: "Failed to process the audio file.", type: "error" });
		}
	};

	// Re-init dropzone only if we are in dropzone state
	if (state === "dropzone") {
		const dropzone = root.querySelector(
			"#upload-dropzone-area, #upload-mob-dropzone-area",
		);
		if (dropzone) {
			dropzone.addEventListener("drop", (e) => {
				e.preventDefault();
				if (e.dataTransfer.files?.length > 0)
					handleFileSelection(e.dataTransfer.files[0]);
			});
			// Add dragover/dragenter listeners for visual styles here...
		}
	}

	root.addEventListener("click", (e) => {
		// Browse buttons
		if (e.target.closest("#upload-browse-btn, .upload-dropzone")) {
			root
				.querySelector("#upload-file-input, #upload-mob-file-input")
				?.click();
		}

		// Remove file
		if (e.target.closest("#upload-file-remove, #upload-mob-file-remove")) {
			clearFileData();
			setState("dropzone");
		}

		// Submit
		if (e.target.closest("#upload-submit-btn, #upload-mob-submit-btn")) {
			if (networkHandler.getStatus() === "offline")
				return toast({ message: "Offline", type: "error" });
			if (!getFileData().genre)
				return toast({ message: "Select a genre", type: "warning" });
			startUpload();
		}
	});

	root.addEventListener("change", (e) => {
		if (e.target.id.includes("file-input")) {
			if (e.target.files?.length > 0) handleFileSelection(e.target.files[0]);
			e.target.value = "";
		}
		if (e.target.id.includes("genre")) {
			saveFileData({ genre: e.target.value });
		}
	});
};

// // @zecco/features/upload/upload-events.js
// import { networkHandler } from "@zecco/core/network-handler.js";
// import { toast } from "@zecco/components/Toast/Toast.js";
// import { parseAudioMetadata, formatDuration } from "./upload.helpers.js";

// export const uploadEvents = (
// 	root,
// 	{ state, setState, saveFileData, clearFileData, getFileData, startUpload },
// ) => {
// 	if (root.hasAttribute("data-events-bound")) return;
// 	root.setAttribute("data-events-bound", "true");

// 	const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 	// ── File Handling Logic ──
// 	const handleFileSelection = async (file) => {
// 		if (!file) return;

// 		// Validate File Type
// 		if (!file.type.startsWith("audio/")) {
// 			toast({ message: "Please select a valid audio file.", type: "error" });
// 			return;
// 		}

// 		// Validate File Size
// 		if (file.size > MAX_FILE_SIZE) {
// 			toast({
// 				message: "File exceeds the 50MB maximum size limit.",
// 				type: "error",
// 			});
// 			return;
// 		}

// 		toast({
// 			message: "Analyzing audio file...",
// 			type: "info",
// 			duration: 1500,
// 		});

// 		try {
// 			// Extract metadata using our helper
// 			const metadata = await parseAudioMetadata(file);

// 			// // Save to orchestrator state
// 			// saveFileData(metadata);
// 			// // upload.events.js
// 			// const metadata = await parseAudioMetadata(file);
// 			console.log(
// 				"[UploadEvents] Metadata received, calling saveFileData:",
// 				metadata,
// 			);
// 			saveFileData(metadata);

// 			console.log("[UploadEvents] Calling setState('form')..."); // ADD THIS
// 			// Transition to the details form
// 			setState("form");
// 		} catch (error) {
// 			console.error("File processing error:", error);
// 			toast({ message: "Failed to process the audio file.", type: "error" });
// 		}
// 	};

// 	// ── Drag & Drop Initialization ──
// 	const initDropzone = () => {
// 		const dropzone =
// 			root.querySelector("#upload-dropzone-area") ||
// 			root.querySelector("#upload-mob-dropzone-area");
// 		if (!dropzone) return;

// 		const preventDefaults = (e) => {
// 			e.preventDefault();
// 			e.stopPropagation();
// 		};

// 		["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
// 			dropzone.addEventListener(eventName, preventDefaults, false);
// 		});

// 		["dragenter", "dragover"].forEach((eventName) => {
// 			dropzone.addEventListener(
// 				eventName,
// 				() => dropzone.classList.add("drag-over"),
// 				false,
// 			);
// 		});

// 		["dragleave", "drop"].forEach((eventName) => {
// 			dropzone.addEventListener(
// 				eventName,
// 				() => dropzone.classList.remove("drag-over"),
// 				false,
// 			);
// 		});

// 		dropzone.addEventListener("drop", (e) => {
// 			const dt = e.dataTransfer;
// 			const files = dt.files;
// 			if (files && files.length > 0) {
// 				handleFileSelection(files[0]);
// 			}
// 		});
// 	};

// 	if (state === "dropzone") {
// 		initDropzone();
// 	}

// 	// ── Master Click Handler ──
// 	root.addEventListener("click", (e) => {
// 		// 1. Browse Files Button & Dropzone clicks
// 		const browseBtn = e.target.closest("#upload-browse-btn");
// 		const dropzoneArea = e.target.closest(
// 			".upload-dropzone, .upload-mob-dropzone",
// 		);
// 		if (browseBtn || (dropzoneArea && !e.target.closest("button"))) {
// 			const fileInput =
// 				root.querySelector("#upload-file-input") ||
// 				root.querySelector("#upload-mob-file-input");
// 			if (fileInput) fileInput.click();
// 			return;
// 		}

// 		// 2. Remove File
// 		const removeBtn = e.target.closest(
// 			"#upload-file-remove, #upload-mob-file-remove",
// 		);
// 		if (removeBtn) {
// 			clearFileData();
// 			setState("dropzone");
// 			toast({ message: "File removed.", type: "info" });
// 			return;
// 		}

// 		// 3. Visibility Toggles
// 		const visBtn = e.target.closest(".upload-vis-btn");
// 		if (visBtn) {
// 			// Update UI locally
// 			const container = visBtn.closest(".upload-vis-toggle");
// 			container
// 				.querySelectorAll(".upload-vis-btn")
// 				.forEach((btn) => btn.classList.remove("active"));
// 			visBtn.classList.add("active");

// 			// Save choice
// 			const visibility = visBtn.dataset.vis; // 'public' | 'private'
// 			saveFileData({ visibility });
// 			return;
// 		}

// 		// 4. Submit Upload
// 		const submitBtn = e.target.closest(
// 			"#upload-submit-btn, #upload-mob-submit-btn",
// 		);
// 		if (submitBtn) {
// 			e.preventDefault();

// 			if (networkHandler.getStatus() === "offline") {
// 				toast({
// 					message: "Internet connection required to upload tracks.",
// 					type: "error",
// 					duration: 4000,
// 				});
// 				return;
// 			}

// 			const currentData = getFileData();

// 			// Security Check: Did they refresh the page and lose the File object?
// 			if (!currentData.file) {
// 				toast({
// 					message: "File data lost. Please re-select your audio file.",
// 					type: "warning",
// 					duration: 4000,
// 				});
// 				clearFileData();
// 				setState("dropzone");
// 				return;
// 			}

// 			// Validation Check
// 			if (!currentData.genre) {
// 				toast({
// 					message: "Please select a genre before uploading.",
// 					type: "warning",
// 				});

// 				// Provide a visual cue by flashing the select box
// 				const genreSelect =
// 					root.querySelector("#upload-genre") ||
// 					root.querySelector("#upload-mob-genre");
// 				if (genreSelect) {
// 					genreSelect.style.borderColor = "var(--error)";
// 					setTimeout(() => (genreSelect.style.borderColor = ""), 1500);
// 				}
// 				return;
// 			}

// 			// Start the upload sequence managed by UploadPage.js
// 			startUpload();
// 			return;
// 		}

// 		// 5. Success / Error State Buttons
// 		const retryBtn = e.target.closest(
// 			"#upload-retry-btn, #upload-mob-retry-btn",
// 		);
// 		if (retryBtn) {
// 			if (networkHandler.getStatus() === "offline") {
// 				toast({
// 					message: "Still offline. Please check your connection.",
// 					type: "error",
// 				});
// 				return;
// 			}
// 			startUpload();
// 			return;
// 		}

// 		const uploadAnotherBtn = e.target.closest(
// 			"#upload-another-btn, #upload-mob-another-btn",
// 		);
// 		if (uploadAnotherBtn) {
// 			clearFileData();
// 			setState("dropzone");
// 			return;
// 		}
// 	});

// 	// ── Master Change Handler ──
// 	root.addEventListener("change", (e) => {
// 		// 1. File Input Selection
// 		if (
// 			e.target.id === "upload-file-input" ||
// 			e.target.id === "upload-mob-file-input"
// 		) {
// 			const files = e.target.files;
// 			if (files && files.length > 0) {
// 				handleFileSelection(files[0]);
// 			}
// 			// Reset the input value so the same file can be selected again if removed
// 			e.target.value = "";
// 			return;
// 		}

// 		// 2. Genre Selection
// 		if (
// 			e.target.id === "upload-genre" ||
// 			e.target.id === "upload-mob-genre"
// 		) {
// 			saveFileData({ genre: e.target.value });
// 			return;
// 		}
// 	});
// };
