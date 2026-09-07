import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { getOverlay } from "@zecco/layouts/Overlay/Overlay.js";
import { showActionSheet } from "@zecco/components/ActionSheet/ActionSheet.js";
import "./OptionsMenu.styles.css";

/**
 * OptionsMenu — anchored dropdown on desktop, bottom-sheet on mobile.
 * Same action shape as ActionSheet: { label, icon, onClick, danger? }.
 *
 * Usage:
 *   showOptionsMenu(anchorButtonEl, {
 *     title: track.title, // optional, mobile only (desktop dropdowns don't need a heading)
 *     actions: [
 *       { label: "Go to Artist", icon: "bi-person-circle", onClick: () => ... },
 *       { label: "Remove", icon: "bi-trash", danger: true, onClick: () => ... },
 *     ],
 *   });
 */

let isOpen = false;
let cleanup = null;

export const hideOptionsMenu = () => {
	if (!isOpen) return;
	const overlay = getOverlay();
	const menu = overlay?.querySelector(".options-menu");
	if (menu) menu.classList.add("options-menu--out");

	setTimeout(() => {
		overlay?.classList.remove("overlay--visible", "overlay--transparent");
		if (overlay) overlay.innerHTML = "";
		isOpen = false;
	}, 150);

	cleanup?.();
	cleanup = null;
};

const positionMenu = (menu, anchorEl) => {
	const rect = anchorEl.getBoundingClientRect();
	const menuRect = menu.getBoundingClientRect();
	const margin = 8;

	let top = rect.bottom + margin;
	let left = rect.right - menuRect.width;

	// Flip above the anchor if there's no room below
	if (top + menuRect.height > window.innerHeight - margin) {
		top = rect.top - menuRect.height - margin;
	}
	// Keep on-screen horizontally
	left = Math.max(
		margin,
		Math.min(left, window.innerWidth - menuRect.width - margin),
	);

	menu.style.top = `${top}px`;
	menu.style.left = `${left}px`;
};

export const showOptionsMenu = (
	anchorEl,
	{ title = null, actions = [] } = {},
) => {
	if (!anchorEl || !actions.length) return;

	// Mobile: defer entirely to the existing bottom-sheet pattern.
	if (mobileScreen.matches) {
		showActionSheet({ title, actions });
		return;
	}

	if (isOpen) hideOptionsMenu();
	isOpen = true;

	const overlay = getOverlay();
	overlay.classList.add("overlay--visible", "overlay--transparent"); // transparent: no dim/blur, this is a dropdown not a modal

	const menu = document.createElement("div");
	menu.className = "options-menu";
	menu.setAttribute("role", "menu");
	menu.innerHTML = actions
		.map(
			(a, i) => `
		<button class="options-menu-item ${a.danger ? "options-menu-item--danger" : ""}" data-option-index="${i}" type="button">
			<i class="bi ${a.icon}"></i>
			<span>${a.label}</span>
		</button>
	`,
		)
		.join("");

	menu.querySelectorAll("[data-option-index]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const action = actions[Number(btn.dataset.optionIndex)];
			hideOptionsMenu();
			setTimeout(() => action?.onClick?.(), 120);
		});
	});

	overlay.appendChild(menu);
	positionMenu(menu, anchorEl);

	const onBackdropClick = (e) => {
		if (e.target === overlay) hideOptionsMenu();
	};
	overlay.addEventListener("click", onBackdropClick, { once: true });

	const onScroll = () => hideOptionsMenu(); // dropdowns don't track scroll — just close
	window.addEventListener("scroll", onScroll, { capture: true, once: true });

	const onKeyDown = (e) => {
		if (e.key === "Escape") hideOptionsMenu();
	};
	document.addEventListener("keydown", onKeyDown);

	cleanup = () => {
		window.removeEventListener("scroll", onScroll, { capture: true });
		document.removeEventListener("keydown", onKeyDown);
	};
};

export default showOptionsMenu;
