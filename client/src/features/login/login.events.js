// client/src/features/login/login.events.js
import { authService } from "@zecco/services/api/auth.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { router } from "@zecco/routes/router.js";
import { store } from "@zecco/store/store.js";
import {
	saveLoginDraft,
	clearLoginDraft,
	promptLoginVerification,
} from "./login.helpers.js";
import { appConfig } from "@zecco/config/app.config.js";
import meService from "@zecco/services/api/me.service.js";

export const loginEvents = async (root, { render }) => {
	// 1. Auto-save drafts on input
	root.addEventListener("input", (e) => {
		if (e.target.matches("#login-identifier")) {
			saveLoginDraft({ email: e.target.value });
		}
	});

	// 2. Password visibility toggle
	root.addEventListener("click", (e) => {
		// Check if the click is on the eye button or its child icon
		const toggleBtn = e.target.closest(".login-eye-btn");
		if (toggleBtn) {
			const container = toggleBtn.parentElement;
			const input = container.querySelector("input");
			const isPassword = input.type === "password";
			input.type = isPassword ? "text" : "password";
			toggleBtn.querySelector("i").className = isPassword
				? "bi bi-eye-slash"
				: "bi bi-eye";
		}
	});

	// 3. Form Submission
	const submitBtn = root.querySelector(
		"#login-submit-btn, #login-mob-submit-btn",
	);
	submitBtn?.addEventListener("click", async (e) => {
		e.preventDefault();

		const identifier = root.querySelector("#login-identifier").value.trim();
		const password = root.querySelector("#login-pwd").value;

		// Use the component's built-in error state instead of a toast
		if (!identifier || !password) {
			const field = !identifier ? "identifier" : "password";
			root.dispatchEvent(
				new CustomEvent("login-error", {
					detail: {
						message: "Please fill in all fields",
						field,
					},
				}),
			);
			return; // Stop execution
		}

		root.dispatchEvent(new CustomEvent("login-loading"));

		try {
			const loginResult = await authService.login({ identifier, password });
			store.auth.token = loginResult.accessToken;

			const me = await meService.getProfile();
			store.auth.user = me.data;

			clearLoginDraft();

			// Success toast is still good here for the transition
			toast({
				message: `Welcome back <strong>${me.data.username}</strong>!`,
				type: "success",
			});
			router.redirect("/?tab=discover");
		} catch (err) {
			// Intercept unverified accounts from the backend response
			// Adjust this condition to match exactly how your api wrapper structures error responses
			if (err.status === 403 && err.data?.email) {
				// Remove form error and stop loader since the modal is taking over
				root.dispatchEvent(
					new CustomEvent("login-error", {
						detail: { message: "", field: "" },
					}),
				);

				promptLoginVerification({
					email: err.data.email, // Passed explicitly from our updated controller[cite: 1]
					message: err.data.message || err.message, // "Email not verified. Check your inbox."[cite: 1]
				});
				return;
			}

			// Backend errors also use the component's built-in error state
			root.dispatchEvent(
				new CustomEvent("login-error", {
					detail: {
						message: err.message || "Invalid credentials",
						field: "identifier",
					},
				}),
			);
		}
	});
};
