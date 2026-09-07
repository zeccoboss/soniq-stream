import { router } from "@zecco/routes/router";
import { store } from "@zecco/store/index.js";
import { buildNode } from "@zecco/utils/dom/build-node";
import {
	buildFooterMarkup,
	buildMenuMarkup,
	parseQueryString,
	resolveActiveNavPath,
} from "./Aside.helper.js";
import {
	removeFromLocalStorage,
	writeToLocalStorage,
} from "@zecco/services/storage/local-storage.js";

/**
 * sidebarEvents — all interactivity for the Aside sidebar.
 * Called once, right after Aside.js builds and returns the element.
 *
 * Handles: collapse toggle, footer click, auth-state re-render,
 * route-change-driven nav highlighting (skipping "view" navigations),
 * and cleanup on unmount.
 *
 * @param {Element} sidebarElement - the <aside> built by Aside.js
 */
export const sidebarEvents = (sidebarElement) => {
	const toggleBtn = sidebarElement.querySelector("#sidebar-toggle");
	const logoWrapper = sidebarElement.querySelector("#logo-wrapper");
	let sidebarFooter = sidebarElement.querySelector(".sidebar-footer");

	const appContainer = document.getElementById("app");

	if (!toggleBtn || !logoWrapper) return;

	// ── Active nav tracking — persists across "view" navigations ──
	let currentActivePath = resolveActiveNavPath(
		location.pathname,
		parseQueryString(),
	);

	const applyActiveNav = () => {
		sidebarElement.querySelectorAll("[data-nav-link]").forEach((link) => {
			link.classList.toggle(
				"active-nav",
				link.dataset.navLink === currentActivePath,
			);
		});
	};

	const handleRouteChange = (detail) => {
		const path = detail?.path ?? location.pathname;
		const query = detail?.query ?? parseQueryString();
		const nextPath = resolveActiveNavPath(path, query);
		if (nextPath === null) return; // view navigation — leave the highlight untouched
		currentActivePath = nextPath;
		applyActiveNav();
	};

	applyActiveNav(); // reflect wherever we landed on initial mount

	// ── Footer navigation ──
	const handleFooterClick = () => {
		if (!store.auth.user) {
			router.navigate("/auth/login");
			return;
		}
		router.navigate("/profile");
	};

	// ── Auth-state changes: menu/footer content actually differs per role ──
	const updateSidebarAuthContent = () => {
		const navContentHost = sidebarElement.querySelector(
			"#sidebar-dynamic-content",
		);
		if (navContentHost) {
			navContentHost.innerHTML = buildMenuMarkup(
				store.auth.user,
				currentActivePath,
			);
		}

		const newFooterHTML = buildFooterMarkup(store.auth.user);
		const footerPlaceholder = sidebarElement.querySelector(".sidebar-footer");
		if (footerPlaceholder) {
			footerPlaceholder.replaceWith(buildNode(newFooterHTML));
			const newFooter = sidebarElement.querySelector(".sidebar-footer");
			if (newFooter) {
				sidebarFooter = newFooter;
				newFooter.addEventListener("click", handleFooterClick);
			}
		}
	};

	// ── Subscriptions ──
	const unsubscribeAuth = store.auth.on(
		"auth_store:auth_changed",
		updateSidebarAuthContent,
	);

	const unsubscribeSidebar = store.ui.on(
		"ui_store:sidebar_toggled",
		(isCollapsed) => {
			if (isCollapsed) {
				sidebarElement.classList.add("collapsed");
				appContainer?.classList.add("sidebar-collapsed");

				// Persist the collapsed state in local storage so it can be restored on page reloads
				writeToLocalStorage("sidebar_collapsed", true);
			} else {
				sidebarElement.classList.remove("collapsed");
				appContainer?.classList.remove("sidebar-collapsed");

				// Persist the expanded state in local storage so it can be restored on page reloads
				writeToLocalStorage("sidebar_collapsed", false);
			}
		},
	);

	// Requires the router.js "router:navigate" dispatch — see patch above.
	const onRouterNavigate = (e) => handleRouteChange(e.detail);
	window.addEventListener("router:navigate", onRouterNavigate);

	// ── Trigger actions ──
	const toggleCollapse = () => store.ui.toggleSidebar();

	toggleBtn.addEventListener("click", toggleCollapse);
	logoWrapper.addEventListener("click", toggleCollapse);
	if (sidebarFooter)
		sidebarFooter.addEventListener("click", handleFooterClick);

	// ── Cleanup when the sidebar leaves the DOM ──
	const observer = new MutationObserver(() => {
		if (!document.contains(sidebarElement)) {
			toggleBtn.removeEventListener("click", toggleCollapse);
			logoWrapper.removeEventListener("click", toggleCollapse);
			sidebarFooter?.removeEventListener("click", handleFooterClick);
			window.removeEventListener("router:navigate", onRouterNavigate);
			unsubscribeAuth();
			unsubscribeSidebar();
			observer.disconnect();
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
};
