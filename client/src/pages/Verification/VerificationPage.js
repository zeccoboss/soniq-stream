import { mobileScreen } from "@zecco/core/screen-break-points";
import { VerificationMobile } from "./VerificationMobile";
import { VerificationDesktop } from "./VerificationDesktop";
import { verificationEvents } from "@zecco/features/verification/verification-events";

// client/src/pages/Verification/VerificationPage.js
export const VerificationPage = async (ctx) => {
	const root = document.createElement("section");
	root.className = "verify-page-root";

	let state = "verifying";
	let errorMsg = "";
	let isMounted = true;

	const token = ctx?.query?.token ?? null;
	const type = ctx?.query?.type === "reset" ? "reset" : "register";
	const channel = new BroadcastChannel("soniqstream_verify");

	const setState = async (newState, msg = "") => {
		if (!isMounted) return;
		state = newState;
		errorMsg = msg;
		await render();
	};

	const closeTab = () => {
		try {
			window.close();
		} catch {
			document.title = "You can close this tab";
		}
	};

	const render = async () => {
		if (!isMounted) return;
		const UI = mobileScreen.matches
			? VerificationMobile
			: VerificationDesktop;
		const view = await UI({ state, type, error: errorMsg, ctx });
		root.replaceChildren(view);
	};

	// ── Boot ──
	await render();
	verificationEvents(root, { token, type, channel, setState, closeTab });

	root.__onUnmount = () => {
		isMounted = false;
		channel.close();
	};

	return root;
};
