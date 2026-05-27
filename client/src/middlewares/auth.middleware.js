import { appConfig } from "@zecco/config/app.config";
import { store } from "@zecco/store/store";

export const authRedirect = async (ctx, next) => {
	// 1. Extract the parsed token directly from the router context query object[cite: 5]
	const accessToken = ctx.query?.accessToken;

	if (accessToken) {
		try {
			// Your store setter automatically handles the memory cache and localStorage backup
			store.auth.token = accessToken;

			// Query your production Railway user engine
			const response = await fetch(
				"https://soniq-stream.up.railway.app/api/v1/users/me",
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);

			if (response.ok) {
				// Your store setter handles user state hydration dynamically
				store.auth.user = await response.json();
			}
		} catch (error) {
			console.error(
				"[Auth Middleware] Failed OAuth profile extraction:",
				error,
			);
		}

		// Hand the destination to next(). The engine automatically catches this path,
		// safely clears the navigation lock, and fires its internal .replace() method
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
