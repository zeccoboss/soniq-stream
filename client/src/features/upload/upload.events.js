// @zecco/features/upload/upload-events.js
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import { networkHandler } from "@zecco/core/network-handler.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { parseAudioMetadata } from "./upload.helpers.js";

export const uploadEvents = (
	root,
	{ state, setState, saveFileData, clearFileData, getFileData, startUpload },
) => {
	if (root.hasAttribute("data-events-bound")) return;
	root.setAttribute("data-events-bound", "true");

	// 1. UNIFIED FILE SELECTION (Handles both desktop and mobile)
	const handleFileSelection = async (file) => {
		if (!file) return;
		if (!file.type.startsWith("audio/")) {
			toast({ message: "Please select a valid audio file.", type: "error" });
			return;
		}

		toast({
			message: "Analyzing audio file...",
			type: "info",
			duration: 1500,
		});

		try {
			const metadata = await parseAudioMetadata(file);
			// Ensure default visibility is public if not already set
			saveFileData({
				...metadata,
				visibility: metadata.visibility || "public",
			});
			setState("form");
		} catch (error) {
			console.error("File processing error:", error);
			toast({ message: "Failed to process the audio file.", type: "error" });
		}
	};

	// 2. UNIFIED CLICK HANDLER
	root.addEventListener("click", (e) => {
		// Browse Files (Targets both layouts)
		if (
			e.target.closest(
				"#upload-browse-btn, #upload-mob-browse-btn, .upload-dropzone, .upload-mob-dropzone",
			)
		) {
			if (e.target.closest("button, .upload-vis-btn")) return; // Don't trigger if clicking sub-elements
			root
				.querySelector("#upload-file-input, #upload-mob-file-input")
				?.click();
		}

		// Visibility Toggle
		const visBtn = e.target.closest(".upload-vis-btn");
		if (visBtn) {
			const container = visBtn.closest(".upload-vis-toggle");
			container
				.querySelectorAll(".upload-vis-btn")
				.forEach((b) => b.classList.remove("active"));
			visBtn.classList.add("active");

			const visibility = visBtn.dataset.vis; // 'public' or 'private'
			saveFileData({ visibility });
		}

		// Remove File / Cancel Upload
		if (e.target.closest("#upload-file-remove, #upload-mob-file-remove")) {
			if (state === "uploading") {
				toast({ message: "Upload cancelled.", type: "info" });
			}
			clearFileData();
			setState("dropzone");
		}

		// Submit Form
		if (e.target.closest("#upload-submit-btn, #upload-mob-submit-btn")) {
			const data = getFileData();
			if (!data.genre) {
				return toast({
					message: "Please select a genre.",
					type: "warning",
				});
			}
			startUpload();
		}

		// Retry Upload
		if (e.target.closest("#upload-retry-btn, #upload-mob-retry-btn")) {
			startUpload();
		}

		// Upload Another Track (Success Screen Reset to Dropzone)
		if (e.target.closest("#upload-another-btn, #upload-mob-another-btn")) {
			clearFileData();
			setState("dropzone");
		}
	});

	// 3. UNIFIED CHANGE HANDLER
	root.addEventListener("change", (e) => {
		// Files
		if (e.target.matches("#upload-file-input, #upload-mob-file-input")) {
			if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
		}
		// Genre
		if (e.target.matches("#upload-genre, #upload-mob-genre")) {
			saveFileData({ genre: e.target.value });
		}
	});
};
