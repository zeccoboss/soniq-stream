import { appConfig } from "@zecco/config/app.config";
import { setActivePage } from "@zecco/helpers/page-helpers";

const NotFoundRenderer = () => {
	appConfig.PAGE_TITLE = "404 | Resource Not Found"; // Change the app title
	//
	const page = document.getElementById("no-resource-page");

	// Show the page
	setActivePage(page, "active-page");
};

export default NotFoundRenderer;
