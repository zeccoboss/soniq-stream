/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
const filterProfilePanels = (tab) => {
	const tabs = document.querySelectorAll(".profile-tab");
	const panels = document.querySelectorAll(".profile-panel");

	if (tabs.length === 0 || panels.length === 0) return;

	// Clear active states
	tabs.forEach((t) => t.classList.remove("active"));
	panels.forEach((p) => p.classList.remove("active-profile-panel"));

	// Set active tab and panel
	const activeTab = document.querySelector(`[data-tab="${tab}"]`);
	const activePanel = document.querySelector(`[data-panel="${tab}"]`);

	if (activeTab) activeTab.classList.add("active");
	if (activePanel) activePanel.classList.add("active-profile-panel");
};

export { filterProfilePanels };
