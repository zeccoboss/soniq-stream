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
			"/upload",
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
				// Base structural colors with depth
				"--bg-base": "hsl(220, 12%, 5%)",
				"--bg-light": "rgba(255, 255, 255, 0.04)",
				"--bg-dark": "rgba(255, 255, 255, 0.06)",
				"--bg-gradient":
					"linear-gradient(135deg, hsl(220, 15%, 10%) 0%, hsl(220, 10%, 8%) 50%, hsl(240, 8%, 6%) 100%)",
				"--overlay-bg": "rgba(0, 0, 0, 0.65)",
				"--bg-surface-solid": "hsl(220, 12%, 8%)",

				// Accent & Brand glows - vibrant
				"--accent": "hsl(213, 95%, 65%)",
				"--accent-soft": "hsla(213, 95%, 65%, 0.15)",
				"--accent-glow": "hsla(213, 95%, 65%, 0.35)",

				// Glassmorphism Core Specs - Enhanced
				"--glass": "rgba(255, 255, 255, 0.06)",
				"--glass-hover": "rgba(255, 255, 255, 0.1)",
				"--glass-active": "rgba(255, 255, 255, 0.12)",
				"--glass-border": "rgba(255, 255, 255, 0.1)",
				"--glass-border-strong": "rgba(255, 255, 255, 0.18)",
				"--blur": "blur(40px) saturate(195%)",
				"--backdrop":
					"backdrop-filter: blur(40px) saturate(195%); -webkit-backdrop-filter: blur(40px) saturate(195%);",

				// Typography hierarchy - enhanced contrast
				"--text-1": "hsl(210, 12%, 96%)",
				"--text-2": "hsl(210, 8%, 70%)",
				"--text-3": "hsl(210, 6%, 45%)",

				// Cover art contextual overlays
				"--cover-gradient-start": "hsla(220, 25%, 14%, 0.96)",
				"--cover-gradient-mid": "hsla(220, 20%, 10%, 0.94)",
				"--cover-gradient-end": "hsla(220, 15%, 8%, 0.90)",

				// Additional glassmorphism support
				"--glass-shadow": "0 8px 32px rgba(0, 0, 0, 0.3)",
				"--glass-shadow-sm": "0 4px 16px rgba(0, 0, 0, 0.2)",
			},
			Light: {
				// Base structural colors - bright & clean
				"--bg-base": "hsl(220, 20%, 96%)",
				"--bg-light": "rgba(0, 0, 0, 0.02)",
				"--bg-dark": "rgba(0, 0, 0, 0.05)",
				"--bg-gradient":
					"linear-gradient(135deg, hsl(220, 25%, 99%) 0%, hsl(220, 20%, 95%) 50%, hsl(220, 18%, 91%) 100%)",
				"--overlay-bg": "rgba(255, 255, 255, 0.6)",
				"--bg-surface-solid": "hsl(220, 30%, 98%)",

				// Accent & Brand glows - vivid
				"--accent": "hsl(213, 95%, 52%)",
				"--accent-soft": "hsla(213, 95%, 52%, 0.12)",
				"--accent-glow": "hsla(213, 95%, 52%, 0.22)",

				// Glassmorphic Frost Specs - Premium
				"--glass": "rgba(255, 255, 255, 0.55)",
				"--glass-hover": "rgba(255, 255, 255, 0.75)",
				"--glass-active": "rgba(255, 255, 255, 0.85)",
				"--glass-border": "rgba(255, 255, 255, 0.6)",
				"--glass-border-strong": "rgba(0, 0, 0, 0.1)",
				"--blur": "blur(40px) saturate(210%)",
				"--backdrop":
					"backdrop-filter: blur(40px) saturate(210%); -webkit-backdrop-filter: blur(40px) saturate(210%);",

				// Dark high-contrast text for readability
				"--text-1": "hsl(220, 25%, 10%)",
				"--text-2": "hsl(220, 15%, 35%)",
				"--text-3": "hsl(220, 10%, 55%)",

				// Clean light cover context overlays
				"--cover-gradient-start": "hsla(220, 28%, 98%, 0.96)",
				"--cover-gradient-mid": "hsla(220, 22%, 96%, 0.94)",
				"--cover-gradient-end": "hsla(220, 18%, 93%, 0.90)",

				// Additional glassmorphism support
				"--glass-shadow": "0 8px 32px rgba(0, 0, 0, 0.08)",
				"--glass-shadow-sm": "0 4px 16px rgba(0, 0, 0, 0.06)",
			},
		};
	}
}

const appConfig = new AppConfig();
export { appConfig };
