import { appConfig } from "@zecco/config/app.config";
import { router } from "@zecco/routes/router";
import meService from "@zecco/services/api/me.service";
import { store } from "@zecco/store";

export const authRedirect = async (ctx, next) => {
	// 1. Extract the parsed token directly from the router context query object[cite: 5]
	const accessToken = ctx.query?.accessToken;

	if (accessToken) {
		try {
			store.auth.token = accessToken;

			console.log("[AuthRedirectMiddleWare]:", accessToken);

			const me = await meService.getProfile();
			store.auth.user = me.data;
		} catch (error) {
			console.error(
				"[Auth Middleware] Failed OAuth profile extraction:",
				error,
			);
		}

		await next("/?tab=discover");
		return;
	}

	// 2. Validate protected paths directly via your application configuration
	const protectedRoutes = appConfig.PROTECTED_ROUTES;
	const isProtected = protectedRoutes.some((r) => ctx.path.startsWith(r));

	if (isProtected && !store.auth.user) {
		// Bounce unauthorized guests to login with an encoded callback track
		await next(`/auth/login?redirect=${encodeURIComponent(ctx.path)}`);
		return;
	}

	// Slide into the view layout cleanly
	await next();
};
