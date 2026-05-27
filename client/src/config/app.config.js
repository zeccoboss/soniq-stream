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

				"--track-bg": "rgba(255, 255, 255, 0.08)",
				"--vol-track-bg": "rgba(255, 255, 255, 0.10)",
				"--vol-fill-bg": "rgba(255, 255, 255, 0.35)",
			},
			Light: {
				// Base structural colors — bright & clean
				"--bg-base": "hsl(220, 20%, 97%)",
				"--bg-light": "rgba(0, 0, 0, 0.03)",
				"--bg-dark": "rgba(0, 0, 0, 0.05)",
				"--bg-gradient":
					"linear-gradient(135deg, hsl(220, 25%, 98%) 0%, hsl(220, 20%, 95%) 50%, hsl(240, 15%, 93%) 100%)",
				"--overlay-bg": "rgba(0, 0, 0, 0.35)",
				"--bg-surface-solid": "hsl(220, 20%, 94%)",

				// Accent & Brand glows — same hue, adjusted for light bg
				"--accent": "hsl(213, 90%, 50%)",
				"--accent-soft": "hsla(213, 90%, 50%, 0.12)",
				"--accent-glow": "hsla(213, 90%, 50%, 0.25)",

				// Glassmorphism — inverted, dark glass on light bg
				"--glass": "rgba(0, 0, 0, 0.04)",
				"--glass-hover": "rgba(0, 0, 0, 0.07)",
				"--glass-active": "rgba(0, 0, 0, 0.10)",
				"--glass-border": "rgba(0, 0, 0, 0.08)",
				"--glass-border-strong": "rgba(0, 0, 0, 0.14)",
				"--blur": "blur(40px) saturate(180%)",
				"--backdrop":
					"backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);",

				// Typography hierarchy — dark on light
				"--text-1": "hsl(220, 15%, 10%)",
				"--text-2": "hsl(220, 10%, 35%)",
				"--text-3": "hsl(220, 8%,  55%)",

				// Cover art contextual overlays — lighter washes
				"--cover-gradient-start": "hsla(220, 25%, 95%, 0.92)",
				"--cover-gradient-mid": "hsla(220, 20%, 93%, 0.90)",
				"--cover-gradient-end": "hsla(220, 15%, 90%, 0.86)",

				// Additional glassmorphism support
				"--glass-shadow": "0 8px 32px rgba(0, 0, 0, 0.10)",
				"--glass-shadow-sm": "0 4px 16px rgba(0, 0, 0, 0.07)",

				"--track-bg": "rgba(0, 0, 0, 0.10)",
				"--vol-track-bg": "rgba(0, 0, 0, 0.10)",
				"--vol-fill-bg": "rgba(0, 0, 0, 0.25)",
			},
		};
	}
}

const appConfig = new AppConfig();
export { appConfig };
