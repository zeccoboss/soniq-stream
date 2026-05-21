// client/src/features/verification/verification-events.js
import { authService } from "@zecco/services/api/auth.service.js";

export const verificationEvents = (
	root,
	{ token, type, channel, setState },
) => {
	// ── 1. Auto-run verification on mount ────────────────────────
	const verifyToken = async () => {
		try {
			if (!token) throw new Error("Missing token.");

			// Hit the appropriate endpoint based on type (reset vs register)
			const serviceCall =
				type === "reset"
					? authService.verifyResetToken({ token })
					: authService.verifyRegisterToken({ token });

			await serviceCall;

			// ── SUCCESS ──
			setState("success");

			// Broadcast success to the main app tab
			const msgType =
				type === "reset" ? "RESET_VERIFIED" : "REGISTER_VERIFIED";
			channel.postMessage({ type: msgType, token });

			// Auto-close after 2 seconds
			setTimeout(() => window.close(), 2000);
		} catch (err) {
			// ── ERROR ──
			setState("error", err.message || "Verification failed.");
			channel.postMessage({ type: "VERIFY_FAILED", reason: err.message });
		}
	};

	verifyToken();

	// ── 2. Handle "Close" / "Retry" buttons ─────────────────────
	root.addEventListener("click", (e) => {
		if (e.target.matches("#verify-close-btn, #verify-mob-close-btn")) {
			window.close();
		}
	});
};
