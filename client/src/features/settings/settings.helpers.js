/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <Stop the error> */

export const filterSettingsPanels = (panel) => {
	const navItems = document.querySelectorAll(".settings-nav-item");
	const panels = document.querySelectorAll(".settings-panel");

	console.log(
		"[filterSettingsPanels] Found nav items:",
		navItems.length,
		"panels:",
		panels.length,
		"target panel:",
		panel,
	);

	if (!navItems.length || !panels.length) {
		console.warn("[filterSettingsPanels] No nav items or panels found!");
		return;
	}

	// Reset states
	navItems.forEach((item) => item.classList.remove("active-settings-nav"));
	panels.forEach((p) => p.classList.remove("active-settings-panel"));

	// Set active
	const activeNav = document.querySelector(`[data-panel="${panel}"]`);
	const activePanel = document.getElementById(`settings-panel-${panel}`);

	console.log(
		"[filterSettingsPanels] activeNav:",
		activeNav ? activeNav.className : "NOT FOUND",
		"activePanel:",
		activePanel ? activePanel.id : "NOT FOUND",
	);

	if (activeNav) {
		activeNav.classList.add("active-settings-nav");
		console.log("[filterSettingsPanels] Added active-settings-nav");
	}
	if (activePanel) {
		activePanel.classList.add("active-settings-panel");
		console.log("[filterSettingsPanels] Added active-settings-panel");
	}
};

export const showMobPanel = (panelId) => {
	const mainContent = document.getElementById("settings-mob-content");
	const detailView = document.getElementById("settings-mob-detail");
	const detailTitle = document.getElementById("settings-mob-detail-title");
	const detailBody = document.getElementById("settings-mob-detail-body");

	console.log(
		"[showMobPanel] panelId:",
		panelId,
		"mainContent:",
		mainContent ? "found" : "NOT FOUND",
		"detailView:",
		detailView ? "found" : "NOT FOUND",
	);

	if (!mainContent || !detailView || !detailBody) {
		console.warn("[showMobPanel] Missing DOM elements!", {
			mainContent,
			detailView,
			detailBody,
		});
		return;
	}

	// Dynamic Title Update
	const titles = {
		profile: "Edit Profile",
		password: "Password",
		privacy: "Privacy",
		appearance: "Appearance",
		notifications: "Notifications",
		track: "Audio",
		language: "Language & Region",
		delete: "Delete Account",
		logout: "Logout",
	};
	if (detailTitle) detailTitle.textContent = titles[panelId] || "Settings";

	// Inject specific panel HTML based on panelId
	const panelContent = getPanelContent(panelId);
	if (panelContent) {
		detailBody.innerHTML = panelContent;
	}

	// Swap visibility
	console.log("[showMobPanel] Toggling panel visibility");
	mainContent.classList.remove("active-settings-mob-sub");
	detailView.classList.add("active-settings-mob-sub");
};

export const hideMobPanel = () => {
	const mainContent = document.getElementById("settings-mob-content");
	const detailView = document.getElementById("settings-mob-detail");

	if (mainContent && detailView) {
		detailView.classList.remove("active-settings-mob-sub");
		mainContent.classList.add("active-settings-mob-sub");
	}
};

// ── Panel content factories for mobile ──
const getPanelContent = (panelId) => {
	const panels = {
		password: `
			<div class="settings-form">
				<div class="settings-field">
					<label class="settings-field-label">Current password</label>
					<input type="password" class="settings-input" id="settings-pwd-current-mob" placeholder="Enter current password" />
				</div>
				<div class="settings-field">
					<label class="settings-field-label">New password</label>
					<input type="password" class="settings-input" id="settings-pwd-new-mob" placeholder="Create new password" />
					<div class="settings-pwd-strength" id="settings-pwd-strength-mob">
						<div class="settings-pwd-bars">
							<div class="settings-pwd-bar"></div>
							<div class="settings-pwd-bar"></div>
							<div class="settings-pwd-bar"></div>
							<div class="settings-pwd-bar"></div>
						</div>
						<span class="settings-pwd-label">Enter a password</span>
					</div>
				</div>
				<div class="settings-field">
					<label class="settings-field-label">Confirm new password</label>
					<input type="password" class="settings-input" id="settings-pwd-confirm-mob" placeholder="Repeat new password" />
				</div>
				<button class="settings-btn-accent" id="settings-pwd-submit-mob">Update Password</button>
			</div>
		`,
		privacy: `
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
						<select class="settings-inline-select" id="settings-privacy-visibility-mob">
							<option value="public">Public</option>
							<option value="followers">Followers only</option>
							<option value="private">Private</option>
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
					<div class="settings-toggle on" id="settings-toggle-activity-mob" role="switch" aria-checked="true"></div>
				</div>
				<div class="settings-item">
					<div class="settings-item-left">
						<div class="settings-item-icon si-green"><i class="bi bi-people"></i></div>
						<div class="settings-item-text">
							<div class="settings-item-title">Show follower count</div>
							<div class="settings-item-sub">Display your follower count publicly</div>
						</div>
					</div>
					<div class="settings-toggle on" id="settings-toggle-followers-mob" role="switch" aria-checked="true"></div>
				</div>
				<div class="settings-item">
					<div class="settings-item-left">
						<div class="settings-item-icon si-orange"><i class="bi bi-heart"></i></div>
						<div class="settings-item-text">
							<div class="settings-item-title">Show liked tracks</div>
							<div class="settings-item-sub">Let others see tracks you've liked</div>
						</div>
					</div>
					<div class="settings-toggle" id="settings-toggle-likes-mob" role="switch" aria-checked="false"></div>
				</div>
			</div>
		`,
		appearance: `
			<div class="settings-group-label">Theme</div>
			<div class="settings-theme-btns-mobile">
				<button class="settings-theme-btn" data-theme="Dark">
					<i class="bi bi-moon-fill"></i> Dark
				</button>
				<button class="settings-theme-btn" data-theme="Light">
					<i class="bi bi-sun-fill"></i> Light
				</button>
				<button class="settings-theme-btn" data-theme="System">
					<i class="bi bi-laptop"></i> System
				</button>
			</div>
		`,
		notifications: `
			<div class="settings-group">
				<div class="settings-item">
					<div class="settings-item-left">
						<div class="settings-item-icon si-yellow"><i class="bi bi-person-plus"></i></div>
						<div class="settings-item-text">
							<div class="settings-item-title">New followers</div>
							<div class="settings-item-sub">When someone follows you</div>
						</div>
					</div>
					<div class="settings-toggle on" id="settings-notif-followers-mob" role="switch" aria-checked="true"></div>
				</div>
				<div class="settings-item">
					<div class="settings-item-left">
						<div class="settings-item-icon si-green"><i class="bi bi-cloud-upload"></i></div>
						<div class="settings-item-text">
							<div class="settings-item-title">New upload</div>
							<div class="settings-item-sub">From artists you follow</div>
						</div>
					</div>
					<div class="settings-toggle on" id="settings-notif-upload-mob" role="switch" aria-checked="true"></div>
				</div>
				<div class="settings-item">
					<div class="settings-item-left">
						<div class="settings-item-icon si-pink"><i class="bi bi-heart"></i></div>
						<div class="settings-item-text">
							<div class="settings-item-title">Likes on your tracks</div>
							<div class="settings-item-sub">When someone likes your music</div>
						</div>
					</div>
					<div class="settings-toggle" id="settings-notif-likes-mob" role="switch" aria-checked="false"></div>
				</div>
			</div>
		`,
		track: `
			<div class="settings-group-label">Streaming quality</div>
			<div class="settings-select-wrap" style="margin-bottom: 16px">
				<select class="settings-select" id="settings-track-quality-mob">
					<option value="auto">Auto (recommended)</option>
					<option value="low">Low — 96 kbps</option>
					<option value="normal">Normal — 160 kbps</option>
					<option value="high">High — 320 kbps</option>
				</select>
			</div>
			<div class="settings-group-label">Equalizer</div>
			<div class="settings-item">
				<div class="settings-item-left">
					<div class="settings-item-icon si-green"><i class="bi bi-sliders"></i></div>
					<div class="settings-item-text">
						<div class="settings-item-title">Enable equalizer</div>
						<div class="settings-item-sub">Adjust bass, mid, and treble</div>
					</div>
				</div>
				<div class="settings-toggle" id="settings-toggle-eq-mob" role="switch" aria-checked="false"></div>
			</div>
		`,
		language: `
			<div class="settings-group-label">Language</div>
			<div class="settings-select-wrap" style="margin-bottom:16px">
				<select class="settings-select" id="settings-language-mob">
					<option value="en">English</option>
					<option value="yo">Yoruba</option>
					<option value="ig">Igbo</option>
					<option value="ha">Hausa</option>
					<option value="pcm">Pidgin</option>
				</select>
			</div>
			<div class="settings-group-label">Region</div>
			<div class="settings-select-wrap">
				<select class="settings-select" id="settings-region-mob">
					<option value="NG">Nigeria</option>
					<option value="GH">Ghana</option>
					<option value="KE">Kenya</option>
					<option value="ZA">South Africa</option>
					<option value="GB">United Kingdom</option>
					<option value="US">United States</option>
				</select>
			</div>
		`,
		logout: `
			<div style="text-align: center; padding: 20px;">
				<p>You are about to end your session on this device.</p>
				<button class="settings-btn-logout" id="settings-logout-btn-mob" style="margin-top: 16px;">
					<i class="bi bi-box-arrow-right"></i>
					Logout
				</button>
			</div>
		`,
		delete: `
			<div class="settings-danger-zone">
				<div class="settings-danger-text">
					<p class="settings-danger-title">Delete Account</p>
					<p class="settings-danger-sub">
						Permanently delete your account and all associated data.
						Tracks, playlists, followers, and history. This cannot be undone.
					</p>
				</div>
				<button class="settings-danger-btn" id="settings-delete-btn-mob">
					Delete Account
				</button>
			</div>
		`,
	};

	return panels[panelId] || null;
};
