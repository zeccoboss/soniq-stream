export const formatTrackDuration = (value) => {
	if (value === null || value === undefined || value === "") return "";

	// Already formatted (e.g. "3:07" or "1:02:04")
	if (typeof value === "string" && value.includes(":")) {
		const parts = value
			.split(":")
			.map((p) => Number.parseInt(p, 10))
			.filter((n) => Number.isFinite(n));
		if (!parts.length) return "";

		if (parts.length === 2) {
			const [m, s] = parts;
			return `${m}:${String(Math.max(0, s)).padStart(2, "0")}`;
		}

		if (parts.length >= 3) {
			const [h, m, s] = parts.slice(-3);
			return `${h}:${String(Math.max(0, m)).padStart(2, "0")}:${String(
				Math.max(0, s),
			).padStart(2, "0")}`;
		}
	}

	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) return "";

	// Heuristic: values above 10,000 are usually milliseconds.
	const totalSeconds =
		numeric > 10000 ? Math.round(numeric / 1000) : Math.round(numeric);

	const hours = Math.floor(totalSeconds / 3600);
	const mins = Math.floor((totalSeconds % 3600) / 60);
	const secs = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}

	return `${mins}:${String(secs).padStart(2, "0")}`;
};

