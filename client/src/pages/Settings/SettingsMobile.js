import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Settings.styles.css";

/**
 * SettingsMobile — Mobile settings view component
 *
 * Mobile settings uses a flat list pattern instead of the
 * sidebar + panels layout. Tapping a row navigates into a
 * detail panel (shown/hidden via sub-section toggle) rather
 * than a side-by-side split.
 *
 * @async
 * @param {Object} props
 * @param {string} props.state - "skeleton" | "auth" | "content" | "loading" | "error"
 * @param {Object} props.ctx - Router context
 * @param {Object} props.userData - Current user data
 * @param {Object} props.settingsData - User settings/preferences
 * @returns {Promise<Element>} The settings section element
 */
export const SettingsMobile = async ({
	state,
	ctx,
	userData,
	settingsData,
}) => {
	const root = new CreateElement("section");
	root
		.addClass("settings-section-mobile", "")
		.setId("settings-section-mobile");

	// ── State factories ──────────────────────────────────────

	const buildView = (markup) => {
		const fragment = buildNode(markup);
		return fragment.firstElementChild ?? fragment;
	};

	const header = () =>
		buildNode(`
			<header class="settings-mob-header">
				<h2 class="settings-mob-title">Settings</h2>
				<button class="settings-mob-search-btn" id="settings-mob-search-btn" title="Search settings" disabled>
					<i class="bi bi-search"></i>
				</button>
			</header>
		`);

	const authGate = () =>
		buildView(`
			<section class="settings-mob-sub" id="settings-mob-auth" data-content="auth">
				<div class="settings-mob-auth-icon">
					<i class="bi bi-gear-fill"></i>
				</div>
				<h3 class="settings-mob-auth-title">Settings require an account</h3>
				<p class="settings-mob-auth-sub">
					Log in to manage your profile, preferences, and privacy.
				</p>
				<div class="settings-mob-auth-btns">
					<a href="/auth/login" class="settings-mob-btn-accent">Login</a>
					<a href="/auth/register" class="settings-mob-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	// Main list view — the "home" screen of mobile settings
	const contentState = () =>
		buildView(`
			<section class="settings-mob-sub settings-mob-panel settings-mob-panel--main is-active" id="settings-mob-content" data-content="content">
				<div class="settings-mob-scroll">

					<!-- ── Profile card ── -->
					<div class="settings-mob-profile-card" id="settings-mob-profile-card">
						<div class="settings-mob-avatar-wrap">
							<img
								src="${userData?.avatar || defaultAvatar}"
								alt="Profile avatar"
								class="settings-mob-avatar-img"
								id="settings-mob-avatar-img"
								onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
							/>
							<div class="settings-mob-avatar-fallback" id="settings-mob-avatar-fallback">${userData?.username?.[0]?.toUpperCase() || "—"}</div>
						</div>
						<div class="settings-mob-profile-info">
							<p class="settings-mob-profile-name" id="settings-mob-display-name">${userData?.username || "—"}</p>
							<p class="settings-mob-profile-plan" id="settings-mob-display-plan">${userData?.isAdmin ? "Admin" : "Free plan"}</p>
						</div>
						<i class="bi bi-chevron-right settings-mob-chevron"></i>
					</div>

					<!-- ── Account group ── -->
					<div class="settings-mob-group-label">Account</div>
					<div class="settings-mob-group">
						<button class="settings-mob-row" data-panel="profile" id="settings-mob-nav-profile">
							<span class="settings-mob-row-icon si-blue"><i class="bi bi-person-fill"></i></span>
							<span class="settings-mob-row-label">Edit Profile</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
						<button class="settings-mob-row" data-panel="password" id="settings-mob-nav-password">
							<span class="settings-mob-row-icon si-purple"><i class="bi bi-lock-fill"></i></span>
							<span class="settings-mob-row-label">Password</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
						<button class="settings-mob-row" data-panel="privacy" id="settings-mob-nav-privacy">
							<span class="settings-mob-row-icon si-blue"><i class="bi bi-shield-fill"></i></span>
							<span class="settings-mob-row-label">Privacy</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
					</div>

					<!-- ── Preferences group ── -->
					<div class="settings-mob-group-label">Preferences</div>
					<div class="settings-mob-group">
						<button class="settings-mob-row" data-panel="appearance" id="settings-mob-nav-appearance">
							<span class="settings-mob-row-icon si-purple"><i class="bi bi-palette"></i></span>
							<span class="settings-mob-row-label">Appearance</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
						<button class="settings-mob-row" data-panel="notifications" id="settings-mob-nav-notifications">
							<span class="settings-mob-row-icon si-yellow"><i class="bi bi-bell-fill"></i></span>
							<span class="settings-mob-row-label">Notifications</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
						<button class="settings-mob-row" data-panel="track" id="settings-mob-nav-track">
							<span class="settings-mob-row-icon si-green"><i class="bi bi-volume-up-fill"></i></span>
							<span class="settings-mob-row-label">Audio</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
						<button class="settings-mob-row" data-panel="language" id="settings-mob-nav-language">
							<span class="settings-mob-row-icon si-orange"><i class="bi bi-globe"></i></span>
							<span class="settings-mob-row-label">Language & Region</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
					</div>

					<!-- ── Session group ── -->
					<div class="settings-mob-group-label">Session</div>
					<div class="settings-mob-group">
						<button class="settings-mob-row" data-panel="logout" id="settings-mob-nav-logout">
							<span class="settings-mob-row-icon si-yellow"><i class="bi bi-box-arrow-right"></i></span>
							<span class="settings-mob-row-label">Logout</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
					</div>

					<!-- ── Danger group ── -->
					<div class="settings-mob-group-label settings-mob-group-label--danger">Danger</div>
					<div class="settings-mob-group">
						<button class="settings-mob-row settings-mob-row--danger" data-panel="delete" id="settings-mob-nav-delete">
							<span class="settings-mob-row-icon si-red"><i class="bi bi-trash-fill"></i></span>
							<span class="settings-mob-row-label">Delete Account</span>
							<i class="bi bi-chevron-right settings-mob-chevron"></i>
						</button>
					</div>

				</div>
			</section>
		`);

	// Detail panel — slides in when a row is tapped
	// Your events file calls showMobPanel(panelId) to swap content
	const detailPanel = () =>
		buildView(`
			<section class="settings-mob-sub settings-mob-panel settings-mob-panel--detail" id="settings-mob-detail" data-content="detail">
				<div class="settings-mob-detail-header">
					<button class="settings-mob-back-btn" id="settings-mob-back-btn">
						<i class="bi bi-arrow-left"></i>
					</button>
					<h2 class="settings-mob-detail-title" id="settings-mob-detail-title">Settings</h2>
				</div>
				<div class="settings-mob-detail-body" id="settings-mob-detail-body">
					<!-- Panel content injected by settings.events.js -->
				</div>
			</section>
		`);

	const loadingState = () =>
		buildView(`
			<section class="settings-mob-sub" id="settings-mob-loading" data-content="loading">
				<div class="settings-mob-loading-ring">
					<svg width="28" height="28" fill="none" viewBox="0 0 24 24" class="settings-spinner">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"
							stroke-dasharray="60" stroke-dashoffset="20" stroke-linecap="round"/>
					</svg>
				</div>
				<p class="settings-mob-loading-text">Saving changes...</p>
			</section>
		`);

	const errorState = () =>
		buildView(`
			<section class="settings-mob-sub" id="settings-mob-error" data-content="error">
				<div class="settings-mob-error-icon">
					<i class="bi bi-exclamation-triangle-fill"></i>
				</div>
				<h3 class="settings-mob-error-title">Something went wrong</h3>
				<p class="settings-mob-error-sub" id="settings-mob-error-msg">
					We couldn't save your changes. Please try again.
				</p>
				<button class="settings-mob-btn-accent" id="settings-mob-error-retry">
					Try Again
				</button>
			</section>
		`);

	const skeletonState = () =>
		buildView(`
			<section class="settings-mob-sub" id="settings-mob-skeleton" data-content="skeleton">
				<div class="settings-mob-scroll">

					<!-- skeleton profile card -->
					<div class="settings-mob-profile-card" style="pointer-events:none">
						<div class="settings-skeleton settings-skeleton--avatar-mob"></div>
						<div style="flex:1;display:flex;flex-direction:column;gap:6px">
							<div class="settings-skeleton settings-skeleton--text-md-mob"></div>
							<div class="settings-skeleton settings-skeleton--text-sm-mob" style="width:50%"></div>
						</div>
					</div>

					<!-- skeleton rows -->
					${["Account", "Preferences"]
						.map(
							(label) => `
						<div class="settings-mob-group-label">${label}</div>
						<div class="settings-mob-group">
							${[1, 2, 3]
								.map(
									() => `
								<div class="settings-mob-row" style="pointer-events:none">
									<div class="settings-skeleton settings-skeleton--icon-mob"></div>
									<div class="settings-skeleton settings-skeleton--text-md-mob" style="flex:1"></div>
								</div>
							`,
								)
								.join("")}
						</div>
					`,
						)
						.join("")}
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
			case "skeleton":
				return skeletonState();
			default:
				return skeletonState();
		}
	};
	const stage = buildNode(`<div class="settings-mob-stage"></div>`);
	const currentView = getStateView(state);
	currentView.classList.add(
		"settings-mob-panel",
		"settings-mob-panel--main",
		"is-active",
	);
	const detail = detailPanel();
	stage.append(currentView, detail);

	root.append(header(), stage);
	return root.getElement();
};
