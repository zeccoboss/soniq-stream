import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { PasswordDesktop } from "./PasswordDesktop.js";
import { PasswordMobile } from "./PasswordMobile.js";
import { passwordEvents } from "@zecco/features/password/password.events.js";
import {
	savePwdDraft,
	clearPwdDraft,
} from "@zecco/features/password/password.helpers.js";
import { router } from "@zecco/routes/router.js";

/**
 * PasswordPage — Forgot password orchestrator
 *
 * Route:  /auth/forgot-password?step=1|2|3|4|5  (outlet: "root")
 * Renders into #app directly — no sidebar, no footer.
 *
 * Step routing:
 *   1 → email input
 *   2 → check inbox (arrived after sending reset email)
 *   3 → new password (arrived via email link: ?step=3&token=xxx)
 *   4 → success
 *   5 → token expired
 *
 * Token:
 *   The email link opens the verify tab which validates the token
 *   and broadcasts RESET_VERIFIED with the token back to this tab.
 *   initVerifyListener() (called at app boot) handles that broadcast
 *   and calls router.navigate("/auth/forgot-password?step=3&token=xxx").
 *   The token is then available in ctx.query.token here.
 *
 * State machine per step:
 *   idle    → default
 *   loading → request in flight
 *   error   → request failed or validation error
 *
 * @async
 * @param {Object} ctx - Router context { query: { step, token } }
 * @returns {Promise<Element>}
 */
export const PasswordPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "pwd-page-root";

	let state = "idle";
	let errorMsg = "";
	let isMounted = true;

	// ── Step + direction ─────────────────────────────────────
	const step = Math.min(5, Math.max(1, Number(ctx?.query?.step) || 1));

	const prevStep = (() => {
		try {
			return Number(sessionStorage.getItem("pwd_prev_step") || 1);
		} catch {
			return 1;
		}
	})();
	const dir =
		step > prevStep ? "forward" : step < prevStep ? "back" : "forward";

	try {
		sessionStorage.setItem("pwd_prev_step", String(step));
	} catch {
		/* ignore */
	}

	// ── Token (from email link via verify tab) ───────────────
	// Present on step 3. Stored in sessionStorage so a refresh
	// on step 3 doesn't lose it.
	const token = (() => {
		const fromQuery = ctx?.query?.token ?? null;
		if (fromQuery) {
			try {
				sessionStorage.setItem("pwd_token", fromQuery);
			} catch {
				/* ignore */
			}
			return fromQuery;
		}
		try {
			return sessionStorage.getItem("pwd_token") ?? null;
		} catch {
			return null;
		}
	})();

	// ── Draft ────────────────────────────────────────────────
	const draft = (() => {
		try {
			return JSON.parse(sessionStorage.getItem("pwd_draft") || "null") ?? {};
		} catch {
			return {};
		}
	})();

	// Inject token into draft so views/events can access it
	if (token) draft.token = token;

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? PasswordMobile : PasswordDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ step, dir, state, error: errorMsg, draft, ctx });
		root.replaceChildren(view);
		passwordEvents(root, {
			step,
			state,
			draft,
			setState,
			saveDraft,
			clearDraft,
			goToStep,
		});
	};

	// ── Draft helpers ─────────────────────────────────────────
	// Called by password.events.js on every input change
	const saveDraft = (updates) => {
		const next = { ...draft, ...updates };
		try {
			sessionStorage.setItem("pwd_draft", JSON.stringify(next));
		} catch {
			/* ignore */
		}
		Object.assign(draft, updates);
	};

	const clearDraft = () => {
		clearPwdDraft();
	};

	// ── State updater ────────────────────────────────────────
	const setState = async (newState, msg = "") => {
		state = newState;
		errorMsg = msg;
		await render();
	};

	// ── Step navigation ───────────────────────────────────────
	const goToStep = (targetStep, extraParams = {}) => {
		if (targetStep < 1 || targetStep > 5) return;
		const params = new URLSearchParams({
			step: String(targetStep),
			...extraParams,
		});
		router.navigate(`/auth/forgot-password?${params.toString()}`);
	};

	// ── Boot ─────────────────────────────────────────────────
	await render();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
	};

	return root;
};
