import "./Modal.styles.css";

/**
 * Modal — Overlay-based confirmation/message modal
 *
 * Uses the existing overlay element already mounted in the layout.
 * Injects content into it, toggles --visible class to show/hide.
 *
 * Usage:
 *   import { showModal, hideModal } from "@zecco/components/Modal/Modal.js";
 *
 *   // Simple message
 *   showModal({
 *     title:   "Track deleted",
 *     message: "Your track has been permanently removed.",
 *   });
 *
 *   // With confirm action
 *   showModal({
 *     title:         "Delete account?",
 *     message:       "This cannot be undone. All your tracks and data will be lost.",
 *     type:          "danger",
 *     confirmLabel:  "Delete Account",
 *     onConfirm:     () => accountService.delete(),
 *   });
 *
 *   // With icon
 *   showModal({
 *     title:        "Redirecting to login",
 *     message:      "You need to be signed in to upload tracks.",
 *     type:         "info",
 *     icon:         "bi-box-arrow-in-right",
 *     confirmLabel: "Go to Login",
 *     onConfirm:    () => router.navigate("/auth/login"),
 *   });
 *
 * Props:
 *   title        {string}    — required
 *   message      {string}    — required
 *   type         {string}    — "default" | "danger" | "warning" | "info" | "success"
 *   icon         {string}    — Bootstrap icon class e.g. "bi-trash"
 *   confirmLabel {string}    — confirm button text (default: "Confirm")
 *   cancelLabel  {string}    — cancel button text (default: "Cancel")
 *   onConfirm    {Function}  — called when confirm is clicked, modal auto-closes after
 *   closable     {boolean}   — allow overlay backdrop click to close (default: true)
 */

// ── Overlay reference ─────────────────────────────────────────
// The overlay is already mounted in buildLayout.js
// We get it by id rather than importing it to avoid circular deps
const getOverlay = () => document.getElementById("app-overlay");

// ── Icon map per type ─────────────────────────────────────────
const TYPE_ICONS = {
	danger: "bi-exclamation-triangle-fill",
	warning: "bi-exclamation-circle-fill",
	info: "bi-info-circle-fill",
	success: "bi-check-circle-fill",
	default: "bi-question-circle-fill",
};

// ── Active state ──────────────────────────────────────────────
let isOpen = false;
let onCloseCb = null;

// ── Hide modal ────────────────────────────────────────────────
export const hideModal = () => {
	const overlay = getOverlay();
	if (!overlay) return;

	const modal = overlay.querySelector(".modal");
	if (modal) modal.classList.add("modal--out");

	// Wait for exit animation then clean up
	setTimeout(() => {
		overlay.classList.remove("overlay--visible");
		overlay.innerHTML = "";
		isOpen = false;
		onCloseCb = null;
	}, 220);
};

// ── Show modal ────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {string}    props.title
 * @param {string}    props.message
 * @param {string}    [props.type="default"]
 * @param {string}    [props.icon]
 * @param {string}    [props.confirmLabel="Confirm"]
 * @param {string}    [props.cancelLabel="Cancel"]
 * @param {Function}  [props.onConfirm]
 * @param {boolean}   [props.closable=true]
 */
export const showModal = ({
	title,
	message,
	type = "default",
	icon = null,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm = null,
	closable = true,
}) => {
	const overlay = getOverlay();
	if (!overlay || !title || !message) return;

	// Close any existing modal first
	if (isOpen) hideModal();
	isOpen = true;

	const validType = [
		"default",
		"danger",
		"warning",
		"info",
		"success",
	].includes(type)
		? type
		: "default";
	const iconClass = icon ?? TYPE_ICONS[validType];
	const hasConfirm = typeof onConfirm === "function";

	// ── Build modal HTML ──────────────────────────────────────
	const modal = document.createElement("div");
	modal.className = `modal modal--${validType}`;
	modal.setAttribute("role", "dialog");
	modal.setAttribute("aria-modal", "true");
	modal.setAttribute("aria-labelledby", "modal-title");

	modal.innerHTML = `
		<div class="modal-icon-wrap modal-icon-wrap--${validType}">
			<i class="bi ${iconClass}"></i>
		</div>
		<div class="modal-body">
			<h3 class="modal-title" id="modal-title">${title}</h3>
			<p class="modal-message">${message}</p>
		</div>
		<div class="modal-actions">
			${
				hasConfirm
					? `<button class="modal-btn-cancel" id="modal-cancel-btn" type="button">
						${cancelLabel}
					</button>
					<button class="modal-btn-confirm modal-btn-confirm--${validType}"
						id="modal-confirm-btn" type="button">
						${confirmLabel}
					</button>`
					: `<button class="modal-btn-confirm modal-btn-confirm--${validType}"
						id="modal-ok-btn" type="button">
						OK
					</button>`
			}
		</div>
	`;

	// ── Wire buttons ──────────────────────────────────────────
	modal.querySelector("#modal-cancel-btn")?.addEventListener("click", () => {
		hideModal();
	});

	const confirmBtn =
		modal.querySelector("#modal-confirm-btn") ??
		modal.querySelector("#modal-ok-btn");

	confirmBtn?.addEventListener("click", async () => {
		if (hasConfirm) {
			confirmBtn.disabled = true;
			confirmBtn.innerHTML = `
				<svg class="modal-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
						stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
				</svg>
			`;
			try {
				await onConfirm();
			} catch {
				/* caller handles errors */
			}
		}
		hideModal();
	});

	// ── Mount ─────────────────────────────────────────────────
	overlay.appendChild(modal);
	overlay.classList.add("overlay--visible");

	// Overlay backdrop click to dismiss
	onCloseCb = (e) => {
		if (closable && e.target === overlay) hideModal();
	};
	overlay.addEventListener("click", onCloseCb, { once: true });

	// Escape key to dismiss
	const onKeyDown = (e) => {
		if (e.key === "Escape" && closable) {
			hideModal();
			document.removeEventListener("keydown", onKeyDown);
		}
	};
	document.addEventListener("keydown", onKeyDown);

	// Focus confirm button for accessibility
	requestAnimationFrame(() => confirmBtn?.focus());
};

export default showModal;
