import { showModal, hideModal } from "@zecco/components/Modal/Modal.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { adminService } from "@zecco/services/api/admin.service.js";
import { bindAdminSearch } from "./admin.helpers.js";

/** Shared interaction layer for desktop and mobile admin views. */
export const adminEvents = (root, { state, setState }) => {
	// AdminPage replaces children in the same root on each render.
	root?.__adminEventCleanup?.();
	if (!root) return;

	const searchCleanups = [];
	const refresh = async () => {
		hideModal();
		await setState("skeleton");
	};
	const runConfirmedAction = ({
		title,
		message,
		confirmLabel,
		type = "warning",
		successMessage,
		action,
	}) => {
		showModal({
			title,
			message,
			type,
			confirmLabel,
			onConfirm: async () => {
				try {
					await action();
					toast({ message: successMessage, type: "success" });
					await refresh();
				} catch (error) {
					toast({
						message: error?.message ?? "That action could not be completed.",
						type: "error",
					});
					hideModal();
				}
			},
		});
	};

	const handlers = {
		"view-user": (userId) => {
			if (userId) toast({ message: "User details are not available yet.", type: "info" });
		},
		ban: (userId) => {
			if (!userId) return;
			runConfirmedAction({
				title: "Ban this user?",
				message: "They will not be able to sign in until they are unbanned.",
				confirmLabel: "Ban user",
				type: "danger",
				successMessage: "User banned.",
				action: () => adminService.toggleUserStatus(userId),
			});
		},
		unban: (userId) => {
			if (!userId) return;
			runConfirmedAction({
				title: "Unban this user?",
				message: "They will be able to sign in again.",
				confirmLabel: "Unban user",
				type: "success",
				successMessage: "User unbanned.",
				action: () => adminService.toggleUserStatus(userId),
			});
		},
		"delete-user": (userId) => {
			if (!userId) return;
			runConfirmedAction({
				title: "Delete this user?",
				message: "This permanently deletes the account and cannot be undone.",
				confirmLabel: "Delete user",
				type: "danger",
				successMessage: "User deleted.",
				action: () => adminService.deleteUser(userId),
			});
		},
		"play-track": (trackId) => {
			if (trackId) toast({ message: "Track playback from Admin is not available yet.", type: "info" });
		},
		"remove-track": (trackId) => {
			if (!trackId) return;
			runConfirmedAction({
				title: "Remove this track?",
				message: "The track will be permanently removed from the platform.",
				confirmLabel: "Remove track",
				type: "danger",
				successMessage: "Track removed.",
				action: () => adminService.deleteTrack(trackId),
			});
		},
		"view-report": (reportId) => {
			if (reportId) toast({ message: "Report details are not available yet.", type: "info" });
		},
		"dismiss-report": (reportId) => {
			if (!reportId) return;
			runConfirmedAction({
				title: "Dismiss this report?",
				message: "This marks the report as dismissed without removing content.",
				confirmLabel: "Dismiss report",
				successMessage: "Report dismissed.",
				action: () => adminService.updateReportStatus(reportId, "dismissed"),
			});
		},
		"remove-reported": (targetId, targetType) => {
			if (!targetId) return;
			const remove =
				targetType === "track"
					? () => adminService.deleteTrack(targetId)
					: targetType === "user"
						? () => adminService.deleteUser(targetId)
						: null;
			if (!remove) {
				toast({ message: "This report has no removable target.", type: "warning" });
				return;
			}
			runConfirmedAction({
				title: "Remove reported content?",
				message: "This permanently removes the reported content.",
				confirmLabel: "Remove content",
				type: "danger",
				successMessage: "Reported content removed.",
				action: remove,
			});
		},
	};

	const handleActionClick = (event) => {
		const button = event.target.closest("[data-action]");
		if (!button || !root.contains(button)) return;
		event.preventDefault();
		handlers[button.dataset.action]?.(
			button.dataset.uuid,
			button.dataset.targetType,
		);
	};
	const handleRetryClick = () => setState("skeleton");

	if (state === "content") {
		root.addEventListener("click", handleActionClick);
		[
			["#admin-user-search, #admin-mob-user-search", "#admin-users-list, #admin-mob-users-list", ".admin-user-row", "users"],
			["#admin-track-search, #admin-mob-track-search", "#admin-tracks-list, #admin-mob-tracks-list", ".admin-track-row", "tracks"],
		].forEach(([inputSelector, listSelector, rowSelector, label]) => {
			searchCleanups.push(
				bindAdminSearch({
					input: root.querySelector(inputSelector),
					list: root.querySelector(listSelector),
					rowSelector,
					label,
				}),
			);
		});
	}

	const retryButton = root.querySelector("#admin-retry-btn, #admin-mob-retry-btn");
	if (state === "error" && retryButton) retryButton.addEventListener("click", handleRetryClick);

	root.__adminEventCleanup = () => {
		root.removeEventListener("click", handleActionClick);
		retryButton?.removeEventListener("click", handleRetryClick);
		searchCleanups.forEach((cleanup) => cleanup());
	};
};
