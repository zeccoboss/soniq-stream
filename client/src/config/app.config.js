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
				// Base structural colors
				"--bg-base": "hsl(220, 8%, 6%)",
				"--bg-light": "rgba(221, 221, 221, 0.025)",
				"--bg-dark": "rgba(221, 221, 221, 0.04)",
				"--bg-gradient":
					"linear-gradient(135deg, hsl(220, 10%, 12%) 10%, hsl(220, 6%, 8%) 70%, hsl(240, 3%, 8%))",
				"--overlay-bg": "rgba(0, 0, 0, 0.6)",
				"--bg-surface-solid": "#1e1e1e",

				// Accent & Brand glows
				"--accent": "hsl(213, 95%, 65%)",
				"--accent-soft": "hsla(213, 95%, 65%, 0.1)",
				"--accent-glow": "hsla(213, 95%, 65%, 0.28)",

				// Glassmorphism Core Specs
				"--glass": "rgba(255, 255, 255, 0.045)",
				"--glass-hover": "rgba(255, 255, 255, 0.075)",
				"--glass-border": "rgba(255, 255, 255, 0.07)",
				"--glass-border-strong": "rgba(255, 255, 255, 0.12)",
				"--blur": "blur(34px) saturate(180%)",

				// Typography hierarchy
				"--text-1": "hsl(30, 8%, 94%)",
				"--text-2": "hsl(25, 5%, 60%)",
				"--text-3": "hsl(25, 4%, 36%)",

				// Cover art contextual overlays
				"--cover-gradient-start": "hsla(220, 20%, 16%, 0.95)",
				"--cover-gradient-mid": "hsla(220, 14%, 12%, 0.92)",
				"--cover-gradient-end": "hsla(220, 10%, 10%, 0.88)",
			},
			Light: {
				// Base structural colors (shifted to soft clean grays with a hint of blue depth)
				"--bg-base": "hsl(220, 16%, 94%)",
				"--bg-light": "rgba(0, 0, 0, 0.02)",
				"--bg-dark": "rgba(0, 0, 0, 0.05)",
				"--bg-gradient":
					"linear-gradient(135deg, hsl(220, 24%, 98%) 10%, hsl(220, 16%, 92%) 70%, hsl(220, 12%, 88%))",
				"--overlay-bg": "rgba(255, 255, 255, 0.5)",
				"--bg-surface-solid": "#ffffff",

				// Accent & Brand glows
				"--accent": "hsl(213, 95%, 55%)",
				"--accent-soft": "hsla(213, 95%, 55%, 0.08)",
				"--accent-glow": "hsla(213, 95%, 55%, 0.15)",

				// Glassmorphic Frost Specs (Crucial adjustment: translucent white panels)
				"--glass": "rgba(255, 255, 255, 0.45)",
				"--glass-hover": "rgba(255, 255, 255, 0.65)",
				"--glass-border": "rgba(255, 255, 255, 0.5)",
				"--glass-border-strong": "rgba(0, 0, 0, 0.08)",
				"--blur": "blur(34px) saturate(200%)",

				// Dark high-contrast text strings for maximum readability
				"--text-1": "hsl(220, 20%, 12%)",
				"--text-2": "hsl(220, 12%, 38%)",
				"--text-3": "hsl(220, 8%, 56%)",

				// Clean white cover context overlays
				"--cover-gradient-start": "hsla(220, 24%, 100%, 0.94)",
				"--cover-gradient-mid": "hsla(220, 16%, 97%, 0.90)",
				"--cover-gradient-end": "hsla(220, 12%, 94%, 0.86)",
			},
		};
	}
}

const appConfig = new AppConfig();
export { appConfig };
