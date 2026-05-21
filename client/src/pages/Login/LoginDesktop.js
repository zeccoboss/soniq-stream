import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Login.styles.css";
import { appConfig } from "@zecco/config/app.config";

/**
 * LoginDesktop — Desktop login view
 *
 * States:
 *   idle     → default form
 *   loading  → submit in progress, button disabled
 *   error    → invalid credentials or network failure
 *
 * Two-column layout matching Register:
 *   Left  → branded panel (same visual identity)
 *   Right → form panel
 *
 * @async
 * @param {Object} props
 * @param {string} props.state   — "idle" | "loading" | "error"
 * @param {string} props.error   — error message string
 * @param {Object} props.draft   — { email } persisted from sessionStorage
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const LoginDesktop = async ({
	state = "idle",
	error = "",
	draft = {},
	ctx,
}) => {
	const root = new CreateElement("section");
	root.addClass("login-page").setId("login-page");

	root.append(
		buildNode(`
		<div class="login-layout">

			<!-- ── Branded left panel ── -->
			<div class="login-brand-panel">
				<div class="login-brand-content">
					<div class="login-brand-icon">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<h1 class="login-brand-name">Soniq<span>Stream</span></h1>
					<p class="login-brand-tag">
						Upload, discover and share African music
						with a global community of artists and fans.
					</p>
					<div class="login-brand-pills">
						<span class="login-brand-pill"><i class="bi bi-cloud-upload"></i> Upload Tracks</span>
						<span class="login-brand-pill"><i class="bi bi-people"></i> Follow Artists</span>
						<span class="login-brand-pill"><i class="bi bi-heart"></i> Like &amp; Share</span>
						<span class="login-brand-pill"><i class="bi bi-headphones"></i> Stream Free</span>
					</div>
				</div>
				<div class="login-vinyl" aria-hidden="true"></div>
			</div>

			<!-- ── Form right panel ── -->
			<div class="login-form-panel">
				<a href="/" class="login-home-link" data-replace>
					<i class="bi bi-arrow-left"></i> Home
				</a>

				<div class="login-form-body" id="login-form-body">

					<div class="login-form-head">
						<h2 class="login-heading">Welcome back</h2>
						<p class="login-sub">Sign in to continue to your account.</p>
					</div>

					<!-- OAuth -->
					<div class="login-oauth">
						<a href="${appConfig.API_BASE_URL}/oauth/google" class="login-oauth-btn" id="login-google-btn"
							${state === "loading" ? "disabled" : ""}>
							<i class="bi bi-google"></i> Continue with Google
						</a>
						<a href="${appConfig.API_BASE_URL}/oauth/github" class="login-oauth-btn" id="login-github-btn"
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
					<div class="login-form" id="login-form">

						<div class="login-field">
							<label class="login-label" for="login-email">Email address</label>
							<input
								class="login-input ${state === "error" ? "login-input--error" : ""}"
								id="login-email"
								type="email"
								placeholder="ada@example.com"
								autocomplete="email"
								value="${draft.email ?? ""}"
								${state === "loading" ? "disabled" : ""}
							/>
						</div>

						<div class="login-field">
							<div class="login-label-row">
								<label class="login-label" for="login-pwd">Password</label>
								<a href="/auth/forgot-password" class="login-forgot">Forgot password?</a>
							</div>
							<div class="login-input-eye-wrap">
								<input
									class="login-input ${state === "error" ? "login-input--error" : ""}"
									id="login-pwd"
									type="password"
									placeholder="Enter your password"
									autocomplete="current-password"
									${state === "loading" ? "disabled" : ""}
								/>
								<button class="login-eye-btn" id="login-eye-btn" type="button"
									aria-label="Toggle password visibility">
									<i class="bi bi-eye"></i>
								</button>
							</div>
						</div>

						<!-- Error message -->
						<div class="login-error ${state === "error" && error ? "" : "hidden"}"
							id="login-error-msg" role="alert">
							<i class="bi bi-exclamation-circle"></i>
							<span>${error || ""}</span>
						</div>

						<!-- Submit -->
						<button
							class="login-submit-btn ${state === "loading" ? "login-submit-btn--loading" : ""}"
							id="login-submit-btn"
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

		</div>
	`),
	);

	return root.getElement();
};
