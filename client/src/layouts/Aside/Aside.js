import { router } from "@zecco/routes/router";
import { store } from "@zecco/store/store";
import {
	readFromSessionStorage,
	writeToSessionStorage,
} from "@zecco/services/storage/session-storage";
import { buildNode } from "@zecco/utils/dom/build-node";
import CreateElement from "@zecco/utils/dom/create-element";

const Aside = () => {
	// ── Restore collapsed state from sessionStorage (default: collapsed) ──
	const savedSidebarState = readFromSessionStorage("sidebar-collapsed");
	const isSidebarCollapsed = savedSidebarState !== "false";

	// Create element
	const sidebar = new CreateElement("aside");

	// Set attributes and add html content
	sidebar.setId("sidebar").addClass("sidebar");

	// Apply collapsed state immediately if it was previously collapsed
	if (isSidebarCollapsed) {
		sidebar.addClass("collapsed");
	}

	// ── Helper: Generate user footer content ──
	const generateFooterContent = () => {
		const user = store.auth.user;

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

		// Get display name from firstName + lastName, fallback to username
		const displayName =
			user.firstName && user.lastName
				? `${user.firstName} ${user.lastName}`.substring(0, 20)
				: user.username || "User";

		// Get user role/plan - show first role or default to "User"
		const userRole = user.roles?.[0] || "User";

		// Get avatar URL or generate initials
		const avatarUrl = user.avatar?.url;
		const initials = displayName
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);

		const avatarHTML = avatarUrl
			? `<img src="${avatarUrl}" alt="${displayName}" class="avatar-img" />`
			: `<span class="avatar-text">${initials}</span>`;

		return `
			<footer class="sidebar-footer">
				<div class="avatar">
					${avatarHTML}
				</div>
				<div class="footer-details">
					<div class="avatar-name">${displayName}</div>
					<div class="avatar-plan">${userRole}</div>
				</div>
			</footer>
		`;
	};

	const hasAdminRole = (user) => {
		if (!user) return false;

		// Keep in sync with route guard expectation: roles includes "Admin"
		if (Array.isArray(user.roles) && user.roles.includes("Admin")) return true;

		// Fallback for payloads that may expose lowercase role strings
		if (
			Array.isArray(user.roles) &&
			user.roles.some((role) => String(role).toLowerCase() === "admin")
		) {
			return true;
		}

		// Boolean fallback only when explicitly true boolean
		return user.isAdmin === true;
	};

	const generateMenuContent = () => {
		const user = store.auth.user;
		const isLoggedIn = !!user;
		const isAdmin = hasAdminRole(user);

		return `
			<nav class="nav">
				<div class="nav-label">Menu</div>
				<div class="nav-item">
					<a href="/" id="home-nav-link" data-nav-link="/" class="nav-links active-nav">
						<i class="bi bi-house-fill nav-icons"></i>
						<span>Home</span>
					</a>
				</div>
				<div class="nav-item">
					<a href="/search" id="search-nav-link" data-nav-link="/search" class="nav-links">
						<i class="bi bi-search nav-icons"></i>
						<span>Search</span>
					</a>
				</div>
				${
					isLoggedIn
						? `
					<div class="nav-item">
						<a href="/library" id="lib-nav-link" data-nav-link="/library" class="nav-links library-nav">
							<i class="bi bi-music-note-list nav-icons"></i>
							<span>Library</span>
						</a>
					</div>
					<div class="nav-item">
						<a href="/upload" id="upload-nav-link" data-nav-link="/upload" class="nav-links">
							<i class="bi bi-cloud-upload nav-icons"></i>
							<span>Upload</span>
						</a>
					</div>
					<div class="nav-item">
						<a href="/dashboard" id="dashboard-nav-link" data-nav-link="/dashboard" class="nav-links">
							<i class="bi bi-speedometer2 nav-icons"></i>
							<span>Dashboard</span>
						</a>
					</div>
					${
						isAdmin
							? `
					<div class="nav-item">
						<a href="/admin" id="admin-nav-link" data-nav-link="/admin" class="nav-links">
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
			<nav class="nav">
				<div class="nav-label">Account</div>
				${
					isLoggedIn
						? `
					<div class="nav-item">
						<a href="/profile" id="profile-nav-link" data-nav-link="/profile" class="nav-links">
							<i class="bi bi-person-circle nav-icons"></i>
							<span>Profile</span>
						</a>
					</div>
					<div class="nav-item">
						<a href="/settings" id="settings-nav-link" data-nav-link="/settings" class="nav-links">
							<i class="bi bi-sliders2 nav-icons"></i>
							<span>Settings</span>
						</a>
					</div>
				`
						: `
					<div class="nav-item">
						<a href="/auth/login" id="login-nav-link" data-nav-link="/auth/login" class="nav-links">
							<i class="bi bi-box-arrow-in-right nav-icons"></i>
							<span>Login</span>
						</a>
					</div>
					<div class="nav-item">
						<a href="/auth/register/?step=1" id="register-nav-link" data-nav-link="/auth/register" class="nav-links">
							<i class="bi bi-person-plus nav-icons"></i>
							<span>Sign up</span>
						</a>
					</div>
				`
				}
			</nav>
		`;
	};

	// Create the header containing the logo and the toggle button
	const headerNode = buildNode(`
		<div class="sidebar-header">
			<div id="logo-wrapper" class="logo-wrapper" title="Toggle Menu">
				<div class="logo logo-embedded" id="app-logo">
					<div class="logo-icon logo-orb">
						<span class="logo-orb-ring"></span>
						<i class="bi bi-soundwave"></i>
					</div>
					<h1 class="logo-text">Soniq<span>Stream</span></h1>
				</div>
			</div>
			<button id="sidebar-toggle" class="sidebar-toggle" title="Collapse Menu">
				<i class="bi bi-layout-sidebar-inset"></i>
			</button>
		</div>
	`);

	const content = `
		<div id="sidebar-dynamic-content">
			${generateMenuContent()}
		</div>
		${generateFooterContent()}
	`;

	sidebar.append(headerNode, buildNode(content));
	const sidebarElement = sidebar.getElement();

	// ── Interactivity Logic ──
	// Wait for DOM to settle before attaching listeners
	requestAnimationFrame(() => {
		const toggleBtn = sidebarElement.querySelector("#sidebar-toggle");
		const logoWrapper = sidebarElement.querySelector("#logo-wrapper");
		let sidebarFooter = sidebarElement.querySelector(".sidebar-footer");
		const appContainer = document.getElementById("app");

		if (!toggleBtn || !logoWrapper) return; // Elements might not be mounted yet

		// If sidebar is collapsed, apply the class to app container too
		if (isSidebarCollapsed && appContainer) {
			appContainer.classList.add("sidebar-collapsed");
		}

		// Navigate to profile on footer click
		const handleFooterClick = () => {
			if (!store.auth.user) {
				router.navigate("/auth/login");
				return;
			}
			router.navigate("/profile");
		};

		// ── Update footer when user changes ──
		const updateSidebarAuthContent = () => {
			const navContentHost = sidebarElement.querySelector(
				"#sidebar-dynamic-content",
			);
			if (navContentHost) {
				navContentHost.innerHTML = generateMenuContent();
			}

			const newFooterHTML = generateFooterContent();
			const footerPlaceholder =
				sidebarElement.querySelector(".sidebar-footer");
			if (footerPlaceholder) {
				footerPlaceholder.replaceWith(buildNode(newFooterHTML));
				// Re-attach click listener to new footer
				const newFooter = sidebarElement.querySelector(".sidebar-footer");
				if (newFooter) {
					sidebarFooter = newFooter;
					newFooter.addEventListener("click", handleFooterClick);
				}
			}
		};

		// Subscribe to auth changes
		const unsubscribeAuth = store.auth.on(
			"auth_changed",
			updateSidebarAuthContent,
		);

		// Click toggle to shrink
		const toggleCollapse = () => {
			sidebarElement.classList.add("collapsed");
			if (appContainer) appContainer.classList.add("sidebar-collapsed");
			writeToSessionStorage("sidebar-collapsed", "true");
		};

		// Toggle sidebar on logo/button click
		const handleLogoClick = () => {
			if (sidebarElement.classList.contains("collapsed")) {
				// Expand
				sidebarElement.classList.remove("collapsed");
				if (appContainer)
					appContainer.classList.remove("sidebar-collapsed");
				writeToSessionStorage("sidebar-collapsed", "false");
			} else {
				// Collapse
				sidebarElement.classList.add("collapsed");
				if (appContainer) appContainer.classList.add("sidebar-collapsed");
				writeToSessionStorage("sidebar-collapsed", "true");
			}
		};

		toggleBtn.addEventListener("click", toggleCollapse);
		logoWrapper.addEventListener("click", handleLogoClick);

		// Make footer clickable
		if (sidebarFooter) {
			sidebarFooter.addEventListener("click", handleFooterClick);
		}

		// Clean up listeners when sidebar is removed
		const observer = new MutationObserver(() => {
			if (!document.contains(sidebarElement)) {
				toggleBtn.removeEventListener("click", toggleCollapse);
				logoWrapper.removeEventListener("click", handleLogoClick);
				if (sidebarFooter) {
					sidebarFooter.removeEventListener("click", handleFooterClick);
				}
				unsubscribeAuth();
				observer.disconnect();
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });
	});

	return sidebarElement;
};

export default Aside;
