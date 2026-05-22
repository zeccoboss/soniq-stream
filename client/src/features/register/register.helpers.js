// client/src/features/register/register.helpers.js
import showModal, { hideModal } from "@zecco/components/Modal/Modal";
import toast from "@zecco/components/Toast/Toast";
import {
	readFromSessionStorage,
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

const DRAFT_KEY = "reg_draft";

export const getStrength = (password) => {
	let score = 0;
	if (password.length > 8) score++; // Length
	if (/[A-Z]/.test(password)) score++; // Uppercase
	if (/[0-9]/.test(password)) score++; // Numbers
	if (/[^A-Za-z0-9]/.test(password)) score++; // Special chars
	return score; // 0-4
};

// client/src/features/register/register.helpers.js

export const saveRegisterDraft = (updates) => {
	const current = readFromSessionStorage(DRAFT_KEY) || {};

	// Create a copy of the new data to filter for storage
	const safeUpdates = { ...updates };
	delete safeUpdates.password; // Prevent password from ever touching storage

	// Only write if there's non-password data to save
	if (Object.keys(safeUpdates).length > 0) {
		writeToSessionStorage(DRAFT_KEY, { ...current, ...safeUpdates });
	}
};
export const clearRegisterDraft = () => {
	removeFromSessionStorage(DRAFT_KEY);
};
export const handleRegisterModal = ({ email, message }) => {
	if (!email || typeof email !== "string") {
		console.error("[REGISTER_HELPER]: Invalid email address provided.");
		return;
	}

	showModal({
		title: "Check your email",
		message:
			message ||
			`We've sent a verification link to ${email}. Please verify your account to continue.`,
		type: "info",
		icon: "bi-envelope-check-fill",
		confirmLabel: "Resend Email",
		cancelLabel: "Go to Login",
		closable: false,

		onConfirm: async () => {
			try {
				const resendResult = await authService.resendVerification({
					email,
				});

				// 1. Trigger the exit animation for the current modal
				hideModal();

				// 2. Wait for the 220ms cleanup timer in Modal.js to finish
				setTimeout(() => {
					showModal({
						title: "Email Resent!",
						message:
							resendResult.message ||
							"A new verification link has been sent to your inbox.",
						type: "success",
						icon: "bi-send-check-fill",
						confirmLabel: "Go to Login",
						cancelLabel: "Close",
						closable: false,
						onConfirm: () => router.navigate("/auth/login"),
					});
				}, 250);
			} catch (err) {
				const errorMessage =
					err.error ||
					err.message ||
					"Failed to resend verification email.";

				// 1. Trigger the exit animation
				hideModal();

				// 2. Wait for the cleanup timer
				setTimeout(() => {
					showModal({
						title: "Hold on",
						message: errorMessage,
						type: "warning",
						icon: "bi-exclamation-circle-fill",
						confirmLabel: "Try Again",
						cancelLabel: "Go to Login",
						closable: false,
						onConfirm: () =>
							handleRegisterModal({
								email,
								message: "Want to try resending again?",
							}),
					});
				}, 250);
			}
		},
	});

	// Ensure the cancel button routes to login
	setTimeout(() => {
		document
			.getElementById("modal-cancel-btn")
			?.addEventListener("click", () => {
				router.navigate("/auth/login");
			});
	}, 50);
};
