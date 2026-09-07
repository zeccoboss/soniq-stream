// client/src/utils/view-navigate.js
import { router } from "@zecco/routes/router.js";

/**
 * Navigate to a page as a "view" — a drill-in from elsewhere in the app
 * that should NOT change which sidebar nav item is highlighted, and
 * whose page should show a back-to-origin control instead of acting
 * like a landing destination.
 *
 * @param {string} path   - e.g. "/profile"
 * @param {Object} params - query params, e.g. { identifier: uuid }
 */
export const viewNavigate = (path, params = {}) => {
	const query = new URLSearchParams({ ...params, view: "true" }).toString();
	router.navigate(`${path}?${query}`);
};
