/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <Its intentional to keep code short> */
function initHomeTabs(isLoggedIn) {
	const tabs = document.querySelectorAll(".home-tab");
	const panels = document.querySelectorAll(".h-tab-content");
	const authGate = document.getElementById("home-auth-gate");

	// mark auth tabs if logged out
	if (!isLoggedIn) {
		document.querySelectorAll(".auth-tab").forEach((t) => {
			t.dataset.locked = "true";
		});
	}

	tabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			const target = tab.dataset.tab;
			const isLocked = tab.dataset.locked === "true";

			if (isLocked) {
				// show auth gate instead of content
				panels.forEach((p) => p.classList.remove("active-tab-content"));
				authGate.style.display = "flex";
				tabs.forEach((t) => t.classList.remove("active-tab"));
				tab.classList.add("active-tab");
				return;
			}

			authGate.style.display = "none";
			tabs.forEach((t) => t.classList.remove("active-tab"));
			panels.forEach((p) => p.classList.remove("active-tab-content"));

			tab.classList.add("active-tab");
			document
				.querySelector(`[data-content="${target}"]`)
				.classList.add("active-tab-content");
		});
	});
}

export { initHomeTabs };
