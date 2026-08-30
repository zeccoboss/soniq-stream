const filterLibraryContent = (tab) => {
	// Handle both desktop and mobile sections
	const sectionIds = {
		liked: ["lib-liked-section", "lib-liked-section-mobile"],
		uploaded: ["lib-upload-section", "lib-upload-section-mobile"],
		upload: ["lib-upload-section", "lib-upload-section-mobile"], // Mobile uses "upload"
		playlists: ["lib-playlists-section", "lib-playlists-section-mobile"],
		following: ["lib-following-section", "lib-following-section-mobile"],
		recent: ["lib-recent-section", "lib-recent-section-mobile"],
	};

	// Get all possible section IDs for this tab
	const targetIds = sectionIds[tab] || [];

	// Find all sections that exist on the page
	const allSections = [];
	Object.values(sectionIds)
		.flat()
		.forEach((id) => {
			const section = document.querySelector(`#${id}`);
			if (section) allSections.push(section);
		});

	// Hide all sections first
	allSections.forEach((section) => {
		section.style.display = "none";
	});

	// Show only the sections for the selected tab
	if (tab !== "all") {
		targetIds.forEach((id) => {
			const section = document.querySelector(`#${id}`);
			if (section) section.style.display = "block";
		});
	} else {
		// Show all sections if "all" is selected
		allSections.forEach((section) => {
			section.style.display = "block";
		});
	}
};

export { filterLibraryContent };
