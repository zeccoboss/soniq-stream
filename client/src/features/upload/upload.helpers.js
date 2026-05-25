// @zecco/features/upload/upload.helpers.js
import { Buffer } from "buffer";
window.Buffer = Buffer;

export const formatBytes = (bytes, decimals = 2) => {
	if (!+bytes) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const formatDuration = (seconds) => {
	if (!seconds) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const parseAudioMetadata = async (file) => {
	console.log("[UploadHelper] 1. Starting parse for:", file.name);

	try {
		// 1. Log before the import
		console.log(
			"[UploadHelper] 2. Attempting to load music-metadata-browser...",
		);
		const mm = await import("music-metadata-browser");
		console.log("[UploadHelper] 3. Library loaded. Object:", mm);

		// 2. Identify parser
		const parser = mm.parseBlob || mm.default?.parseBlob;
		if (!parser)
			throw new Error("parseBlob function missing in library export");

		// 3. Log before parsing the file
		console.log("[UploadHelper] 4. Parsing file blob...");
		const metadata = await parser(file);
		console.log("[UploadHelper] 5. Parse successful!");

		const duration = formatDuration(metadata.format.duration);

		return {
			fileName: file.name,
			fileSize: formatBytes(file.size),
			fileDuration: duration,
			fileFormat: (
				metadata.format.codec ||
				file.type.split("/")[1] ||
				"Audio"
			).toUpperCase(),
			title: metadata.common.title || "",
			artist: metadata.common.artist || "",
			file: file,
		};
	} catch (err) {
		console.error("[UploadHelper] CRITICAL ERROR at step:", err);
		return {
			fileName: file.name,
			fileSize: formatBytes(file.size),
			fileDuration: "0:00",
			fileFormat: file.type.split("/")[1]?.toUpperCase() || "AUDIO",
			file: file,
		};
	}
};
