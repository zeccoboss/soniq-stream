// @zecco/features/settings/settings.events.js
import { themeManager } from "@zecco/core/theme-manager.js";
import { networkHandler } from "@zecco/core/network-handler.js";
import { store } from "@zecco/store/store.js";
import meService from "@zecco/services/api/me.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { showModal } from "@zecco/components/Modal/Modal.js";
import {
	filterSettingsPanels,
	showMobPanel,
	hideMobPanel,
} from "./settings.helpers.js";

export const settingsEvents = (
	root,
	{ state, setState, userData, settingsData },
) => {
	// Prevent duplicate event bindings on re-renders
	if (root.hasAttribute("data-events-bound")) return;
	root.setAttribute("data-events-bound", "true");

	// ── Form submission handlers ──
	const handlePasswordChange = async (e, submitBtn) => {
		e.preventDefault();

		if (networkHandler.getStatus() === "offline") {
			toast({
				message: "Internet connection required to change password.",
				type: "error",
				duration: 4000,
			});
			return;
		}

		const currentPwdInput = root.querySelector("#settings-pwd-current");
		const newPwdInput = root.querySelector("#settings-pwd-new");
		const confirmPwdInput = root.querySelector("#settings-pwd-confirm");

		const currentPwd = currentPwdInput?.value;
		const newPwd = newPwdInput?.value;
		const confirmPwd = confirmPwdInput?.value;

		if (!currentPwd || !newPwd || !confirmPwd) {
			toast({
				message: "Please fill all password fields.",
				type: "warning",
			});
			return;
		}

		if (newPwd !== confirmPwd) {
			toast({ message: "New passwords do not match.", type: "error" });
			return;
		}

		const originalText = submitBtn.textContent;
		submitBtn.textContent = "Updating...";
		submitBtn.disabled = true;

		try {
			await meService.changePassword(currentPwd, newPwd);
			toast({ message: "Password updated successfully!", type: "success" });

			currentPwdInput.value = "";
			newPwdInput.value = "";
			confirmPwdInput.value = "";
		} catch (err) {
			console.error("Password change error:", err);
			toast({
				message:
					"Failed to update password: " +
					(err?.message || "Unknown error"),
				type: "error",
			});
		} finally {
			submitBtn.textContent = originalText;
			submitBtn.disabled = false;
		}
	};

	const handleLogout = async () => {
		showModal({
			title: "Logout",
			message: "Are you sure you want to end your session on this device?",
			type: "warning",
			confirmLabel: "Yes, Logout",
			cancelLabel: "Cancel",
			onConfirm: async () => {
				try {
					await setState("loading");
					store.clearAll();
					// meService.l
					toast({ message: "You have been logged out.", type: "info" });
					setTimeout(() => {
						window.location.href = "/auth/login";
					}, 500);
				} catch (err) {
					console.error("Logout error:", err);
					toast({
						message:
							"Logout failed: " + (err?.message || "Unknown error"),
						type: "error",
					});
					await setState("content");
				}
			},
		});
	};

	const handleDeleteAccount = async () => {
		if (networkHandler.getStatus() === "offline") {
			toast({
				message: "Internet connection required to delete account.",
				type: "error",
				duration: 4000,
			});
			return;
		}

		showModal({
			title: "Delete Account?",
			message:
				"This action cannot be undone. All your tracks, playlists, followers, and data will be permanently deleted.",
			type: "danger",
			confirmLabel: "Delete Account",
			cancelLabel: "Cancel",
			onConfirm: async () => {
				try {
					await setState("loading");
					await meService.deleteAccount();
					store.clearAll();
					toast({
						message: "Your account has been permanently deleted.",
						type: "info",
					});
					setTimeout(() => {
						window.location.href = "/auth/login";
					}, 500);
				} catch (err) {
					console.error("Delete account error:", err);
					toast({
						message:
							"Failed to delete account: " +
							(err?.message || "Unknown error"),
						type: "error",
					});
					await setState("content");
				}
			},
		});
	};

	// ── Theme changes ──
	const handleThemeChange = async (theme) => {
		try {
			const formattedTheme =
				theme.charAt(0).toUpperCase() + theme.slice(1).toLowerCase();
			const themeMethod = `set${formattedTheme}`;

			if (themeManager[themeMethod]) themeManager[themeMethod]();

			store.auth.updateSettings("theme", theme.toLowerCase());
			updateVisualSelection(root, theme);

			const themePlaceholder = root.querySelector(
				"[data-theme-placeholder]",
			);
			if (themePlaceholder) themePlaceholder.textContent = formattedTheme;

			toast({
				message: `Theme changed to ${formattedTheme}`,
				type: "success",
			});

			if (networkHandler.getStatus() === "online") {
				try {
					await meService.updateSettings({ theme: theme.toLowerCase() });
				} catch (err) {
					console.warn("Theme save to backend failed:", err);
				}
			} else {
				toast({
					message: "Theme saved locally. Will sync when online.",
					type: "warning",
					duration: 3000,
				});
			}
		} catch (err) {
			console.error("Theme change error:", err);
			toast({ message: "Failed to change theme.", type: "error" });
		}
	};

	// ── Settings save handlers (Strict Network Check) ──
	const saveSettingValue = async (key, value, friendlyName = "Setting") => {
		if (networkHandler.getStatus() === "offline") {
			toast({
				message: `Cannot update ${friendlyName} while offline.`,
				type: "error",
				duration: 3000,
			});
			return false; // Return false to indicate failure so UI can revert if necessary
		}

		try {
			// Update local store immediately for snappiness
			store.auth.updateUser(key, value);
			await meService.updateSettings({ [key]: value });
			toast({
				message: `${friendlyName} updated successfully.`,
				type: "success",
			});
			return true;
		} catch (err) {
			console.error(`Save ${key} error:`, err);
			toast({ message: `Failed to update ${friendlyName}.`, type: "error" });
			return false;
		}
	};

	// ── Master Click Handler ──
	root.addEventListener("click", async (e) => {
		// 1. Theme buttons
		const themeBtn = e.target.closest(".settings-theme-btn");
		if (themeBtn) {
			const theme = themeBtn.dataset.theme;
			if (theme) handleThemeChange(theme);
			return;
		}

		// 2. Desktop Layout Panel View Switching
		const desktopNav = e.target.closest(".settings-nav-item");
		if (desktopNav) {
			const panel = desktopNav.dataset.panel;
			if (panel) {
				filterSettingsPanels(panel);
				if (panel === "password")
					root.querySelector("#settings-pwd-current")?.focus();
			}
			return;
		}

		// 3. Mobile Layout Sliding Transitions
		const mobileRow = e.target.closest(".settings-mob-row");
		if (mobileRow) {
			const panel = mobileRow.dataset.panel;
			if (panel) showMobPanel(panel);
			return;
		}

		const mobileBack = e.target.closest(".settings-mob-back-btn");
		if (mobileBack) {
			hideMobPanel();
			return;
		}

		// 4. Cross-Component Navigations
		const changePwdLink = e.target.closest("#settings-change-pwd-link");
		if (changePwdLink) {
			filterSettingsPanels("password");
			showMobPanel("password");
			setTimeout(
				() => root.querySelector("#settings-pwd-current")?.focus(),
				100,
			);
			return;
		}

		const editProfileLink = e.target.closest("#settings-edit-profile-btn");
		if (editProfileLink) {
			filterSettingsPanels("profile");
			showMobPanel("profile");
			toast({ message: "Opening Profile Editor...", type: "info" });
			return;
		}

		// 5. Action Buttons
		const logoutBtn = e.target.closest("#settings-logout-btn");
		if (logoutBtn) {
			handleLogout();
			return;
		}

		const deleteBtn = e.target.closest("#settings-delete-btn");
		if (deleteBtn) {
			handleDeleteAccount();
			return;
		}

		const pwdSubmitBtn = e.target.closest("#settings-pwd-submit");
		if (pwdSubmitBtn) {
			handlePasswordChange(e, pwdSubmitBtn);
			return;
		}

		// 6. Toggles
		const toggle = e.target.closest(".settings-toggle");
		if (toggle) {
			// Strict network check before allowing visual state change
			if (networkHandler.getStatus() === "offline") {
				toast({
					message: "Cannot change settings while offline.",
					type: "error",
				});
				return;
			}

			const isNow = !toggle.classList.contains("on");

			const toggleMap = {
				"settings-toggle-activity": {
					key: "privacy.showListeningActivity",
					name: "Listening Activity",
				},
				"settings-toggle-followers": {
					key: "privacy.showPlaylists",
					name: "Playlist Visibility",
				},
				"settings-toggle-likes": {
					key: "privacy.showRecentPlays",
					name: "Recent Plays Visibility",
				},
				"settings-notif-followers": {
					key: "notifications.push",
					name: "Push Notifications",
				},
				"settings-notif-upload": {
					key: "notifications.email",
					name: "Email Notifications",
				},
				"settings-toggle-eq": {
					key: "equalizerEnabled",
					name: "Audio Equalizer",
				},
			};

			const settingData = toggleMap[toggle.id];
			if (settingData) {
				// Optimistically toggle UI
				toggle.classList.toggle("on");
				toggle.setAttribute("aria-checked", isNow ? "true" : "false");

				const success = await saveSettingValue(
					settingData.key,
					isNow,
					settingData.name,
				);

				// Revert UI if the network request failed
				if (!success && networkHandler.getStatus() === "online") {
					toggle.classList.toggle("on");
					toggle.setAttribute("aria-checked", !isNow ? "true" : "false");
				}
			}
			return;
		}
	});

	// ── Master Change Handler for Selects ──
	root.addEventListener("change", async (e) => {
		const targetId = e.target.id;
		const val = e.target.value;

		// If offline, block the change and revert the select to its previous state (or warn user)
		if (networkHandler.getStatus() === "offline") {
			toast({
				message: "Cannot update preferences while offline.",
				type: "error",
			});
			return;
		}

		if (targetId === "settings-privacy-visibility") {
			saveSettingValue("visibility", val, "Profile Visibility");
		} else if (targetId === "settings-track-quality") {
			saveSettingValue("preferredTrackQuality", val, "Audio Quality");
		} else if (targetId === "settings-language") {
			saveSettingValue("language", val, "Language Preference");
		} else if (targetId === "settings-region") {
			saveSettingValue("region", val, "Region Preference");
		}
	});
};

const updateVisualSelection = (root, activeTheme) => {
	const themeButtons = root.querySelectorAll(".settings-theme-btn");
	themeButtons.forEach((btn) => {
		if (btn.dataset.theme?.toLowerCase() === activeTheme.toLowerCase()) {
			btn.classList.add("theme-selected");
		} else {
			btn.classList.remove("theme-selected");
		}
	});
};
