/**
 * Adds a local, debounced list filter to an admin tab.
 * Filtering the loaded page is immediate and avoids a request on every keypress.
 * The returned cleanup function is safe to call before a page re-render.
 */
export const bindAdminSearch = ({
	input,
	list,
	rowSelector,
	label,
	delay = 160,
}) => {
	if (!input || !list) return () => {};

	const empty = document.createElement("p");
	empty.className = "admin-search-empty";
	empty.hidden = true;
	empty.setAttribute("aria-live", "polite");
	list.insertAdjacentElement("afterend", empty);

	let timer = null;
	const filter = () => {
		const query = input.value.trim().toLocaleLowerCase();
		const rows = [...list.querySelectorAll(rowSelector)];
		let visibleCount = 0;

		rows.forEach((row) => {
			const isMatch =
				!query || row.textContent.toLocaleLowerCase().includes(query);
			row.hidden = !isMatch;
			row.setAttribute("aria-hidden", String(!isMatch));
			if (isMatch) visibleCount += 1;
		});

		empty.hidden = !query || visibleCount > 0;
		empty.textContent = `No ${label.toLowerCase()} match “${input.value.trim()}”.`;
	};

	const onInput = () => {
		clearTimeout(timer);
		timer = setTimeout(filter, delay);
	};
	const onKeyDown = (event) => {
		if (event.key !== "Escape" || !input.value) return;
		input.value = "";
		clearTimeout(timer);
		filter();
	};

	input.addEventListener("input", onInput);
	input.addEventListener("keydown", onKeyDown);

	return () => {
		clearTimeout(timer);
		input.removeEventListener("input", onInput);
		input.removeEventListener("keydown", onKeyDown);
		empty.remove();
	};
};

const fmt = (n = 0) => Number(n).toLocaleString();
const initials = (str = "?") => str.trim().slice(0, 2).toUpperCase();

// ── Media URL resolver ────────────────────────────────────
// Handles both a plain URL string and a populated media object
// (e.g. { storage, name, uuid, url }). Never throws on null/undefined.
const getMediaUrl = (media) => {
	console.log("getMediaUrl - media:", media);
	if (!media) return null;
	if (typeof media === "string") return media;
	return media.url ?? media.storage?.url ?? null;
};

// ── Time ago utility ───────────────────────────────────────
const timeAgo = (dateStr) => {
	if (!dateStr) return "—";

	const diff = Date.now() - new Date(dateStr).getTime();
	if (diff < 60000) return "just now";
	const mins = Math.floor(diff / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
};

export { fmt, initials, getMediaUrl, timeAgo };
