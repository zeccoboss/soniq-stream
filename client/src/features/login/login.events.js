// client/src/features/login/login.events.js
import { authService } from "@zecco/services/api/auth.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { router } from "@zecco/routes/router.js";
import { store } from "@zecco/store/store.js";
import { saveLoginDraft, clearLoginDraft } from "./login.helpers.js";
import { appConfig } from "@zecco/config/app.config.js";

export const loginEvents = (root, { render }) => {
	// 1. Auto-save drafts on input
	root.addEventListener("input", (e) => {
		if (e.target.matches("input[name='email']")) {
			saveLoginDraft({ [e.target.name]: e.target.value });
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

		// // Check for GitHub button click
		// const githubBtn = e.target.closest("#login-github-btn");
		// if (githubBtn) {
		// 	location.href = `${appConfig.API_BASE_URL}/oauth/github_blank`;
		// }

		// // Check for Google button click
		// const googleBtn = e.target.closest("#login-google-btn");
		// if (googleBtn) {
		// 	location.href = `${appConfig.API_BASE_URL}/oauth/google`;
		// }
	});

	// 3. Form Submission
	const submitBtn = root.querySelector(
		"#login-submit-btn, #login-mob-submit-btn",
	);
	submitBtn?.addEventListener("click", async () => {
		const email = root.querySelector("#login-email").value;
		const password = root.querySelector("#login-pwd").value;

		// Use the component's built-in error state instead of a toast
		if (!email || !password) {
			root.dispatchEvent(
				new CustomEvent("login-error", {
					detail: "Please fill in all fields",
				}),
			);
			return; // Stop execution
		}

		root.dispatchEvent(new CustomEvent("login-loading"));

		try {
			const response = await authService.login({ email, password });

			store.setAuth(response.data.user, response.data.token);
			clearLoginDraft();

			// Success toast is still good here for the transition
			toast({ message: "Welcome back!", type: "success" });
			router.navigate("/");
		} catch (err) {
			// Backend errors also use the component's built-in error state
			root.dispatchEvent(
				new CustomEvent("login-error", {
					detail: err.message || "Invalid credentials",
				}),
			);
		}
	});
};
