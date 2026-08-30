const filterSearchResults = (filter) => {
	const chips = document.querySelectorAll(".srch-chip");
	if (chips.length === 0) return;

	// Clear active state
	chips.forEach((chip) => chip.classList.remove("active"));

	// Set active filter chip
	const activeChip = document.querySelector(`[data-filter="${filter}"]`);
	if (activeChip) activeChip.classList.add("active");
};

export { filterSearchResults };
