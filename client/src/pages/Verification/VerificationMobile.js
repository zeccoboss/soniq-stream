import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./Verification.styles.css";

/**
 * VerificationMobile — Mobile verification view
 *
 * Pure view — receives state and renders accordingly.
 * All logic lives in VerificationPage.js.
 *
 * States:
 *   verifying → spinner
 *   success   → confirmed, tab auto-closes
 *   error     → token invalid / expired
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {string} props.type   — "reset" | "register"
 * @param {string} props.error
 * @param {Object} props.ctx
 * @returns {Promise<Element>}
 */
export const VerificationMobile = async ({
	state = "verifying",
	type = "register",
	error = "",
	ctx,
}) => {
	const root = new CreateElement("section");
	root.addClass("verify-mob-page").setId("verify-page-mobile");

	// ── State factories ──────────────────────────────────────

	const verifyingState = () =>
		`
			<div class="verify-mob-card" data-content="verifying">
				<div class="verify-spinner-wrap">
					<svg class="verify-spinner" width="36" height="36" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
							stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
					</svg>
				</div>
				<h2 class="verify-title">Verifying your link</h2>
				<p class="verify-sub">Hang tight — this only takes a second.</p>
			</div>
		`;

	const successState = () => {
		const isReset = type === "reset";
		return `
			<div class="verify-mob-card" data-content="success">
				<div class="verify-success-ring ${isReset ? "verify-success-ring--purple" : ""}">
					<i class="bi ${isReset ? "bi-shield-check" : "bi-envelope-check"}"></i>
				</div>
				<h2 class="verify-title">
					${isReset ? "Identity confirmed" : "Email verified!"}
				</h2>
				<p class="verify-sub">
					${
						isReset
							? "Redirecting you to set a new password. You can close this tab."
							: "Your account is now active. Redirecting to the app. You can close this tab."
					}
				</p>
				<div class="verify-close-note">
					<i class="bi bi-x-circle"></i>
					This tab will close automatically
				</div>
			</div>
		`;
	};

	const errorState = () =>
		`
			<div class="verify-mob-card" data-content="error">
				<div class="verify-error-icon">
					<i class="bi bi-exclamation-triangle-fill"></i>
				</div>
				<h2 class="verify-title verify-title--error">Verification failed</h2>
				<p class="verify-sub" id="verify-mob-error-msg">
					${error || "This link is invalid, expired, or has already been used."}
				</p>
				<div class="verify-error-actions">
					${
						type === "reset"
							? `<a href="/auth/forgot-password?step=1" class="verify-btn-accent">
								<i class="bi bi-arrow-clockwise"></i> Request New Link
							</a>`
							: `<a href="/auth/login" class="verify-btn-accent">
								<i class="bi bi-box-arrow-in-right"></i> Go to Login
							</a>`
					}
					<button class="verify-btn-ghost" id="verify-mob-close-btn" type="button">
						Close Tab
					</button>
				</div>
			</div>
		`;

	// ── Pick state view ──────────────────────────────────────
	const getStateView = (s) => {
		switch (s) {
			case "success":
				return successState();
			case "error":
				return errorState();
			default:
				return verifyingState();
		}
	};

	root.append(
		buildNode(`
		<div class="verify-mob-layout">
			<div class="verify-glow verify-glow--1"></div>
			<div class="verify-glow verify-glow--2"></div>

			<a href="/" class="verify-logo" data-replace>
				Zecco<span>Stream</span>
			</a>

			${getStateView(state)}
		</div>
	`),
	);

	return root.getElement();
};
