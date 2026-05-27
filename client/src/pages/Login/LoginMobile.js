import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Login.styles.css";
import { appConfig } from "@zecco/config/app.config";

/**
 * LoginMobile — Mobile login view
 *
 * States:
 *   idle     → default form
 *   loading  → submit in progress
 *   error    → invalid credentials or network failure
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {string} props.error
 * @param {Object} props.draft   — { email }
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const LoginMobile = async ({
	state = "idle",
	error = "",
	errorField = "",
	draft = {},
	formValues = {},
	ctx,
}) => {
	const root = new CreateElement("section");
	root.addClass("login-mob-page").setId("login-page-mobile");

	root.append(
		buildNode(`
		<div class="login-mob-layout">

			<!-- Top bar -->
			<div class="login-mob-topbar">
				<div class="login-mob-brand">
					<div class="login-mob-brand-icon">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<span class="login-mob-brand-name">Soniq<span>Stream</span></span>
				</div>
				<a href="/" class="login-mob-home-link" data-replace>
					<i class="bi bi-arrow-left"></i> Home
				</a>
			</div>

			<!-- Form body -->
			<div class="login-mob-form-body">

				<div class="login-form-head">
					<h2 class="login-heading">Welcome back</h2>
					<p class="login-sub">Sign in to continue to your account.</p>
				</div>

				<!-- OAuth -->
				<div class="login-oauth">
					<a href="${appConfig.API_BASE_URL}/oauth/google" class="login-oauth-btn" id="login-mob-google-btn" type="button"
						${state === "loading" ? "disabled" : ""}>
						<i class="bi bi-google"></i> Continue with Google
					</a>
					<a href="${appConfig.API_BASE_URL}/oauth/github" class="login-oauth-btn" id="login-mob-github-btn" type="button"
						${state === "loading" ? "disabled" : ""}>
						<i class="bi bi-github"></i> Continue with GitHub
					</a>
				</div>

				<div class="login-divider">
					<span class="login-divider-line"></span>
					<span class="login-divider-text">or with email</span>
					<span class="login-divider-line"></span>
				</div>

				<!-- Form -->
				<div class="login-form" id="login-mob-form">

					<div class="login-field">
						<label class="login-label" for="login-mob-email">Email address</label>
						<input
							class="login-input ${state === "error" && errorField === "identifier" ? "login-input--error" : ""}"
							id="login-identifier"
							type="email"
							placeholder="ada@example.com"
							autocomplete="email"
							value="${formValues.identifier ?? draft.email ?? ""}"
							${state === "loading" ? "disabled" : ""}
						/>
					</div>

					<div class="login-field">
						<div class="login-label-row">
							<label class="login-label" for="login-mob-pwd">Password</label>
							<a href="/auth/forgot-password" class="login-forgot">Forgot password?</a>
						</div>
						<div class="login-input-eye-wrap">
							<input
								class="login-input ${state === "error" && errorField === "password" ? "login-input--error" : ""}"
								id="login-pwd"
								type="password"
								placeholder="Enter your password"
								autocomplete="current-password"
								value="${formValues.password ?? ""}"
								${state === "loading" ? "disabled" : ""}
							/>
							<button class="login-eye-btn" id="login-mob-eye-btn" type="button"
								aria-label="Toggle password visibility">
								<i class="bi bi-eye"></i>
							</button>
						</div>
					</div>

					<!-- Error message -->
					<div class="login-error ${state === "error" && error ? "" : "hidden"}"
						id="login-mob-error-msg" role="alert">
						<i class="bi bi-exclamation-circle"></i>
						<span>${error || ""}</span>
					</div>

					<!-- Submit -->
					<button
						class="login-submit-btn ${state === "loading" ? "login-submit-btn--loading" : ""}"
						id="login-mob-submit-btn"
						type="button"
						${state === "loading" ? "disabled" : ""}
					>
						${
							state === "loading"
								? `<svg class="login-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
									<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
										stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
								</svg>
								Signing in...`
								: `Sign In <i class="bi bi-arrow-right"></i>`
						}
					</button>

				</div>

				<p class="login-switch">
					Don't have an account?
					<a href="/auth/register" data-replace>Create one</a>
				</p>

			</div>

		</div>
	`),
	);

	return root.getElement();
};
