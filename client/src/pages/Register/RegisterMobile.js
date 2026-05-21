import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Register.styles.css";
import { appConfig } from "@zecco/config/app.config";

/**
 * RegisterMobile — Mobile register view
 *
 * Full-viewport single-column layout.
 * Same step routing as desktop: ?step=1 | 2 | 3
 * Direction-aware slide: register.events.js sets
 * data-dir="forward" | "back" on .reg-slide-container
 * before replacing content — CSS animates accordingly.
 *
 * @async
 * @param {Object} props
 * @param {number} props.step
 * @param {string} props.dir
 * @param {Object} props.draft
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const RegisterMobile = async ({
	step = 1,
	dir = "forward",
	draft = {},
	ctx,
}) => {
	const root = new CreateElement("section");
	root.addClass("reg-mob-page").setId("register-page-mobile");

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

	// ── Step 1 ───────────────────────────────────────────────
	const step1 = () => `
		<div class="reg-slide" data-step="1">
			<h2 class="reg-heading">Create account</h2>
			<p class="reg-sub">Join the community. Share your sound.</p>

			<div class="reg-oauth">
				<a href="${appConfig.API_BASE_URL}/oauth/google" class="reg-oauth-btn" id="reg-mob-google-btn">
					<i class="bi bi-google"></i> Continue with Google
				</a>
				<a href="${appConfig.API_BASE_URL}/oauth/github" class="reg-oauth-btn" id="reg-mob-github-btn">
					<i class="bi bi-github"></i> Continue with GitHub
				</a>
			</div>

			<div class="reg-divider">
				<span class="reg-divider-line"></span>
				<span class="reg-divider-text">or with email</span>
				<span class="reg-divider-line"></span>
			</div>

			<div class="reg-form" id="reg-mob-form-1">
				<div class="reg-field">
					<label class="reg-label" for="reg-mob-firstname">First name</label>
					<input class="reg-input" id="reg-mob-firstname" type="text"
						placeholder="Ada" autocomplete="given-name"
						value="${draft.firstName ?? ""}" />
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-lastname">Last name</label>
					<input class="reg-input" id="reg-mob-lastname" type="text"
						placeholder="Lovelace" autocomplete="family-name"
						value="${draft.lastName ?? ""}" />
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-username">Username</label>
					<div class="reg-input-prefix-wrap">
						<span class="reg-input-prefix">@</span>
						<input class="reg-input reg-input--prefix" id="reg-mob-username" type="text"
							placeholder="adalovelace" autocomplete="username"
							value="${draft.username ?? ""}" />
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-email">Email address</label>
					<input class="reg-input" id="reg-mob-email" type="email"
						placeholder="ada@example.com" autocomplete="email"
						value="${draft.email ?? ""}" />
				</div>

				<div class="reg-field-error hidden" id="reg-mob-step1-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-mob-step1-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-mob-next-1" type="button">
					Continue <i class="bi bi-arrow-right"></i>
				</button>
			</div>

			<p class="reg-switch">
				Already have an account? <a href="/auth/login" data-replace>Sign in</a>
			</p>
		</div>
	`;

	// ── Step 2 ───────────────────────────────────────────────
	const step2 = () => `
		<div class="reg-slide" data-step="2">
			<button class="reg-back-btn" id="reg-mob-back-2" type="button">
				<i class="bi bi-arrow-left"></i> Back
			</button>

			<h2 class="reg-heading">Set your password</h2>
			<p class="reg-sub">Make it strong. You can always reset it later.</p>

			<div class="reg-form" id="reg-mob-form-2">
				<div class="reg-field">
					<label class="reg-label" for="reg-mob-pwd">Password</label>
					<div class="reg-input-eye-wrap">
						<input class="reg-input" id="reg-mob-pwd" type="password"
							placeholder="Create a password" autocomplete="new-password" />
						<button class="reg-eye-btn" id="reg-mob-pwd-eye" type="button"
							aria-label="Toggle visibility">
							<i class="bi bi-eye"></i>
						</button>
					</div>
					<div class="reg-strength" id="reg-mob-strength">
						<div class="reg-strength-bars">
							<div class="reg-strength-bar" id="reg-mob-rsb-1"></div>
							<div class="reg-strength-bar" id="reg-mob-rsb-2"></div>
							<div class="reg-strength-bar" id="reg-mob-rsb-3"></div>
							<div class="reg-strength-bar" id="reg-mob-rsb-4"></div>
						</div>
						<span class="reg-strength-label" id="reg-mob-strength-label">Enter a password</span>
					</div>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-pwd-confirm">Confirm password</label>
					<div class="reg-input-eye-wrap">
						<input class="reg-input" id="reg-mob-pwd-confirm" type="password"
							placeholder="Repeat your password" autocomplete="new-password" />
						<button class="reg-eye-btn" id="reg-mob-pwd-confirm-eye" type="button"
							aria-label="Toggle visibility">
							<i class="bi bi-eye"></i>
						</button>
					</div>
				</div>

				<div class="reg-field-error hidden" id="reg-mob-step2-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-mob-step2-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-mob-next-2" type="button">
					Continue <i class="bi bi-arrow-right"></i>
				</button>
			</div>
		</div>
	`;

	// ── Step 3 ───────────────────────────────────────────────
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
			<button class="reg-back-btn" id="reg-mob-back-3" type="button">
				<i class="bi bi-arrow-left"></i> Back
			</button>

			<h2 class="reg-heading">Almost there</h2>
			<p class="reg-sub">Help us personalise your experience.</p>

			<div class="reg-form" id="reg-mob-form-3">
				<div class="reg-field">
					<label class="reg-label" for="reg-mob-dob">Date of birth</label>
					<input class="reg-input" id="reg-mob-dob" type="date"
						value="${draft.dob ?? ""}" />
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-gender">Gender</label>
					<select class="reg-input reg-select" id="reg-mob-gender">
						<option value="" disabled ${!draft.gender ? "selected" : ""}>Select</option>
						<option value="male"   ${draft.gender === "male" ? "selected" : ""}>Male</option>
						<option value="female" ${draft.gender === "female" ? "selected" : ""}>Female</option>
						<option value="other"  ${draft.gender === "other" ? "selected" : ""}>Other</option>
						<option value="prefer-not" ${draft.gender === "prefer-not" ? "selected" : ""}>Prefer not to say</option>
					</select>
				</div>

				<div class="reg-field">
					<label class="reg-label" for="reg-mob-country">Country</label>
					<select class="reg-input reg-select" id="reg-mob-country">
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
					<label class="reg-label">
						Favourite genres
						<span class="reg-label-hint">(up to 5)</span>
					</label>
					<div class="reg-genre-grid" id="reg-mob-genre-grid">
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
					<input type="checkbox" id="reg-mob-terms-check" class="reg-checkbox"
						${draft.termsAccepted ? "checked" : ""} />
					<label for="reg-mob-terms-check" class="reg-terms-label">
						I agree to the
						<a href="/terms" target="_blank" class="reg-terms-link">Terms of Service</a>
						and
						<a href="/privacy" target="_blank" class="reg-terms-link">Privacy Policy</a>
					</label>
				</div>

				<div class="reg-field-error hidden" id="reg-mob-step3-error">
					<i class="bi bi-exclamation-circle"></i>
					<span id="reg-mob-step3-error-msg"></span>
				</div>

				<button class="reg-submit-btn" id="reg-mob-submit" type="button">
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
		<div class="reg-mob-layout">

			<!-- Top bar: brand + home link -->
			<div class="reg-mob-topbar">
				<div class="reg-mob-brand">
					<div class="reg-mob-brand-icon">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<span class="reg-mob-brand-name">Soniq<span>Stream</span></span>
				</div>
				<a href="/" class="reg-mob-home-link" data-replace>
					<i class="bi bi-arrow-left"></i> Home
				</a>
			</div>

			${stepIndicator()}

			<!-- Slide container -->
			<div class="reg-slide-container" id="reg-mob-slide-container"
				data-step="${step}" data-dir="${dir}">
				${getStepContent()}
			</div>

		</div>
	`),
	);

	return root.getElement();
};
