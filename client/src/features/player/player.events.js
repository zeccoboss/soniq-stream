export const playerEvents = (root, { isMobile, collapse }) => {
	const collapseBtn = root.querySelector(".player-collapse-btn");
	collapseBtn?.addEventListener("click", () => {
		collapse();
	});
};

// These events are specific to the player page — not used anywhere else.
// Keeping them separate keeps the player page code cleaner and more focused.
