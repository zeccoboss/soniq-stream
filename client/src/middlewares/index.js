/** biome-ignore-all assist/source/organizeImports: <Not intentional for not sorting import> */
import { getTag } from "@zecco/helpers/dom-helper.js";
import { routes } from "@zecco/routes/config.routes";
import { readFromLocalStorage } from "@zecco/services/storage/local-storage.js";
import { authRedirect } from "./auth.middleware";
import { loadingIndicator } from "./loading.middleware";
import { titleUpdater } from "./title.middleware";
import { scrollRestoration } from "./scroll.middleware";
import { analyticsLogger } from "./analytics.middleware";
import { layoutSwitcher } from "./layout.middleware";
import { router } from "@zecco/routes/router.js";
import { buildLayout, getCurrentScreen } from "@zecco/layouts/buildLayout";
import { activeLinkSwitcher } from "./navigation.middleware";
import { rejectMiddleware } from "./reject.middleware";
import { notFound } from "./not-found.middleware";

// This function sets up all the middleware and configurations for the router. It should be called once during the app initialization to apply all the middleware globally.
export const applyMiddleware = () => {
	router
		.setGuardRejectHandler(rejectMiddleware) // Handle guard rejections globally (e.g., show toast on auth failure)
		.addOutlet("root", getTag("#app")) // Set root outlet for rendering pages
		.register(routes) // Register routes from config
		.setNotFound(notFound) // Handle unmatched routes with a 404 page
		.setAuthChecker(() => readFromLocalStorage("user")) // Simple auth check for protected routes
		.setLayoutBuilder(() => buildLayout(getCurrentScreen()))
		.use(activeLinkSwitcher) // Middleware to switch active link in navigation based on current route
		.use(layoutSwitcher) // Middleware to switch layouts based on route or screen size
		.use(authRedirect) // Middleware to redirect unauthenticated users trying to access protected routes to the login page
		.use(loadingIndicator) // Middleware to show a loading indicator during route changes
		.use(scrollRestoration) // Middleware to restore scroll position on navigation
		.use(titleUpdater) // Middleware to update document title based on route metadata
		.use(analyticsLogger) // Middleware to log page views and route changes for analytics
		.init(); // Initialize the router with all configurations and middleware
};
