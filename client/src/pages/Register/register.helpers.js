// client/src/features/register/register.helpers.js
import showModal, { hideModal } from "@zecco/components/Modal/Modal";
import { router } from "@zecco/routes/router";
import { authService } from "@zecco/services/api/auth.service";
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

// Track the interval globally within this file so we can clear it
// when the modal transitions or closes to prevent memory leaks.
let resendCooldownTimer = null;

export const promptEmailVerification = ({
	email,
	message,
	applyCooldown = true,
}) => {
	if (!email || typeof email !== "string") {
		console.error("[REGISTER_HELPER]: Invalid email address provided.");
		return;
	}

	// Clear any existing timers before mounting a new modal
	if (resendCooldownTimer) clearInterval(resendCooldownTimer);

	showModal({
		title: "Check your email",
		message:
			message ||
			`We've sent a verification link to ${email}. Please verify your account to continue.`,
		type: "info",
		icon: "bi-envelope-check-fill",
		confirmLabel: "Resend Email", // Will be overwritten by timer if applyCooldown is true
		cancelLabel: "Go to Login",
		closable: false,

		onConfirm: async () => {
			try {
				const resendResult = await authService.resendVerification(email);
				console.log(resendResult);

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
						confirmLabel: "Open Mail App", // Aligned with login helper flow
						cancelLabel: "Go to Login", // Shifted to cancel label
						closable: false,
						onConfirm: () => {
							// Directly open system/mobile default mail software layout
							window.location.href = `mailto:${email}`;
						},
					});

					// Bind navigation listener securely to the newly mounted success modal container elements
					setTimeout(() => {
						document
							.getElementById("modal-cancel-btn")
							?.addEventListener("click", () => {
								if (resendCooldownTimer)
									clearInterval(resendCooldownTimer);
								hideModal();
								router.navigate("/auth/login");
							});
					}, 50);
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
							promptEmailVerification({
								email,
								message: "Want to try resending again?",
								applyCooldown: true,
							}),
					});

					// Bind navigation listener securely to the newly mounted error modal container elements
					setTimeout(() => {
						document
							.getElementById("modal-cancel-btn")
							?.addEventListener("click", () => {
								if (resendCooldownTimer)
									clearInterval(resendCooldownTimer);
								hideModal();
								router.navigate("/auth/login");
							});
					}, 50);
				}, 250);
			}
		},
	});

	// Handle DOM manipulation for routing and countdown after base modal mounts
	setTimeout(() => {
		const cancelBtn = document.getElementById("modal-cancel-btn");
		const confirmBtn = document.getElementById("modal-confirm-btn");

		// Ensure the cancel button routes to login and clears timers
		cancelBtn?.addEventListener("click", () => {
			if (resendCooldownTimer) clearInterval(resendCooldownTimer);
			router.navigate("/auth/login");
		});

		// Apply the 60s cooldown lock
		if (applyCooldown && confirmBtn) {
			let timeLeft = 60;
			confirmBtn.disabled = true;
			confirmBtn.innerHTML = `Resend Email (${timeLeft}s)`;

			resendCooldownTimer = setInterval(() => {
				timeLeft -= 1;

				if (timeLeft <= 0) {
					clearInterval(resendCooldownTimer);
					confirmBtn.disabled = false;
					confirmBtn.innerHTML = `Resend Email`;
				} else {
					confirmBtn.innerHTML = `Resend Email (${timeLeft}s)`;
				}
			}, 1000);
		}
	}, 50);
};

// // client/src/features/register/register.helpers.js
// import showModal, { hideModal } from "@zecco/components/Modal/Modal";
// import { router } from "@zecco/routes/router";
// import { authService } from "@zecco/services/api/auth.service";
// import {
// 	readFromSessionStorage,
// 	removeFromSessionStorage,
// 	writeToSessionStorage,
// } from "@zecco/services/storage/session-storage.js";

// const DRAFT_KEY = "reg_draft";

// export const getStrength = (password) => {
// 	let score = 0;
// 	if (password.length > 8) score++; // Length
// 	if (/[A-Z]/.test(password)) score++; // Uppercase
// 	if (/[0-9]/.test(password)) score++; // Numbers
// 	if (/[^A-Za-z0-9]/.test(password)) score++; // Special chars
// 	return score; // 0-4
// };

// // client/src/features/register/register.helpers.js

// export const saveRegisterDraft = (updates) => {
// 	const current = readFromSessionStorage(DRAFT_KEY) || {};

// 	// Create a copy of the new data to filter for storage
// 	const safeUpdates = { ...updates };
// 	delete safeUpdates.password; // Prevent password from ever touching storage

// 	// Only write if there's non-password data to save
// 	if (Object.keys(safeUpdates).length > 0) {
// 		writeToSessionStorage(DRAFT_KEY, { ...current, ...safeUpdates });
// 	}
// };
// export const clearRegisterDraft = () => {
// 	removeFromSessionStorage(DRAFT_KEY);
// };
// // client/src/features/register/register.helpers.js

// // Track the interval globally within this file so we can clear it
// // when the modal transitions or closes to prevent memory leaks.
// let resendCooldownTimer = null;

// export const promptEmailVerification = ({
// 	email,
// 	message,
// 	applyCooldown = true,
// }) => {
// 	if (!email || typeof email !== "string") {
// 		console.error("[REGISTER_HELPER]: Invalid email address provided.");
// 		return;
// 	}

// 	// Clear any existing timers before mounting a new modal
// 	if (resendCooldownTimer) clearInterval(resendCooldownTimer);

// 	showModal({
// 		title: "Check your email",
// 		message:
// 			message ||
// 			`We've sent a verification link to ${email}. Please verify your account to continue.`,
// 		type: "info",
// 		icon: "bi-envelope-check-fill",
// 		confirmLabel: "Resend Email", // Will be overwritten by timer if applyCooldown is true
// 		cancelLabel: "Go to Login",
// 		closable: false,

// 		onConfirm: async () => {
// 			try {
// 				const resendResult = await authService.resendVerification(email);

// 				console.log(resendResult);

// 				// 1. Trigger the exit animation for the current modal
// 				hideModal();

// 				// 2. Wait for the 220ms cleanup timer in Modal.js to finish
// 				setTimeout(() => {
// 					showModal({
// 						title: "Email Resent!",
// 						message:
// 							resendResult.message ||
// 							"A new verification link has been sent to your inbox.",
// 						type: "success",
// 						icon: "bi-send-check-fill",
// 						confirmLabel: "Go to Login",
// 						cancelLabel: "Close",
// 						closable: false,
// 						onConfirm: () => {
// 							if (resendCooldownTimer)
// 								clearInterval(resendCooldownTimer);
// 							hideModal();
// 							router.navigate("/auth/login");
// 						},
// 					});
// 				}, 250);
// 			} catch (err) {
// 				const errorMessage =
// 					err.error ||
// 					err.message ||
// 					"Failed to resend verification email.";

// 				// 1. Trigger the exit animation
// 				hideModal();

// 				// 2. Wait for the cleanup timer
// 				setTimeout(() => {
// 					showModal({
// 						title: "Hold on",
// 						message: errorMessage,
// 						type: "warning",
// 						icon: "bi-exclamation-circle-fill",
// 						confirmLabel: "Try Again",
// 						cancelLabel: "Go to Login",
// 						closable: false,
// 						onConfirm: () =>
// 							promptEmailVerification({
// 								email,
// 								message: "Want to try resending again?",
// 								applyCooldown: true, // Restart cooldown on retry if desired
// 							}),
// 					});
// 				}, 250);
// 			}
// 		},
// 	});

// 	// Handle DOM manipulation for routing and countdown after modal mounts
// 	setTimeout(() => {
// 		const cancelBtn = document.getElementById("modal-cancel-btn");
// 		const confirmBtn = document.getElementById("modal-confirm-btn");

// 		// Ensure the cancel button routes to login and clears timers
// 		cancelBtn?.addEventListener("click", () => {
// 			if (resendCooldownTimer) clearInterval(resendCooldownTimer);
// 			router.navigate("/auth/login");
// 		});

// 		// Apply the 120s cooldown lock
// 		if (applyCooldown && confirmBtn) {
// 			let timeLeft = 60;
// 			confirmBtn.disabled = true;
// 			confirmBtn.innerHTML = `Resend Email (${timeLeft}s)`;

// 			resendCooldownTimer = setInterval(() => {
// 				timeLeft -= 1;

// 				if (timeLeft <= 0) {
// 					clearInterval(resendCooldownTimer);
// 					confirmBtn.disabled = false;
// 					confirmBtn.innerHTML = `Resend Email`;
// 				} else {
// 					confirmBtn.innerHTML = `Resend Email (${timeLeft}s)`;
// 				}
// 			}, 1000);
// 		}
// 	}, 50);
// };
