// client/src/features/register/register.events.js
import { debounce } from "@zecco/constant/debounce.js";
import { authService } from "@zecco/services/api/auth.service.js";
import { showModal } from "@zecco/components/Modal/Modal.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { router } from "@zecco/routes/router.js";
import { promptEmailVerification } from "./register.helpers";

// --- Regex Helpers ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPER = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export const registerEvents = (
	root,
	{ step, draft, saveDraft, clearDraft, goToStep },
) => {
	const clearFieldHighlights = () => {
		root
			.querySelectorAll(
				".reg-input--error, .reg-input--warning, .reg-checkbox--error, .reg-genre-grid--error",
			)
			.forEach((el) =>
				el.classList.remove(
					"reg-input--error",
					"reg-input--warning",
					"reg-checkbox--error",
					"reg-genre-grid--error",
				),
			);
	};

	const highlightFields = (selectors = [], tone = "error") => {
		const className = tone === "warning" ? "reg-input--warning" : "reg-input--error";
		for (const selector of selectors) {
			root.querySelectorAll(selector).forEach((el) => {
				if (selector.includes("terms-check")) {
					el.classList.add("reg-checkbox--error");
					return;
				}
				if (selector.includes("genre-grid")) {
					el.classList.add("reg-genre-grid--error");
					return;
				}
				el.classList.add(className);
			});
		}
	};

	// ── Helper: UI Error Display ──────────────────────────────────────────
	const showError = (message, selectors = [], tone = "error") => {
		clearFieldHighlights();
		highlightFields(selectors, tone);
		const errorBox = root.querySelector(
			`#reg-step${step}-error, #reg-mob-step${step}-error`,
		);
		const errorText = root.querySelector(
			`#reg-step${step}-error-msg, #reg-mob-step${step}-error-msg`,
		);
		if (errorBox && errorText) {
			errorText.textContent = message;
			errorBox.classList.remove("hidden");
		}
	};

	const clearError = () => {
		const errorBox = root.querySelector(
			`#reg-step${step}-error, #reg-mob-step${step}-error`,
		);
		if (errorBox) errorBox.classList.add("hidden");
		clearFieldHighlights();
	};

	// ── Helper: Map ID to Draft Key ───────────────────────────────────────
	const getKeyFromId = (id) => {
		const base = id.replace("reg-mob-", "").replace("reg-", "");
		const map = {
			firstname: "firstName",
			lastname: "lastName",
			username: "username",
			email: "email",
			dob: "dob",
			gender: "gender",
			country: "country",
		};
		return map[base] || null;
	};

	// ── 1. Global Input Saving (Debounced) ────────────────────────────────
	root.querySelectorAll(".reg-input").forEach((input) => {
		input.addEventListener(
			"input",
			debounce((e) => {
				clearError();
				const key = getKeyFromId(e.target.id);

				// SECURITY: Never save passwords to sessionStorage on input
				if (key && e.target.type !== "password") {
					saveDraft({ [key]: e.target.value });
				}
			}, 300),
		);
	});

	// ── 2. Step Specific Logic ────────────────────────────────────────────

	if (step === 1) {
		const nextBtn = root.querySelector("#reg-next-1, #reg-mob-next-1");

		nextBtn?.addEventListener("click", () => {
			const { firstName, lastName, username, email } = draft;

			if (!firstName || !lastName || !username || !email) {
				return showError("Please fill out all fields.", [
					"#reg-firstname, #reg-mob-firstname",
					"#reg-lastname, #reg-mob-lastname",
					"#reg-username, #reg-mob-username",
					"#reg-email, #reg-mob-email",
				]);
			}
			if (username.length < 3) {
				return showError("Username must be at least 3 characters.", [
					"#reg-username, #reg-mob-username",
				]);
			}
			if (!EMAIL_REGEX.test(email)) {
				return showError("Please enter a valid email address.", [
					"#reg-email, #reg-mob-email",
				]);
			}

			goToStep(2);
		});
	}

	if (step === 2) {
		const pwdInput = root.querySelector("#reg-pwd, #reg-mob-pwd");
		const confirmInput = root.querySelector(
			"#reg-pwd-confirm, #reg-mob-pwd-confirm",
		);
		const nextBtn = root.querySelector("#reg-next-2, #reg-mob-next-2");
		const backBtn = root.querySelector("#reg-back-2, #reg-mob-back-2");

		// Password Visibility Toggle
		root.querySelectorAll(".reg-eye-btn").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const input = e.currentTarget.previousElementSibling;
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

		// Password Strength Meter
		pwdInput?.addEventListener("input", (e) => {
			const val = e.target.value.trim();
			let score = 0;

			if (val.length >= 8) score++;
			if (HAS_UPPER.test(val)) score++;
			if (HAS_NUMBER.test(val)) score++;
			if (HAS_SPECIAL.test(val)) score++;

			const prefix = root.querySelector("#reg-pwd")
				? "rsb-"
				: "reg-mob-rsb-";
			const label = root.querySelector(
				"#reg-strength-label, #reg-mob-strength-label",
			);
			const bars = [1, 2, 3, 4].map((i) =>
				root.querySelector(`#${prefix}${i}`),
			);

			bars.forEach((bar) => {
				if (bar) bar.className = "reg-strength-bar";
			});

			let colorClass =
				score < 2 ? "weak" : score === 3 ? "medium" : "strong";
			let labelText =
				score === 0
					? "Enter a password"
					: score < 2
						? "Weak"
						: score === 3
							? "Good"
							: "Strong";

			for (let i = 0; i < score; i++) {
				if (bars[i]) bars[i].classList.add(colorClass);
			}

			if (label) {
				label.textContent = labelText;
				label.className = `reg-strength-label ${score > 0 ? colorClass : ""}`;
			}
		});

		backBtn?.addEventListener("click", () => goToStep(1));

		nextBtn?.addEventListener("click", () => {
			const pwd = pwdInput.value.trim();
			const confirm = confirmInput.value.trim();

			if (pwd.length < 8)
				return showError(
					"Password must be at least 8 characters.",
					["#reg-pwd, #reg-mob-pwd"],
					"warning",
				);
			if (pwd !== confirm)
				return showError("Passwords do not match.", [
					"#reg-pwd-confirm, #reg-mob-pwd-confirm",
				]);

			if (!HAS_UPPER.test(pwd) || !HAS_NUMBER.test(pwd)) {
				return showError(
					"Password must include an uppercase letter and a number.",
					["#reg-pwd, #reg-mob-pwd"],
					"warning",
				);
			}

			// FIX: Save verified password to state right before moving to step 3.
			// By using saveDraft, the overarching component's state receives it.
			draft.password = pwd;
			saveDraft({ password: pwd });
			goToStep(3);
		});
	}

	if (step === 3) {
		const backBtn = root.querySelector("#reg-back-3, #reg-mob-back-3");
		const submitBtn = root.querySelector("#reg-submit, #reg-mob-submit");
		const termsCheck = root.querySelector(
			"#reg-terms-check, #reg-mob-terms-check",
		);
		const selects = root.querySelectorAll("select.reg-input");

		// Capture Select Changes
		selects.forEach((select) => {
			select.addEventListener("change", (e) => {
				const key = getKeyFromId(e.target.id);
				if (key) saveDraft({ [key]: e.target.value.trim() });
			});
		});

		// Genre Chip Interaction
		root.querySelectorAll(".reg-genre-chip").forEach((chip) => {
			chip.addEventListener("click", (e) => {
				const genre = e.target.dataset.genre;
				let currentGenres = draft.genres || [];

				if (currentGenres.includes(genre)) {
					currentGenres = currentGenres.filter((g) => g !== genre);
					e.target.classList.remove("selected");
				} else if (currentGenres.length < 5) {
					currentGenres.push(genre);
					e.target.classList.add("selected");
				}
				saveDraft({ genres: currentGenres });
			});
		});

		// Terms Checkbox
		termsCheck?.addEventListener("change", (e) => {
			saveDraft({ termsAccepted: e.target.checked });
		});

		backBtn?.addEventListener("click", () => goToStep(2));

		// Final Submit
		submitBtn?.addEventListener("click", async () => {
			// FIX: Added password to the destructured draft variables
			const { dob, country, genres, termsAccepted, email, password } = draft;

			// FIX: Catch if password was lost (e.g. page refresh)
			if (!password)
				return showError(
					"Password missing. Please go back to step 2 and re-enter it.",
					["#reg-pwd, #reg-mob-pwd"],
				);

			if (!dob || !country)
				return showError("Please provide your date of birth and country.", [
					"#reg-dob, #reg-mob-dob",
					"#reg-country, #reg-mob-country",
				]);
			if (!genres || genres.length === 0)
				return showError(
					"Please pick at least one genre.",
					["#reg-genre-grid, #reg-mob-genre-grid"],
					"warning",
				);
			if (!termsAccepted)
				return showError("You must accept the Terms of Service.", [
					"#reg-terms-check, #reg-mob-terms-check",
				]);

			try {
				// UI Loading State
				submitBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Creating account...`;
				submitBtn.disabled = true;

				// Inside your frontend form submit handler
				const cleanUserData = {
					...draft,
					username: draft.username.trim(),
					email: draft.email.trim(),
					firstName: draft.firstName.trim(),
					lastName: draft.lastName.trim(),
				};

				// Fire off API request and wait for the response
				const registerResult = await authService.register(cleanUserData);

				// Only clear form data after backend confirms success with a message payload
				if (!registerResult?.message) {
					throw new Error(
						"Registration response was incomplete. Please try again.",
					);
				}

				clearDraft();

				promptEmailVerification({
					email: cleanUserData.email,
					message: registerResult.message,
				});
				// Manual cancel routes to login
				document
					.getElementById("modal-cancel-btn")
					?.addEventListener("click", () => {
						router.navigate("/auth/login");
					});
			} catch (error) {
				// Revert UI on failure
				submitBtn.innerHTML = `<i class="bi bi-check-lg"></i> Create Account`;
				submitBtn.disabled = false;

				toast({
					message:
						error.message || "Registration failed. Please try again.",
					type: "error",
				});
			}
		});
	}
};
