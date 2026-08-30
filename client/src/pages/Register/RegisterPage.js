/** biome-ignore-all assist/source/organizeImports: <No need for strict> */

import { mobileScreen } from "@zecco/core/screen-break-points.js";
import { RegisterDesktop } from "./RegisterDesktop.js";
import { RegisterMobile } from "./RegisterMobile.js";
import { registerEvents } from "@zecco/pages/Register/register.events.js";
import { router } from "@zecco/routes/router.js";
import {
	readFromSessionStorage,
	removeFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage.js";

/**
 * RegisterPage — Register orchestrator
 *
 * Route:  /auth/register?step=1|2|3  (outlet: "root")
 * Renders into #app directly — no sidebar, no footer.
 *
 * Step routing:
 *   ctx.query.step is auto-cast to number by the router.
 *   Navigating to ?step=2 re-renders this page with step=2.
 *   Browser back naturally goes to ?step=1.
 *
 * Draft persistence:
 *   Form values are saved to sessionStorage on every input
 *   (debounced in register.events.js) so going back/forward
 *   between steps never loses entered data.
 *
 * Slide direction:
 *   Determined by comparing the incoming step against the
 *   previous step stored in sessionStorage. Stored in the
 *   component so it's fresh on every render — events file
 *   never needs to know about direction logic.
 *
 * State machine:
 *   The page itself has no loading/error states — steps are
 *   instant UI navigation. The final submit (step 3) transitions
 *   to a loading overlay handled inside register.events.js.
 *
 * @async
 * @param {Object} ctx - Router context { query: { step } }
 * @returns {Promise<Element>}
 */
export const RegisterPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "reg-page-root";

	let isMounted = true;

	// ── Step + direction ─────────────────────────────────────
	const step = Math.min(3, Math.max(1, Number(ctx?.query?.step) || 1));

	// Determine slide direction by comparing with last rendered step
	const prevStep = (() => {
		try {
			return Number(readFromSessionStorage("reg_prev_step") || 1);
		} catch {
			return 1;
		}
	})();
	const dir =
		step > prevStep ? "forward" : step < prevStep ? "back" : "forward";

	// Persist current step as previous for next render
	try {
		writeToSessionStorage("reg_prev_step", step);
	} catch {
		/* ignore */
	}

	// ── Draft ────────────────────────────────────────────────
	// Saved on every input by register.events.js (debounced).
	// Read here so views can pre-fill fields on step navigation.
	const draft = (() => {
		try {
			// return JSON.parse(sessionStorage.getItem("reg_draft") || "null") ?? {};
			return readFromSessionStorage("reg_draft") ?? {};
		} catch {
			return {};
		}
	})();

	const isMobile = mobileScreen.matches;
	const UI = isMobile ? RegisterMobile : RegisterDesktop;

	// ── Render ───────────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const view = await UI({ step, dir, draft, ctx });
		root.replaceChildren(view);
		registerEvents(root, {
			step,
			draft,
			saveDraft,
			clearDraft,
			goToStep,
		});
	};

	// ── Draft helpers ─────────────────────────────────────────
	// Called by register.events.js on every input change
	const saveDraft = (updates) => {
		const next = { ...draft, ...updates };
		try {
			writeToSessionStorage("reg_draft", next);
		} catch {
			/* ignore */
		}
		Object.assign(draft, updates);
	};

	const clearDraft = () => {
		try {
			removeFromSessionStorage("reg_draft");
			removeFromSessionStorage("reg_prev_step");
		} catch {
			/* ignore */
		}
	};

	// ── Step navigation ───────────────────────────────────────
	// register.events.js calls this instead of touching the router directly.
	// Keeps navigation logic centralized here.
	const goToStep = (targetStep) => {
		if (targetStep < 1 || targetStep > 3) return;
		// router.navigate pushes to history — browser back works naturally
		router.navigate(`/auth/register?step=${targetStep}`);
	};

	// ── Boot ─────────────────────────────────────────────────
	await render();

	// ── Lifecycle ────────────────────────────────────────────
	root.__onUnmount = () => {
		isMounted = false;
		// Don't clear draft on unmount — preserve across navigation.
		// Draft is only cleared on successful account creation (in events file).
	};

	return root;
};
