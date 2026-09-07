/**
 * Aside.helper.js
 * Pure functions — HTML string builders and predicates.
 * No DOM queries, no event listeners, no side effects.
 */

/** True if the user object carries the Admin role, however roles are shaped. */
export const hasAdminRole = (user) => {
	if (!user) return false;
	if (Array.isArray(user.roles) && user.roles.includes("Admin")) return true;
	if (
		Array.isArray(user.roles) &&
		user.roles.some((role) => String(role).toLowerCase() === "admin")
	)
		return true;
	return user.isAdmin === true;
};

/** First-letter initials from a display name, max 2 chars, uppercased. */
export const getInitials = (name = "") =>
	name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.substring(0, 2);

/**
 * A "view" navigation (?view=true) is a drill-in from elsewhere in the
 * app — someone else's profile, a shared track, etc. It should never
 * move the sidebar highlight. Pair with utils/view-navigate.js.
 */
export const isViewNavigation = (query = {}) => query?.view === true;

/**
 * Given the current path + query, return the path that should be
 * highlighted — or null, meaning "leave the current highlight alone"
 * (view-mode navigations).
 */
export const resolveActiveNavPath = (path, query = {}) => {
	if (isViewNavigation(query)) return null;
	return path;
};

/** Coerce a location.search string the same way the router's own query parser does. */
export const parseQueryString = (search = location.search) => {
	const params = new URLSearchParams(search);
	const query = {};
	for (const [key, raw] of params.entries()) {
		query[key] = raw === "true" ? true : raw === "false" ? false : raw;
	}
	return query;
};

/** Sidebar footer markup — logged-in identity block or guest placeholder. */
export const buildFooterMarkup = (user) => {
	if (!user) {
		return `
			<footer class="sidebar-footer">
				<div class="avatar">?</div>
				<div class="footer-details">
					<div class="avatar-name">Guest</div>
					<div class="avatar-plan">Not logged in</div>
				</div>
			</footer>
		`;
	}

	const displayName =
		user.displayName && user.username
			? (user.displayName.substring(0, 20) ?? user.username.substring(0, 20))
			: user.username || "User";

	const userRole = user.roles?.[0] || "User";
	const avatarUrl = user.avatar?.url;
	const initials = getInitials(displayName);

	const avatarHTML = avatarUrl
		? `<img src="${avatarUrl}" alt="${displayName}" class="avatar-img" />`
		: `<span class="avatar-text">${initials}</span>`;

	return `
		<footer class="sidebar-footer">
			<div class="avatar">${avatarHTML}</div>
			<div class="footer-details">
				<div class="avatar-name">${displayName}</div>
				<div class="avatar-plan">${userRole}</div>
			</div>
		</footer>
	`;
};

/** Nav menu markup. `activePath` decides which link gets `active-nav`. */
export const buildMenuMarkup = (user, activePath = "/") => {
	const isLoggedIn = !!user;
	const isAdmin = hasAdminRole(user);
	const active = (path) => (path === activePath ? "active-nav" : "");

	return `
		<!-- Main nav section — home/search/notifications/library/upload/dashboard/admin -->
		<nav class="nav">
			<div class="nav-label">Menu</div>
			<div class="nav-item">
				<a href="/" id="home-nav-link" data-nav-link="/" class="nav-links ${active("/")}">
					<i class="bi bi-house-fill nav-icons"></i>
					<span>Home</span>
				</a>
			</div>
			<div class="nav-item">
				<a href="/search" id="search-nav-link" data-nav-link="/search" class="nav-links ${active("/search")}">
					<i class="bi bi-search nav-icons"></i>
					<span>Search</span>
				</a>
			</div>
			<div class="nav-item">
				<a href="/notification" id="notification-nav-link" data-nav-link="/notification" class="nav-links ${active("/notification")}">
					<i class="bi bi-bell nav-icons"></i>
					<span>Notifications</span>
				</a>
			</div>
			${
				isLoggedIn
					? `
				<div class="nav-item">
					<a href="/library" id="lib-nav-link" data-nav-link="/library" class="nav-links library-nav ${active("/library")}">
						<i class="bi bi-music-note-list nav-icons"></i>
						<span>Library</span>
					</a>
				</div>
				<div class="nav-item">
					<a href="/upload" id="upload-nav-link" data-nav-link="/upload" class="nav-links ${active("/upload")}">
						<i class="bi bi-cloud-upload nav-icons"></i>
						<span>Upload</span>
					</a>
				</div>
				<div class="nav-item">
					<a href="/dashboard" id="dashboard-nav-link" data-nav-link="/dashboard" class="nav-links ${active("/dashboard")}">
						<i class="bi bi-speedometer2 nav-icons"></i>
						<span>Dashboard</span>
					</a>
				</div>
				${
					isAdmin
						? `
				<div class="nav-item">
					<a href="/admin" id="admin-nav-link" data-nav-link="/admin" class="nav-links ${active("/admin")}">
						<i class="bi bi-shield-lock nav-icons"></i>
						<span>Admin</span>
					</a>
				</div>
				`
						: ""
				}
			`
					: ""
			}
		</nav>

		<!-- Account nav section — login/register or profile/settings -->
		<nav class="nav">
			<div class="nav-label">Account</div>
			${
				isLoggedIn
					? `
				<div class="nav-item">
					<a href="/profile" id="profile-nav-link" data-nav-link="/profile" class="nav-links ${active("/profile")}">
						<i class="bi bi-person-circle nav-icons"></i>
						<span>Profile</span>
					</a>
				</div>
				<div class="nav-item">
					<a href="/settings" id="settings-nav-link" data-nav-link="/settings" class="nav-links ${active("/settings")}">
						<i class="bi bi-sliders2 nav-icons"></i>
						<span>Settings</span>
					</a>
				</div>
			`
					: `
				<div class="nav-item">
					<a href="/auth/login" id="login-nav-link" data-nav-link="/auth/login" class="nav-links ${active("/auth/login")}">
						<i class="bi bi-box-arrow-in-right nav-icons"></i>
						<span>Login</span>
					</a>
				</div>
				<div class="nav-item">
					<a href="/auth/register/?step=1" id="register-nav-link" data-nav-link="/auth/register/?step=1" class="nav-links ${active("/auth/register")}">
						<i class="bi bi-person-plus nav-icons"></i>
						<span>Sign up</span>
					</a>
				</div>
			`
			}
		</nav>
	`;
};
