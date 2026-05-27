import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Settings.styles.css";

/**
 * SettingsDesktop — Desktop settings view component
 * @async
 * @param {Object} props
 * @param {string} props.state - "skeleton" | "auth" | "content" | "loading" | "error"
 * @param {Object} props.ctx - Router context
 * @param {Object} props.userData - Current user data
 * @param {Object} props.settingsData - User settings/preferences
 * @returns {Promise<Element>} The settings section element
 */
export const SettingsDesktop = async ({
	state,
	ctx,
	userData,
	settingsData,
}) => {
	const root = new CreateElement("section");
	root.addClass("settings-section").setId("settings-section");

	// ── Always visible header ────────────────────────────────
	const header = () =>
		buildNode(`
			<header class="settings-header">
				<h2 class="settings-title">Settings</h2>
			</header>
		`);

	// ── State factories ──────────────────────────────────────

	const authGate = () =>
		buildNode(`
			<section class="settings-sub-section" id="settings-auth-gate" data-content="auth">
				<div class="settings-auth-ring">
					<i class="bi bi-gear-fill"></i>
				</div>
				<h3 class="settings-auth-title">Settings require an account</h3>
				<p class="settings-auth-sub">
					Log in to manage your profile, preferences, and privacy settings.
				</p>
				<div class="settings-auth-btns">
					<a href="/auth/login" class="settings-btn-accent">Login</a>
					<a href="/auth/register" class="settings-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const contentState = () =>
		buildNode(`
			<section class="settings-sub-section" id="settings-content" data-content="content">

				<!-- ── Sidebar nav ── -->
				<nav class="settings-nav" id="settings-nav">
					<div class="settings-nav-group-label">Account</div>
					<button class="settings-nav-item active-settings-nav" data-panel="profile" id="settings-nav-profile">
						<span class="settings-nav-icon si-blue"><i class="bi bi-person-fill"></i></span>
						Profile
					</button>
					<button class="settings-nav-item" data-panel="password" id="settings-nav-password">
						<span class="settings-nav-icon si-purple"><i class="bi bi-lock-fill"></i></span>
						Password
					</button>
					<button class="settings-nav-item" data-panel="privacy" id="settings-nav-privacy">
						<span class="settings-nav-icon si-blue"><i class="bi bi-shield-fill"></i></span>
						Privacy
					</button>

					<div class="settings-nav-group-label">Preferences</div>
					<button class="settings-nav-item" data-panel="appearance" id="settings-nav-appearance">
						<span class="settings-nav-icon si-purple"><i class="bi bi-palette"></i></span>
						Appearance
					</button>
					<button class="settings-nav-item" data-panel="notifications" id="settings-nav-notifications">
						<span class="settings-nav-icon si-yellow"><i class="bi bi-bell-fill"></i></span>
						Notifications
					</button>
					<button class="settings-nav-item" data-panel="track" id="settings-nav-track">
						<span class="settings-nav-icon si-green"><i class="bi bi-volume-up-fill"></i></span>
						Audio
					</button>
					<button class="settings-nav-item" data-panel="language" id="settings-nav-language">
						<span class="settings-nav-icon si-orange"><i class="bi bi-globe"></i></span>
						Language
					</button>

					<div class="settings-nav-group-label">Session</div>
					<button class="settings-nav-item" data-panel="logout" id="settings-nav-logout">
						<span class="settings-nav-icon si-yellow"><i class="bi bi-box-arrow-right"></i></span>
						Logout
					</button>

					<div class="settings-nav-group-label settings-nav-group-label--danger">Danger</div>
					<button class="settings-nav-item settings-nav-item--danger" data-panel="delete" id="settings-nav-delete">
						<span class="settings-nav-icon si-red"><i class="bi bi-trash-fill"></i></span>
						Delete Account
					</button>
				</nav>

				<!-- ── Content panels ── -->
				<div class="settings-panels" id="settings-panels">

					<!-- PANEL: Profile -->
					<div class="settings-panel active-settings-panel" id="settings-panel-profile" data-panel="profile">
						<div class="settings-panel-title">Profile</div>
						<div class="settings-avatar-row">
							<div class="settings-avatar-wrap">
								<img
									src="${userData?.avatar || defaultAvatar}"
									alt="Profile avatar"
									class="settings-avatar-img"
									id="settings-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
								/>
								<div class="settings-avatar-fallback" id="settings-avatar-fallback">${userData?.username?.[0]?.toUpperCase() || "—"}</div>
								<button class="settings-avatar-edit" id="settings-avatar-edit-btn" title="Change avatar">
									<i class="bi bi-pencil-fill"></i>
								</button>
								<input type="file" id="settings-avatar-input" accept="image/*" hidden />
							</div>
							<div class="settings-avatar-info">
								<p class="settings-avatar-name" id="settings-display-name">${userData?.username || "—"}</p>
								<p class="settings-avatar-plan" id="settings-display-plan">${userData?.isAdmin ? "Admin" : "Free plan"}</p>
							</div>
						</div>
						<div class="settings-group">
							<div class="settings-item" id="settings-edit-profile-btn">
								<div class="settings-item-left">
									<div class="settings-item-icon si-blue"><i class="bi bi-person"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Edit Profile</div>
										<div class="settings-item-sub">Update name, bio, avatar and cover</div>
									</div>
								</div>
								<span class="settings-chevron"><i class="bi bi-chevron-right"></i></span>
							</div>
							<div class="settings-item" id="settings-change-pwd-link">
								<div class="settings-item-left">
									<div class="settings-item-icon si-purple"><i class="bi bi-lock"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Change Password</div>
										<div class="settings-item-sub">Update your account password</div>
									</div>
								</div>
								<span class="settings-chevron"><i class="bi bi-chevron-right"></i></span>
							</div>
						</div>
					</div>

					<!-- PANEL: Password -->
					<div class="settings-panel" id="settings-panel-password" data-panel="password">
						<div class="settings-panel-title">Change Password</div>
						<div class="settings-form">
							<div class="settings-field">
								<label class="settings-field-label">Current password</label>
								<input type="password" class="settings-input" id="settings-pwd-current" placeholder="Enter current password" />
							</div>
							<div class="settings-field">
								<label class="settings-field-label">New password</label>
								<input type="password" class="settings-input" id="settings-pwd-new" placeholder="Create new password" />
								<div class="settings-pwd-strength" id="settings-pwd-strength">
									<div class="settings-pwd-bars">
										<div class="settings-pwd-bar" id="spb-1"></div>
										<div class="settings-pwd-bar" id="spb-2"></div>
										<div class="settings-pwd-bar" id="spb-3"></div>
										<div class="settings-pwd-bar" id="spb-4"></div>
									</div>
									<span class="settings-pwd-label" id="settings-pwd-label">Enter a password</span>
								</div>
							</div>
							<div class="settings-field">
								<label class="settings-field-label">Confirm new password</label>
								<input type="password" class="settings-input" id="settings-pwd-confirm" placeholder="Repeat new password" />
							</div>
							<button class="settings-btn-accent" id="settings-pwd-submit">Update Password</button>
						</div>
					</div>

					<!-- PANEL: Privacy -->
					<div class="settings-panel" id="settings-panel-privacy" data-panel="privacy">
						<div class="settings-panel-title">Privacy</div>
						<div class="settings-group-label">Profile Visibility</div>
						<div class="settings-group">
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-blue"><i class="bi bi-globe2"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Profile visibility</div>
										<div class="settings-item-sub">Who can see your profile</div>
									</div>
								</div>
								<div class="settings-item-right">
									<select class="settings-inline-select" id="settings-privacy-visibility">
										<option value="public" ${settingsData?.profileVisibility === "public" ? "selected" : ""}>Public</option>
										<option value="followers" ${settingsData?.profileVisibility === "followers" ? "selected" : ""}>Followers only</option>
										<option value="private" ${settingsData?.profileVisibility === "private" ? "selected" : ""}>Private</option>
									</select>
								</div>
							</div>
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-purple"><i class="bi bi-activity"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Show listening activity</div>
										<div class="settings-item-sub">Let followers see what you play</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.showActivity ? "on" : ""}" id="settings-toggle-activity" role="switch" aria-checked="${settingsData?.showActivity ? "true" : "false"}"></div>
							</div>
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-green"><i class="bi bi-people"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Show follower count</div>
										<div class="settings-item-sub">Display your follower count publicly</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.showFollowers ? "on" : ""}" id="settings-toggle-followers" role="switch" aria-checked="${settingsData?.showFollowers ? "true" : "false"}"></div>
							</div>
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-orange"><i class="bi bi-heart"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Show liked tracks</div>
										<div class="settings-item-sub">Let others see tracks you've liked</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.showLikes ? "on" : ""}" id="settings-toggle-likes" role="switch" aria-checked="${settingsData?.showLikes ? "true" : "false"}"></div>
							</div>
						</div>
					</div>

					<!-- PANEL: Appearance -->
					<div class="settings-panel" id="settings-panel-appearance" data-panel="appearance">
						<div class="settings-panel-title">Appearance</div>
						<div class="settings-group-label">Theme</div>
						<div class="settings-theme-btns">
							<button class="settings-theme-btn theme_btn_dark ${settingsData?.theme === "Dark" ? "theme-selected" : ""}" data-theme="Dark">
								<i class="bi bi-moon-fill"></i> Dark
							</button>
							<button class="settings-theme-btn theme_btn_light ${settingsData?.theme === "Light" ? "theme-selected" : ""}" data-theme="Light">
								<i class="bi bi-sun-fill"></i> Light
							</button>
							<button class="settings-theme-btn theme_btn_system ${settingsData?.theme === "System" ? "theme-selected" : ""}" data-theme="System">
								<i class="bi bi-laptop"></i> System
							</button>
						</div>
						<p class="settings-theme-note">
							Current: <span data-theme-placeholder>${settingsData?.theme || "Dark"}</span>
						</p>
					</div>

					<!-- PANEL: Notifications -->
					<div class="settings-panel" id="settings-panel-notifications" data-panel="notifications">
						<div class="settings-panel-title">Notifications</div>
						<div class="settings-group">
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-yellow"><i class="bi bi-person-plus"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">New followers</div>
										<div class="settings-item-sub">When someone follows you</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.notificationFollowers ? "on" : ""}" id="settings-notif-followers" role="switch" aria-checked="${settingsData?.notificationFollowers ? "true" : "false"}"></div>
							</div>
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-green"><i class="bi bi-cloud-upload"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">New upload</div>
										<div class="settings-item-sub">From artists you follow</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.notificationUploads ? "on" : ""}" id="settings-notif-upload" role="switch" aria-checked="${settingsData?.notificationUploads ? "true" : "false"}"></div>
							</div>
							<div class="settings-item">
								<div class="settings-item-left">
									<div class="settings-item-icon si-pink"><i class="bi bi-heart"></i></div>
									<div class="settings-item-text">
										<div class="settings-item-title">Likes on your tracks</div>
										<div class="settings-item-sub">When someone likes your music</div>
									</div>
								</div>
								<div class="settings-toggle ${settingsData?.notificationLikes ? "on" : ""}" id="settings-notif-likes" role="switch" aria-checked="${settingsData?.notificationLikes ? "true" : "false"}"></div>
							</div>
						</div>
					</div>

					<!-- PANEL: Audio -->
					<div class="settings-panel" id="settings-panel-track" data-panel="track">
						<div class="settings-panel-title">Audio</div>
						<div class="settings-group-label">Streaming quality</div>
						<div class="settings-select-wrap">
							<select class="settings-select" id="settings-track-quality">
								<option value="auto" ${settingsData?.streamingQuality === "auto" ? "selected" : ""}>Auto (recommended)</option>
								<option value="low" ${settingsData?.streamingQuality === "low" ? "selected" : ""}>Low — 96 kbps</option>
								<option value="normal" ${settingsData?.streamingQuality === "normal" ? "selected" : ""}>Normal — 160 kbps</option>
								<option value="high" ${settingsData?.streamingQuality === "high" ? "selected" : ""}>High — 320 kbps</option>
							</select>
						</div>
						<div class="settings-group-label" style="margin-top:16px">Equalizer</div>
						<div class="settings-item">
							<div class="settings-item-left">
								<div class="settings-item-icon si-green"><i class="bi bi-sliders"></i></div>
								<div class="settings-item-text">
									<div class="settings-item-title">Enable equalizer</div>
									<div class="settings-item-sub">Adjust bass, mid, and treble</div>
								</div>
							</div>
							<div class="settings-toggle ${settingsData?.equalizerEnabled ? "on" : ""}" id="settings-toggle-eq" role="switch" aria-checked="${settingsData?.equalizerEnabled ? "true" : "false"}"></div>
						</div>
					</div>

					<!-- PANEL: Language -->
					<div class="settings-panel" id="settings-panel-language" data-panel="language">
						<div class="settings-panel-title">Language & Region</div>
						<div class="settings-group-label">Language</div>
						<div class="settings-select-wrap" style="margin-bottom:16px">
							<select class="settings-select" id="settings-language">
								<option value="en" ${settingsData?.language === "en" ? "selected" : ""}>English</option>
								<option value="yo" ${settingsData?.language === "yo" ? "selected" : ""}>Yoruba</option>
								<option value="ig" ${settingsData?.language === "ig" ? "selected" : ""}>Igbo</option>
								<option value="ha" ${settingsData?.language === "ha" ? "selected" : ""}>Hausa</option>
								<option value="pcm" ${settingsData?.language === "pcm" ? "selected" : ""}>Pidgin</option>
							</select>
						</div>
						<div class="settings-group-label">Region</div>
						<div class="settings-select-wrap">
							<select class="settings-select" id="settings-region">
								<option value="NG" ${settingsData?.region === "NG" ? "selected" : ""}>Nigeria</option>
								<option value="GH" ${settingsData?.region === "GH" ? "selected" : ""}>Ghana</option>
								<option value="KE" ${settingsData?.region === "KE" ? "selected" : ""}>Kenya</option>
								<option value="ZA" ${settingsData?.region === "ZA" ? "selected" : ""}>South Africa</option>
								<option value="GB" ${settingsData?.region === "GB" ? "selected" : ""}>United Kingdom</option>
								<option value="US" ${settingsData?.region === "US" ? "selected" : ""}>United States</option>
							</select>
						</div>
					</div>

					<!-- PANEL: Logout -->
					<div class="settings-panel" id="settings-panel-logout" data-panel="logout">
						<div class="settings-panel-title">Session</div>
						<div class="settings-logout-card">
							<div class="settings-logout-avatar">
								<img
									src="${userData?.avatar || defaultAvatar}"
									alt="Profile avatar"
									class="settings-logout-avatar-img"
									id="settings-logout-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
								/>
								<div class="settings-logout-avatar-fallback" id="settings-logout-fallback">${userData?.username?.[0]?.toUpperCase() || "—"}</div>
							</div>
							<div class="settings-logout-info">
								<p class="settings-logout-name" id="settings-logout-name">${userData?.username || "—"}</p>
								<p class="settings-logout-email" id="settings-logout-email">${userData?.email || "—"}</p>
								<p class="settings-logout-plan" id="settings-logout-plan">${userData?.isAdmin ? "Admin" : "Free plan"}</p>
							</div>
						</div>
						<p class="settings-logout-note">
							Logging out will end your session on this device.
						</p>
						<button class="settings-btn-logout" id="settings-logout-btn">
							<i class="bi bi-box-arrow-right"></i>
							Logout
						</button>
					</div>

					<!-- PANEL: Delete Account -->
					<div class="settings-panel" id="settings-panel-delete" data-panel="delete">
						<div class="settings-panel-title settings-panel-title--danger">Danger Zone</div>
						<div class="settings-danger-zone">
							<div class="settings-danger-text">
								<p class="settings-danger-title">Delete Account</p>
								<p class="settings-danger-sub">
									Permanently delete your account and all associated data.
									Tracks, playlists, followers, and history. This cannot be undone.
								</p>
							</div>
							<button class="settings-danger-btn" id="settings-delete-btn">
								Delete Account
							</button>
						</div>
					</div>

				</div><!-- /settings-panels -->
			</section>
		`);

	const loadingState = (toggleClass) =>
		buildNode(`
			<section class="settings-sub-section ${toggleClass}" id="settings-loading" data-content="loading">
				<div class="settings-loading-ring">
					<svg width="28" height="28" fill="none" viewBox="0 0 24 24" class="settings-spinner">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
							stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
					</svg>
				</div>
				<p class="settings-loading-text">Saving changes...</p>
			</section>
		`);

	const errorState = (toggleClass) =>
		buildNode(`
			<section class="settings-sub-section ${toggleClass}" id="settings-error" data-content="error">
				<div class="settings-error-icon">
					<i class="bi bi-exclamation-triangle-fill"></i>
				</div>
				<h3 class="settings-error-title">Something went wrong</h3>
				<p class="settings-error-sub" id="settings-error-msg">
					We couldn't save your changes. Please try again.
				</p>
				<button class="settings-btn-accent" id="settings-error-retry">Try Again</button>
			</section>
		`);

	const skeletonState = (toggleClass) =>
		buildNode(`
			<section class="settings-sub-section ${toggleClass}" id="settings-skeleton" data-content="skeleton">
				<div class="settings-skeleton-nav">
					<div class="settings-skeleton settings-skeleton--text-sm" style="width:60px;margin-bottom:14px"></div>
					${["80%", "70%", "75%"]
						.map(
							(w) => `
						<div class="settings-skeleton settings-skeleton--nav-item" style="width:${w}"></div>
					`,
						)
						.join("")}
					<div class="settings-skeleton settings-skeleton--text-sm" style="width:70px;margin:14px 0 8px"></div>
					${["65%", "80%", "60%", "72%"]
						.map(
							(w) => `
						<div class="settings-skeleton settings-skeleton--nav-item" style="width:${w}"></div>
					`,
						)
						.join("")}
				</div>
				<div class="settings-skeleton-panel">
					<div class="settings-skeleton-avatar-row">
						<div class="settings-skeleton settings-skeleton--avatar"></div>
						<div style="flex:1;display:flex;flex-direction:column;gap:6px">
							<div class="settings-skeleton settings-skeleton--text-lg"></div>
							<div class="settings-skeleton settings-skeleton--text-sm" style="width:45%"></div>
						</div>
					</div>
					<div style="display:flex;flex-direction:column;gap:6px">
						<div class="settings-skeleton settings-skeleton--text-sm" style="width:80px"></div>
						<div class="settings-skeleton settings-skeleton--item"></div>
						<div class="settings-skeleton settings-skeleton--item"></div>
					</div>
					<div class="settings-skeleton settings-skeleton--btn"></div>
				</div>
			</section>
		`);

	// ── Pick the right view ──────────────────────────────────
	const getStateView = (state) => {
		switch (state) {
			case "auth":
				return authGate();
			case "content":
				return contentState();
			case "loading":
				return loadingState();
			case "error":
				return errorState();
			default:
				return skeletonState();
		}
	};

	root.append(header(), getStateView(state));
	return root.getElement();
};
