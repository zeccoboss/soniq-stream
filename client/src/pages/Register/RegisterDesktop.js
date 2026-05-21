import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Register.styles.css";
import { appConfig } from "@zecco/config/app.config";

/**
 * RegisterDesktop — Desktop register view
 *
 * Two-column layout: branded left panel + form right panel.
 * Step routing via URL: ?step=1 | 2 | 3
 * Direction-aware slide animation injected by register.events.js
 * via data-direction="forward" | "back" on the slide wrapper.
 *
 * Steps:
 *   1 → name + username + email  (+ OAuth options)
 *   2 → password + confirm + strength meter
 *   3 → DOB + gender + country + genre picks + terms
 *
 * @async
 * @param {Object} props
 * @param {number} props.step   — current step (1 | 2 | 3)
 * @param {string} props.dir    — slide direction "forward" | "back"
 * @param {Object} props.draft  — persisted form values from sessionStorage
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const RegisterDesktop = async ({
	step = 1,
	dir = "forward",
	draft = {},
	ctx,
}) => {
	const root = new CreateElement("section");
	root.addClass("reg-page").setId("register-page");

	// ── Step indicator ───────────────────────────────────────
	const stepIndicator = () => `
		<div class="reg-steps" aria-label="Registration progress">
			${[1, 2, 3]
				.map(
					(n) => `
				<div class="reg-step ${n === step ? "active" : n < step ? "done" : ""}"
					aria-label="Step ${n}"></div>
			`,
				)
				.join("")}
		</div>
	`;

	// ── Step 1 — Identity ────────────────────────────────────
	const step1 = () => `
		<div class="reg-slide" data-step="1">
			<h2 class="reg-heading">Create your account</h2>
			<p class="reg-sub">Join the community. Share your sound.</p>

			<!-- OAuth -->
			<div class="reg-oauth">
				<a href="${appConfig.API_BASE_URL}/oauth/google" class="reg-oauth-btn" id="reg-google-btn">
					<i class="bi bi-google"></i> Continue with Google
				</a>
				<a href="${appConfig.API_BASE_URL}/oauth/github" class="reg-oauth-btn" id="reg-github-btn">
					<i class="bi bi-github"></i> Continue with GitHub
				</a>
			</div>

			<div class="reg-divider">
				<span class="reg-divider-line"></span>
				<span class="reg-divider-text">or with email</span>
				<span class="reg-divider-line"></span>
			</div>

			<div class="reg-form" id="reg-form-1">
				<div class="reg-row">
					<div class="reg-field">
						<label class="reg-label" for="reg-firstname">First name</label>
						<input class="reg-input" id="reg-firstname" type="text"
							placeholder="Ada" autocomplete="given-name"
							value="${draft.firstName ?? ""}" />
					</div>
					<div class="reg-field">
						<label class="reg-label" for="reg-lastname">Last name</label>
						<input class="reg-input" id="reg-lastname" type="text"
							placeholder="Lovelace" autocomplete="family-name"
							value="${draft.lastName ?? ""}" />
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-username">Username</label>
					<div class="reg-input-prefix-wrap">
						<span class="reg-input-prefix">@</span>
						<input class="reg-input reg-input--prefix" id="reg-username" type="text"
							placeholder="adalovelace" autocomplete="username"
							value="${draft.username ?? ""}" />
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-email">Email address</label>
					<input class="reg-input" id="reg-email" type="email"
						placeholder="ada@example.com" autocomplete="email"
						value="${draft.email ?? ""}" />
				</div>

				<div class="reg-field-error hidden" id="reg-step1-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-step1-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-next-1" type="button">
					Continue <i class="bi bi-arrow-right"></i>
				</button>
			</div>

			<p class="reg-switch">
				Already have an account? <a href="/auth/login" data-replace>Sign in</a>
			</p>
		</div>
	`;

	// ── Step 2 — Password ────────────────────────────────────
	const step2 = () => `
		<div class="reg-slide" data-step="2">
			<button class="reg-back-btn" id="reg-back-2" type="button">
				<i class="bi bi-arrow-left"></i> Back
			</button>

			<h2 class="reg-heading">Set your password</h2>
			<p class="reg-sub">Make it strong. You can always reset it later.</p>

			<div class="reg-form" id="reg-form-2">
				<div class="reg-field">
					<label class="reg-label" for="reg-pwd">Password</label>
					<div class="reg-input-eye-wrap">
						<input class="reg-input" id="reg-pwd" type="password"
							placeholder="Create a password" autocomplete="new-password" />
						<button class="reg-eye-btn" id="reg-pwd-eye" type="button"
							aria-label="Toggle password visibility">
							<i class="bi bi-eye"></i>
						</button>
					</div>
					<!-- Strength meter -->
					<div class="reg-strength" id="reg-strength">
						<div class="reg-strength-bars">
							<div class="reg-strength-bar" id="rsb-1"></div>
							<div class="reg-strength-bar" id="rsb-2"></div>
							<div class="reg-strength-bar" id="rsb-3"></div>
							<div class="reg-strength-bar" id="rsb-4"></div>
						</div>
						<span class="reg-strength-label" id="reg-strength-label">Enter a password</span>
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-pwd-confirm">Confirm password</label>
					<div class="reg-input-eye-wrap">
						<input class="reg-input" id="reg-pwd-confirm" type="password"
							placeholder="Repeat your password" autocomplete="new-password" />
						<button class="reg-eye-btn" id="reg-pwd-confirm-eye" type="button"
							aria-label="Toggle password visibility">
							<i class="bi bi-eye"></i>
						</button>
					</div>
				</div>

				<div class="reg-field-error hidden" id="reg-step2-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-step2-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-next-2" type="button">
					Continue <i class="bi bi-arrow-right"></i>
				</button>
			</div>
		</div>
	`;

	// ── Step 3 — Profile preferences ────────────────────────
	const GENRES = [
		"Afrobeats",
		"Highlife",
		"Amapiano",
		"Gospel",
		"Hip-Hop",
		"Afropop",
		"R&B",
		"Reggae",
		"Jazz",
		"Electronic",
		"Classical",
		"Rock",
	];

	const step3 = () => `
		<div class="reg-slide" data-step="3">
			<button class="reg-back-btn" id="reg-back-3" type="button">
				<i class="bi bi-arrow-left"></i> Back
			</button>

			<h2 class="reg-heading">Almost there</h2>
			<p class="reg-sub">Tell us a bit about yourself so we can personalise your experience.</p>

			<div class="reg-form" id="reg-form-3">
				<div class="reg-row">
					<div class="reg-field">
						<label class="reg-label" for="reg-dob">Date of birth</label>
						<input class="reg-input" id="reg-dob" type="date"
							value="${draft.dob ?? ""}" />
					</div>
					<div class="reg-field">
						<label class="reg-label" for="reg-gender">Gender</label>
						<select class="reg-input reg-select" id="reg-gender">
							<option value="" disabled ${!draft.gender ? "selected" : ""}>Select</option>
							<option value="male"   ${draft.gender === "male" ? "selected" : ""}>Male</option>
							<option value="female" ${draft.gender === "female" ? "selected" : ""}>Female</option>
							<option value="other"  ${draft.gender === "other" ? "selected" : ""}>Other</option>
							<option value="prefer-not" ${draft.gender === "prefer-not" ? "selected" : ""}>Prefer not to say</option>
						</select>
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-country">Country</label>
					<select class="reg-input reg-select" id="reg-country">
						<option value="" disabled ${!draft.country ? "selected" : ""}>Select country</option>
						<option value="NG" ${draft.country === "NG" ? "selected" : ""}>Nigeria</option>
						<option value="GH" ${draft.country === "GH" ? "selected" : ""}>Ghana</option>
						<option value="KE" ${draft.country === "KE" ? "selected" : ""}>Kenya</option>
						<option value="ZA" ${draft.country === "ZA" ? "selected" : ""}>South Africa</option>
						<option value="GB" ${draft.country === "GB" ? "selected" : ""}>United Kingdom</option>
						<option value="US" ${draft.country === "US" ? "selected" : ""}>United States</option>
						<option value="other" ${draft.country === "other" ? "selected" : ""}>Other</option>
					</select>
				</div>

				<div class="reg-field">
					<label class="reg-label">Favourite genres
						<span class="reg-label-hint">(pick up to 5)</span>
					</label>
					<div class="reg-genre-grid" id="reg-genre-grid">
						${GENRES.map(
							(g) => `
							<button type="button"
								class="reg-genre-chip ${(draft.genres ?? []).includes(g) ? "selected" : ""}"
								data-genre="${g}">${g}</button>
						`,
						).join("")}
					</div>
				</div>

				<div class="reg-terms">
					<input type="checkbox" id="reg-terms-check" class="reg-checkbox"
						${draft.termsAccepted ? "checked" : ""} />
					<label for="reg-terms-check" class="reg-terms-label">
						I agree to the
						<a href="/terms" target="_blank" class="reg-terms-link">Terms of Service</a>
						and
						<a href="/privacy" target="_blank" class="reg-terms-link">Privacy Policy</a>
					</label>
				</div>

				<div class="reg-field-error hidden" id="reg-step3-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-step3-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-submit" type="button">
					<i class="bi bi-check-lg"></i> Create Account
				</button>
			</div>
		</div>
	`;

	const getStepContent = () => {
		switch (step) {
			case 2:
				return step2();
			case 3:
				return step3();
			default:
				return step1();
		}
	};

	root.append(
		buildNode(`
		<div class="reg-layout">

			<!-- ── Branded left panel ── -->
			<div class="reg-brand-panel">
				<div class="reg-brand-content">
					<div class="reg-brand-icon">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<h1 class="reg-brand-name">Soniq<span>Stream</span></h1>
					<p class="reg-brand-tag">
						Upload, discover and share African music
						with a global community of artists and fans.
					</p>
					<div class="reg-brand-pills">
						<span class="reg-brand-pill"><i class="bi bi-cloud-upload"></i> Upload Tracks</span>
						<span class="reg-brand-pill"><i class="bi bi-people"></i> Follow Artists</span>
						<span class="reg-brand-pill"><i class="bi bi-heart"></i> Like & Share</span>
						<span class="reg-brand-pill"><i class="bi bi-headphones"></i> Stream Free</span>
					</div>
				</div>
				<!-- Decorative spinning vinyl -->
				<div class="reg-vinyl" aria-hidden="true"></div>
			</div>

			<!-- ── Form right panel ── -->
			<div class="reg-form-panel">
				<a href="/" class="reg-home-link" data-replace>
					<i class="bi bi-arrow-left"></i> Home
				</a>

				${stepIndicator()}

				<!-- Slide container — direction class added by register.events.js -->
				<div class="reg-slide-container" id="reg-slide-container"
					data-step="${step}" data-dir="${dir}">
					${getStepContent()}
				</div>
			</div>

		</div>
	`),
	);

	return root.getElement();
};
