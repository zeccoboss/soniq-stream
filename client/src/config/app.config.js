class AppConfig {
	#apiDevUrl = "http://localhost:3500/api";
	#apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
	get APP_NAME() {
		return import.meta.env.VITE_APP_NAME || "SoniqStream";
	}

	set PAGE_TITLE(title = "Home") {
		document.title = title;
	}

	get PROTECTED_ROUTES() {
		return [
			"/uploads",
			"/dashboard",
			"/profile",
			"/settings",
			"/admin",
			"/library",
		];
	}

	get API_BASE_URL() {
		return this.#apiBaseUrl ?? this.#apiDevUrl;
	}

	get THEMES() {
		return {
			Dark: {
				"--background": "hsl(0, 0%, 10%)",
				"--text": "hsl(0, 3%, 89%)",
				"--accent": "hsl(213, 100%, 50%)",
				"--muted": "rgb(187, 187, 187)",
				"--svg-color": "rgb(221, 221, 221)",
			},
			Light: {
				"--background": "hsl(0, 0%, 100%)",
				"--text": "hsl(0, 2%, 12%)",
				"--accent": "hsl(213, 100%, 50%)",
				"--muted": "rgb(86, 85, 85)",
				"--svg-color": "rgb(21, 20, 20)",
			},
		};
	}
}
const appConfig = new AppConfig();
export { appConfig };
