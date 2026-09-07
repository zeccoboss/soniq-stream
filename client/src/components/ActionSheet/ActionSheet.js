import { getOverlay } from "@zecco/layouts/Overlay/Overlay.js";
import "./ActionSheet.styles.css";

/**
 * ActionSheet — bottom-sheet action picker, mounted into the same
 * shared overlay as Modal.js. Generic on purpose: pass any list of
 * { label, icon, onClick } — not tied to playlist/upload specifically.
 *
 * Usage:
 *   showActionSheet({
 *     title: "Add something new",
 *     actions: [
 *       { label: "Create Playlist", icon: "bi-collection-play", onClick: () => ... },
 *       { label: "Upload Track", icon: "bi-cloud-upload", onClick: () => router.navigate("/upload") },
 *     ],
 *   });
 */

let isOpen = false;

export const hideActionSheet = (onHidden = null) => {
	const overlay = getOverlay();
	if (!overlay) return;

	const sheet = overlay.querySelector(".action-sheet");
	if (sheet) sheet.classList.add("action-sheet--out");

	setTimeout(() => {
		overlay.classList.remove("overlay--visible", "overlay--bottom");
		overlay.innerHTML = "";
		isOpen = false;
		onHidden?.();
	}, 200);
};

export const showActionSheet = ({
	title = null,
	actions = [],
	closable = true,
}) => {
	const overlay = getOverlay();
	if (!overlay || !actions.length) return;

	if (isOpen) hideActionSheet();
	isOpen = true;

	const sheet = document.createElement("div");
	sheet.className = "action-sheet";
	sheet.setAttribute("role", "menu");

	sheet.innerHTML = `
		${title ? `<p class="action-sheet-title">${title}</p>` : ""}
		<div class="action-sheet-list">
			${actions
				.map(
					(a, i) => `
				<button class="action-sheet-item" data-action-index="${i}" type="button">
					<span class="action-sheet-icon"><i class="bi ${a.icon}"></i></span>
					<span class="action-sheet-label">${a.label}</span>
				</button>
			`,
				)
				.join("")}
		</div>
		<button class="action-sheet-cancel" type="button">Cancel</button>
	`;

	sheet.querySelectorAll("[data-action-index]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const action = actions[Number(btn.dataset.actionIndex)];
			// The action sheet and dialogs use the same overlay. Open the next
			// UI only after this sheet has finished clearing it.
			hideActionSheet(() => action?.onClick?.());
		});
	});

	sheet
		.querySelector(".action-sheet-cancel")
		?.addEventListener("click", hideActionSheet);

	overlay.appendChild(sheet);
	overlay.classList.add("overlay--visible", "overlay--bottom");

	const onBackdropClick = (e) => {
		if (closable && e.target === overlay) hideActionSheet();
	};
	overlay.addEventListener("click", onBackdropClick, { once: true });

	const onKeyDown = (e) => {
		if (e.key === "Escape" && closable) {
			hideActionSheet();
			document.removeEventListener("keydown", onKeyDown);
		}
	};
	document.addEventListener("keydown", onKeyDown);
};

export default showActionSheet;
