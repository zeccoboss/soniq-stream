// client/src/features/login/login.helpers.js
import showModal, { hideModal } from "@zecco/components/Modal/Modal";
import { authService } from "@zecco/services/api/auth.service";
import {
	readFromSessionStorage,
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

const DRAFT_KEY = "login_draft";

export const saveLoginDraft = (updates) => {
	const current = readFromSessionStorage(DRAFT_KEY) || {};
	writeToSessionStorage(DRAFT_KEY, { ...current, ...updates });
};

export const clearLoginDraft = () => {
	removeFromSessionStorage(DRAFT_KEY);
};

let loginCooldownTimer = null;

export const promptLoginVerification = ({
	email,
	message,
	showSuccessState = false,
	customError = null,
}) => {
	if (!email) {
		console.error(
			"[LOGIN_HELPER]: Cannot prompt verification without a valid email address.",
		);
		return;
	}

	if (loginCooldownTimer) clearInterval(loginCooldownTimer);

	// ── STATE 1: Success State (Mail App Redirect) ─────────────────────
	if (showSuccessState) {
		showModal({
			title: "Email Resent!",
			message:
				message ||
				"A new verification link has been sent. Please check your inbox.",
			type: "success",
			icon: "bi-send-check-fill",
			confirmLabel: "Open Mail App",
			cancelLabel: "Close",
			closable: false,
			onConfirm: async () => {
				window.location.href = `mailto:${email}`;
			},
		});

		// Explicit close handler for success state
		setTimeout(() => {
			document
				.getElementById("modal-cancel-btn")
				?.addEventListener("click", () => {
					hideModal();
				});
		}, 50);
		return;
	}

	// ── STATE 2: Server API Error State ──────────────────────────────────
	if (customError) {
		showModal({
			title: "Hold on",
			message: customError,
			type: "warning",
			icon: "bi-exclamation-circle-fill",
			confirmLabel: "Try Again",
			cancelLabel: "Close",
			closable: false,
			onConfirm: async () => {
				// Loop back into the base verification prompt
				promptLoginVerification({ email, message });
			},
		});

		// Explicit close handler for error state
		setTimeout(() => {
			document
				.getElementById("modal-cancel-btn")
				?.addEventListener("click", () => {
					hideModal();
				});
		}, 50);
		return;
	}

	// ── STATE 3: Base Prompt State (Default) ────────────────────────────
	showModal({
		title: "Account Not Verified",
		message: message || "Your email address has not been verified yet.",
		type: "warning",
		icon: "bi-exclamation-triangle-fill",
		confirmLabel: "Resend Verification",
		cancelLabel: "Close",
		closable: false,

		onConfirm: async () => {
			try {
				// 1. Trigger the resend API endpoint
				const resendResult = await authService.resendVerification(email);
				console.log(resendResult);

				// 2. Safely trigger exit animation for current modal
				hideModal();

				// 3. Wait for the 220ms cleanup timer in Modal.js to finish
				setTimeout(() => {
					// 4. Re-mount cleanly to show success state
					promptLoginVerification({
						email,
						message:
							resendResult?.message ||
							"A new verification link has been sent. Please check your inbox.",
						showSuccessState: true,
					});
				}, 250);
			} catch (err) {
				const errorMessage =
					err.error || err.message || "Failed to resend email.";

				// 1. Safely trigger exit animation
				hideModal();

				// 2. Wait for the 220ms cleanup timer
				setTimeout(() => {
					// 3. Re-mount cleanly to display error details
					promptLoginVerification({
						email,
						customError: errorMessage,
					});
				}, 250);
			}
		},
	});

	// Handle the 60s countdown lock automatically when mounted
	setTimeout(() => {
		const confirmBtn = document.getElementById("modal-confirm-btn");
		const cancelBtn = document.getElementById("modal-cancel-btn");

		// Bind closing event explicitly to terminate intervals and drop overlay cleanly
		cancelBtn?.addEventListener("click", () => {
			if (loginCooldownTimer) clearInterval(loginCooldownTimer);
			hideModal();
		});

		// Enforce the 60-second limit matching token.controller.js
		if (confirmBtn && confirmBtn.innerHTML.includes("Resend Verification")) {
			let timeLeft = 60;
			confirmBtn.disabled = true;
			confirmBtn.innerHTML = `Resend Link (${timeLeft}s)`;

			loginCooldownTimer = setInterval(() => {
				timeLeft -= 1;
				if (timeLeft <= 0) {
					clearInterval(loginCooldownTimer);
					confirmBtn.disabled = false;
					confirmBtn.innerHTML = "Resend Verification";
				} else {
					confirmBtn.innerHTML = `Resend Link (${timeLeft}s)`;
				}
			}, 1000);
		}
	}, 50);
};
