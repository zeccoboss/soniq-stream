/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <just skip it> */
import { getOverlay } from "@zecco/layouts/Overlay/Overlay";
import "@zecco/components/Modal/Modal.styles.css";
import "./PlaylistModal.styles.css";

let isOpen = false;

export const hidePlaylistModal = () => {
	const overlay = getOverlay();
	if (!overlay) return;
	const modal = overlay.querySelector(".playlist-modal");
	if (modal) modal.classList.add("modal--out");
	setTimeout(() => {
		overlay.classList.remove("overlay--visible");
		overlay.innerHTML = "";
		isOpen = false;
	}, 220);
};

/**
 * @param {Object} props
 * @param {Function} props.onCreate - async (name) => void. Throw to keep the modal open with an inline error.
 */
const showPlaylistModal = ({ onCreate }) => {
	const overlay = getOverlay();
	if (!overlay || typeof onCreate !== "function") return;

	if (isOpen) hidePlaylistModal();
	isOpen = true;

	const modal = document.createElement("div");
	modal.className = "modal playlist-modal";
	modal.setAttribute("role", "dialog");
	modal.setAttribute("aria-modal", "true");

	modal.innerHTML = `
		<div class="modal-icon-wrap modal-icon-wrap--default">
			<i class="bi bi-collection-play"></i>
		</div>
		<div class="modal-body">
			<h3 class="modal-title">New Playlist</h3>
			<div class="playlist-modal-field">
				<input type="text" class="playlist-modal-input" id="playlist-name-input"
					placeholder="Playlist name" maxlength="60" />
				<span class="playlist-modal-error hidden" id="playlist-modal-error"></span>
			</div>
			<div class="playlist-modal-field">
				<textarea class="playlist-modal-textarea" id="playlist-desc-input"
					placeholder="Description (optional)" maxlength="200" rows="2"></textarea>
			</div>
			<div class="playlist-modal-vis-toggle">
				<button class="playlist-modal-vis-btn active" data-vis="public" type="button">
					<i class="bi bi-globe2"></i> Public
				</button>
				<button class="playlist-modal-vis-btn" data-vis="private" type="button">
					<i class="bi bi-lock-fill"></i> Private
				</button>
			</div>
		</div>
		<div class="modal-actions">
			<button class="modal-btn-cancel" id="playlist-modal-cancel" type="button">Cancel</button>
			<button class="modal-btn-confirm modal-btn-confirm--default" id="playlist-modal-confirm" type="button">
				Create
			</button>
		</div>
	`;

	const input = modal.querySelector("#playlist-name-input");
	const descInput = modal.querySelector("#playlist-desc-input");
	const errorEl = modal.querySelector("#playlist-modal-error");
	const confirmBtn = modal.querySelector("#playlist-modal-confirm");
	let visibility = "public";

	modal.querySelectorAll("[data-vis]").forEach((btn) => {
		btn.addEventListener("click", () => {
			visibility = btn.dataset.vis;
			modal
				.querySelectorAll("[data-vis]")
				.forEach((b) => b.classList.toggle("active", b === btn));
		});
	});

	modal
		.querySelector("#playlist-modal-cancel")
		?.addEventListener("click", hidePlaylistModal);

	const submit = async () => {
		const name = input.value.trim();
		if (!name) {
			errorEl.textContent = "Give your playlist a name.";
			errorEl.classList.remove("hidden");
			input.focus();
			return;
		}

		confirmBtn.disabled = true;
		confirmBtn.textContent = "Creating...";
		try {
			await onCreate({
				name,
				description: descInput.value.trim(),
				visibility,
			});
			hidePlaylistModal();
		} catch (err) {
			errorEl.textContent = err.message || "Couldn't create playlist.";
			errorEl.classList.remove("hidden");
			confirmBtn.disabled = false;
			confirmBtn.textContent = "Create";
		}
	};

	confirmBtn.addEventListener("click", submit);
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") submit();
	});

	overlay.appendChild(modal);
	overlay.classList.add("overlay--visible");
	overlay.addEventListener(
		"click",
		(e) => {
			if (e.target === overlay) hidePlaylistModal();
		},
		{ once: true },
	);
	requestAnimationFrame(() => input.focus());
};

export default showPlaylistModal;
