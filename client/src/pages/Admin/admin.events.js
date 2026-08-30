import { router } from "@zecco/routes/router.js";

/**
 * adminEvents — Event handlers for admin page (both desktop and mobile)
 *
 * Handles:
 *   - Tab navigation (links are handled by router naturally)
 *   - Action buttons: view-user, ban, unban, delete-user, play-track, remove-track, view-report, dismiss-report, remove-reported
 *   - Retry button for error state recovery
 *
 * @param {Element} root - Admin section root element
 * @param {Object} context
 * @param {string} context.state - Current state (skeleton | content | error)
 * @param {Function} context.setState - State updater function
 * @param {Object} context.ctx - Route context
 * @returns {void}
 */
export const adminEvents = (root, { state, setState, ctx }) => {
	// ── Action handlers ──────────────────────────────────────
	const handlers = {
		/**
		 * View user profile/details
		 */
		"view-user": async (userId) => {
			if (!userId) return;
			console.log("[Admin] Viewing user:", userId);
			// TODO: Navigate to user detail view or open modal
			// router.navigate(`/user/${userId}`);
		},

		/**
		 * Ban a user
		 */
		ban: async (userId) => {
			if (!userId) return;
			if (!confirm("Ban this user? They will not be able to log in."))
				return;

			console.log("[Admin] Banning user:", userId);
			try {
				// TODO: Call admin API service
				// await adminService.banUser(userId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] User banned successfully");
			} catch (err) {
				console.error("[Admin] Ban failed:", err);
				alert("Failed to ban user");
			}
		},

		/**
		 * Unban a user
		 */
		unban: async (userId) => {
			if (!userId) return;
			if (!confirm("Unban this user?")) return;

			console.log("[Admin] Unbanning user:", userId);
			try {
				// TODO: Call admin API service
				// await adminService.unbanUser(userId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] User unbanned successfully");
			} catch (err) {
				console.error("[Admin] Unban failed:", err);
				alert("Failed to unban user");
			}
		},

		/**
		 * Permanently delete a user account
		 */
		"delete-user": async (userId) => {
			if (!userId) return;
			if (
				!confirm(
					"Permanently delete this user account? This action cannot be undone.",
				)
			)
				return;

			console.log("[Admin] Deleting user:", userId);
			try {
				// TODO: Call admin API service
				// await adminService.deleteUser(userId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] User deleted successfully");
			} catch (err) {
				console.error("[Admin] Delete failed:", err);
				alert("Failed to delete user");
			}
		},

		/**
		 * Play a track (desktop only)
		 */
		"play-track": async (trackId) => {
			if (!trackId) return;
			console.log("[Admin] Playing track:", trackId);
			// TODO: Trigger player to play this track
			// const { player } = store;
			// player.setQueue([trackId]);
			// player.play();
		},

		/**
		 * Remove/delete a track
		 */
		"remove-track": async (trackId) => {
			if (!trackId) return;
			if (!confirm("Remove this track from the platform?")) return;

			console.log("[Admin] Removing track:", trackId);
			try {
				// TODO: Call admin API service
				// await adminService.removeTrack(trackId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] Track removed successfully");
			} catch (err) {
				console.error("[Admin] Remove track failed:", err);
				alert("Failed to remove track");
			}
		},

		/**
		 * View report details (desktop only)
		 */
		"view-report": async (reportId) => {
			if (!reportId) return;
			console.log("[Admin] Viewing report:", reportId);
			// TODO: Open report detail modal or navigate to detail page
		},

		/**
		 * Dismiss/resolve a report without action
		 */
		"dismiss-report": async (reportId) => {
			if (!reportId) return;
			if (!confirm("Dismiss this report?")) return;

			console.log("[Admin] Dismissing report:", reportId);
			try {
				// TODO: Call admin API service
				// await adminService.dismissReport(reportId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] Report dismissed successfully");
			} catch (err) {
				console.error("[Admin] Dismiss report failed:", err);
				alert("Failed to dismiss report");
			}
		},

		/**
		 * Remove reported content (track or user)
		 */
		"remove-reported": async (targetId) => {
			if (!targetId) return;
			if (!confirm("Remove this content?")) return;

			console.log("[Admin] Removing reported content:", targetId);
			try {
				// TODO: Call admin API service
				// await adminService.removeContent(targetId);
				// Then refresh data
				// await setState("skeleton");
				console.log("[Admin] Content removed successfully");
			} catch (err) {
				console.error("[Admin] Remove content failed:", err);
				alert("Failed to remove content");
			}
		},
	};

	// ── Event delegation ─────────────────────────────────────
	const handleActionClick = async (e) => {
		const btn = e.target.closest("[data-action]");
		if (!btn) return;

		const action = btn.dataset.action;
		const id = btn.dataset.id;

		if (handlers[action]) {
			btn.disabled = true;
			try {
				await handlers[action](id);
			} finally {
				btn.disabled = false;
			}
		}
	};

	// ── Retry button ─────────────────────────────────────────
	const handleRetryClick = async () => {
		await setState("skeleton");
	};

	// ── Attach listeners ─────────────────────────────────────
	if (root && state === "content") {
		// Event delegation for action buttons
		root.addEventListener("click", handleActionClick);

		// Retry buttons (different IDs for desktop/mobile)
		const retryBtn =
			root.querySelector("#admin-retry-btn") ||
			root.querySelector("#admin-mob-retry-btn");
		if (retryBtn && state === "error") {
			retryBtn.addEventListener("click", handleRetryClick);
		}
	} else if (root && state === "error") {
		// Ensure retry button is attached in error state
		const retryBtn =
			root.querySelector("#admin-retry-btn") ||
			root.querySelector("#admin-mob-retry-btn");
		if (retryBtn) {
			retryBtn.addEventListener("click", handleRetryClick);
		}
	}

	// ── Cleanup ──────────────────────────────────────────────
	// Note: cleanup should happen in AdminPage's __onUnmount hook
	root.__adminEventCleanup = () => {
		root.removeEventListener("click", handleActionClick);
		const retryBtn =
			root.querySelector("#admin-retry-btn") ||
			root.querySelector("#admin-mob-retry-btn");
		if (retryBtn) {
			retryBtn.removeEventListener("click", handleRetryClick);
		}
	};
};
