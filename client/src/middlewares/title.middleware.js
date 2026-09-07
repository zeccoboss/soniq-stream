import { appConfig } from "@zecco/config/app.config";
import { store } from "@zecco/store";

const appName = appConfig.APP_NAME;

const titles = {
	"/": `Home — ${appName}`,
	"/library": `Library — ${appName}`,
	"/search": `Search — ${appName}`,
	"/upload": `Upload — ${appName}`,
	"/settings": `Settings — ${appName}`,
	"/dashboard": `Dashboard — ${appName}`,
};

const transformedTitle = (segment) => {
	if (!segment) return "";
	return segment
		? `${segment.charAt(0).toUpperCase() + segment.slice(1)} — ${appName}`
		: `${appName}`;
};

export const titleUpdater = async (ctx, next) => {
	await next();
	const title = titles[ctx.path];
	if (title) {
		document.title = title;
		return;
	}

	// set active page in store for dynamic routes
	store.ui.activePage = ctx.path;

	// dynamic routes like /profile/:username
	const segment = ctx.path.split("/").filter(Boolean)[0] ?? "";
	document.title = transformedTitle(segment);
};
