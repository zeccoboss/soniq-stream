import { BaseService } from "./base.service";
import { ENDPOINTS } from "./endpoints";

class MeService extends BaseService {
	getProfile(signal = null) {
		return this.get(ENDPOINTS.ME.BASE);
	}

	// ── Settings Management ──────────────────────────────────────
	getSettings(signal = null) {
		return this.get(ENDPOINTS.ME.SETTINGS, {
			signal,
		});
	}

	updateSettings(settings, signal = null) {
		return this.patch(ENDPOINTS.ME.SETTINGS, settings, {
			signal,
		});
	}

	// ── Specific Settings Updates ────────────────────────────────
	updateTheme(theme, signal = null) {
		return this.updateSettings({ theme }, { signal });
	}

	updateNotificationPreferences(prefs, signal = null) {
		return this.updateSettings(
			{
				notificationFollowers: prefs.followers,
				notificationUploads: prefs.uploads,
				notificationLikes: prefs.likes,
			},
			{ signal },
		);
	}

	updatePrivacySettings(settings, signal = null) {
		return this.updateSettings(
			{
				profileVisibility: settings.visibility,
				showActivity: settings.activity,
				showFollowers: settings.followers,
				showLikes: settings.likes,
			},
			{ signal },
		);
	}

	updateAudioSettings(settings, signal = null) {
		return this.updateSettings(
			{
				streamingQuality: settings.quality,
				equalizerEnabled: settings.equalizer,
			},
			{ signal },
		);
	}

	updateLanguageRegion(settings, signal = null) {
		return this.updateSettings(
			{
				language: settings.language,
				region: settings.region,
			},
			{ signal },
		);
	}

	// ── Account Management ──────────────────────────────────────
	/**
	 * Change user password
	 * @param {string} currentPassword - Current password for verification
	 * @param {string} newPassword - New password to set
	 * @param {AbortSignal} signal - Optional abort signal
	 * @returns {Promise} Response from server
	 */
	changePassword(currentPassword, newPassword, signal = null) {
		return this.post(
			"/auth/change-password",
			{
				currentPassword,
				newPassword,
			},
			{ signal },
		);
	}

	/**
	 * Delete user account
	 * @param {AbortSignal} signal - Optional abort signal
	 * @returns {Promise} Response from server
	 */
	deleteAccount(signal = null) {
		return this.delete(ENDPOINTS.ME.BASE, { signal });
	}

	/**
	 * Get library/liked tracks
	 * @param {Object} options - Query options
	 * @param {AbortSignal} signal - Optional abort signal
	 * @returns {Promise} User's library
	 */
	getLibrary(options = {}, signal = null) {
		return this.get(ENDPOINTS.ME.LIBRARY, { ...options, signal });
	}

	/**
	 * Get player state
	 * @param {AbortSignal} signal - Optional abort signal
	 * @returns {Promise} Last played track and progress
	 */
	getPlayerState(signal = null) {
		return this.get(ENDPOINTS.ME.PLAYER, { signal });
	}

	/**
	 * Update player state (save progress)
	 * @param {Object} state - Player state data
	 * @param {AbortSignal} signal - Optional abort signal
	 * @returns {Promise} Updated player state
	 */
	updatePlayerState(state, signal = null) {
		return this.patch(ENDPOINTS.ME.PLAYER, state, { signal });
	}
}

const meService = new MeService();
export default meService;
