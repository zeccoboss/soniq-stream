// client/src/pages/Login/LoginPage.js
import { mobileScreen } from "@zecco/core/screen-break-points";
import { LoginDesktop } from "./LoginDesktop";
import { LoginMobile } from "./LoginMobile";
import { loginEvents } from "@zecco/features/login/login.events.js";
import { readFromSessionStorage } from "@zecco/services/storage/session-storage.js";

export const LoginPage = async (ctx) => {
	const root = document.createElement("div");
	root.className = "login-page-root";

	// ── Internal State ─────────────────────────────────────────
	let state = "idle"; // idle | loading | error
	let error = "";
	let errorField = "";
	// Pull existing draft from storage
	const draft = readFromSessionStorage("login_draft") || {};
	let formValues = {
		identifier: draft.email ?? "",
		password: "",
	};
	let isMounted = true;
	const controller = null;

	const snapshotInputs = () => {
		const identifierInput = root.querySelector("#login-identifier");
		const passwordInput = root.querySelector("#login-pwd");

		if (identifierInput) formValues.identifier = identifierInput.value;
		if (passwordInput) formValues.password = passwordInput.value;
	};

	// ── Render Logic ──────────────────────────────────────────
	const render = async () => {
		if (!isMounted) return;
		const UI = mobileScreen.matches ? LoginMobile : LoginDesktop;

		const view = await UI({
			state,
			error,
			errorField,
			draft,
			formValues,
			ctx,
		});
		root.replaceChildren(view);

		// Wire events (passing helpers for the orchestrator to use)
		loginEvents(root, { render });
	};

	// ── Internal Event Listeners ──────────────────────────────
	root.addEventListener("login-loading", (e) => {
		snapshotInputs();
		state = "loading";
		error = "";
		errorField = "";
		render();
	});

	root.addEventListener("login-error", (e) => {
		snapshotInputs();
		state = "error";
		error = e.detail?.message ?? "";
		errorField = e.detail?.field ?? "";
		render();
	});

	await render();

	root.__onUnmount = () => {
		isMounted = false;
		controller?.abort();
	};

	return root;
};
