import { authService } from "@zecco/services/api/auth.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { router } from "@zecco/routes/router.js";
import {
	validatePassword,
	validateEmail,
	getPasswordStrength,
} from "./password.validator.js";
import { debounce } from "@zecco/constant/debounce.js";

export const passwordEvents = (
	root,
	{ step, state, setState, goToStep, draft, saveDraft, clearDraft },
) => {
	// ── Helper: Show Error Message ────────────────────────────
	const showError = (message) => {
		const errorBox = root.querySelector(
			`#pwd-step${step}-error, #pwd-mob-step${step}-error`,
		);
		if (errorBox) {
			errorBox.querySelector("span").textContent = message;
			errorBox.classList.remove("hidden");
		}
	};

	const clearError = () => {
		const errorBox = root.querySelector(
			`#pwd-step${step}-error, #pwd-mob-step${step}-error`,
		);
		if (errorBox) errorBox.classList.add("hidden");
	};

	// ── STEP 1: Email Input ──────────────────────────────────────
	if (step === 1) {
		// Auto-save email draft on input
		const emailInput = root.querySelector("#pwd-email, #pwd-mob-email");
		emailInput?.addEventListener(
			"input",
			debounce((e) => {
				clearError();
				saveDraft({ email: e.target.value });
			}, 300),
		);

		// Send reset link button
		const sendBtn = root.querySelector("#pwd-send-btn, #pwd-mob-send-btn");
		sendBtn?.addEventListener("click", async () => {
			const email = root.querySelector("#pwd-email, #pwd-mob-email")?.value;

			// Validate email
			const validation = validateEmail(email);
			if (!validation.isValid) {
				return showError(validation.message);
			}

			try {
				clearError();
				await setState("loading");

				// Send reset email
				await authService.forgotPassword({ email });

				// Save email and navigate to step 2
				saveDraft({ email });
				goToStep(2);
			} catch (err) {
				setState("error", err.message || "Failed to send email.");
			}
		});
	}

	// ── STEP 2: Check Inbox (Resend Logic) ───────────────────────
	if (step === 2) {
		const resendBtn = root.querySelector(
			"#pwd-resend-btn, #pwd-mob-resend-btn",
		);
		const countdownEl = root.querySelector(
			"#pwd-countdown, #pwd-mob-countdown",
		);
		const backBtn = root.querySelector(
			"#pwd-back-to-email, #pwd-mob-back-to-email",
		);

		let cooldownSeconds = 0;

		const updateCountdown = () => {
			if (cooldownSeconds > 0) {
				countdownEl?.classList.remove("hidden");
				countdownEl.textContent = `(${cooldownSeconds}s)`;
				cooldownSeconds--;
				setTimeout(updateCountdown, 1000);
			} else {
				countdownEl?.classList.add("hidden");
				resendBtn.disabled = false;
			}
		};

		resendBtn?.addEventListener("click", async () => {
			if (cooldownSeconds > 0) return;

			const email =
				draft.email ||
				root.querySelector("#pwd-email, #pwd-mob-email")?.value;

			try {
				resendBtn.disabled = true;
				await authService.forgotPassword({ email });
				cooldownSeconds = 60;
				updateCountdown();
				toast({
					message: "Email resent! Check your inbox.",
					type: "success",
				});
			} catch (err) {
				resendBtn.disabled = false;
				toast({
					message: err.message || "Failed to resend email.",
					type: "error",
				});
			}
		});

		backBtn?.addEventListener("click", () => {
			clearDraft();
			goToStep(1);
		});
	}

	// ── STEP 3: New Password Input ────────────────────────────────
	if (step === 3) {
		const pwdInput = root.querySelector("#pwd-new, #pwd-mob-new");
		const confirmInput = root.querySelector("#pwd-confirm, #pwd-mob-confirm");
		const updateBtn = root.querySelector(
			"#pwd-update-btn, #pwd-mob-update-btn",
		);
		const backBtn = root.querySelector("#pwd-back-3, #pwd-mob-back-3");

		// Password visibility toggle
		root.querySelectorAll(".pwd-eye-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const wrapper = e.target.closest(".pwd-input-eye-wrap");
				if (!wrapper) return;
				const input = wrapper.querySelector("input");
				const icon = e.currentTarget.querySelector("i");

				if (input.type === "password") {
					input.type = "text";
					icon.className = "bi bi-eye-slash";
				} else {
					input.type = "password";
					icon.className = "bi bi-eye";
				}
			});
		});

		// Password strength meter
		pwdInput?.addEventListener("input", (e) => {
			const val = e.target.value;
			const strength = getPasswordStrength(val);

			const prefix = pwdInput.id.includes("mob") ? "psb-mob-" : "psb-";
			const label = root.querySelector(
				"#pwd-strength-label, #pwd-mob-strength-label",
			);
			const bars = [1, 2, 3, 4].map((i) =>
				root.querySelector(`#${prefix}${i}`),
			);

			// Reset all bars
			bars.forEach((bar) => {
				if (bar) bar.className = "pwd-strength-bar";
			});

			// Determine strength level
			let colorClass =
				strength < 2 ? "weak" : strength === 3 ? "medium" : "strong";
			let labelText =
				strength === 0
					? "Enter a password"
					: strength < 2
						? "Weak"
						: strength === 3
							? "Good"
							: "Strong";

			// Color filled bars
			for (let i = 0; i < strength; i++) {
				if (bars[i]) bars[i].classList.add(colorClass);
			}

			// Update label
			if (label) {
				label.textContent = labelText;
				label.className = `pwd-strength-label ${strength > 0 ? colorClass : ""}`;
			}
		});

		// Back button
		backBtn?.addEventListener("click", () => goToStep(1));

		// Update password submit
		updateBtn?.addEventListener("click", async () => {
			const pwd = pwdInput.value;
			const confirm = confirmInput.value;

			// Validate new password
			const validation = validatePassword(pwd);
			if (!validation.isValid) {
				return showError(validation.message);
			}

			// Validate passwords match
			if (pwd !== confirm) {
				return showError("Passwords do not match.");
			}

			// Get token
			const token = draft.token || sessionStorage.getItem("pwd_token");
			if (!token) {
				return showError("Session expired. Request a new reset link.");
			}

			try {
				clearError();
				await setState("loading");

				// Call API to reset password
				await authService.resetPassword({ token, password: pwd });

				// Clear draft and navigate to success
				clearDraft();
				goToStep(4);
			} catch (err) {
				// Handle expired/invalid token
				if (
					err.message.includes("expired") ||
					err.message.includes("invalid")
				) {
					clearDraft();
					goToStep(5);
				} else {
					setState("error", err.message || "Failed to reset password.");
				}
			}
		});
	}

	// ── STEP 5: Token Expired ────────────────────────────────────
	if (step === 5) {
		const requestBtn = root.querySelector(
			"#pwd-request-new-btn, #pwd-mob-request-new-btn",
		);

		requestBtn?.addEventListener("click", () => {
			clearDraft();
			goToStep(1);
		});
	}
};
