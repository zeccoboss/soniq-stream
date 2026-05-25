// @zecco/core/theme-manager.js
import { appConfig } from "@zecco/config/app.config.js";
import {
	readFromLocalStorage,
	writeToLocalStorage,
} from "@zecco/services/storage/local-storage";

class ThemeManager {
	constructor() {
		this.currentTheme = readFromLocalStorage("theme") || "Dark";
	}

	/**
	 * Initializes the theme on application boot
	 */
	init() {
		if (this.currentTheme === "System") {
			this.applySystemTheme();
			this.watchSystemTheme();
		} else {
			this.applyThemeProperties(this.currentTheme);
		}
	}

	/**
	 * Iterates over the config values and injects them into the document root
	 * @param {'Dark' | 'Light'} themeName
	 */
	applyThemeProperties(themeName) {
		const themeData = appConfig.THEMES[themeName];
		if (!themeData) return;

		const root = document.documentElement;

		// Update HTML data attribute for scoped styling if needed
		root.setAttribute("data-theme", themeName.toLowerCase());

		// Dynamically assign each custom property from appConfig
		Object.entries(themeData).forEach(([property, value]) => {
			root.style.setProperty(property, value);
		});

		this.currentTheme = themeName;
	}

	setDark() {
		writeToLocalStorage("theme", "Dark");
		this.applyThemeProperties("Dark");
	}

	setLight() {
		writeToLocalStorage("theme", "Light");
		this.applyThemeProperties("Light");
	}

	setSystem() {
		writeToLocalStorage("theme", "System");
		this.applySystemTheme();
		this.watchSystemTheme();
	}

	applySystemTheme() {
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		const targetTheme = prefersDark ? "Dark" : "Light";
		this.applyThemeProperties(targetTheme);
		this.currentTheme = "System";
	}

	watchSystemTheme() {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		// Remove existing listener if any to avoid duplication
		mediaQuery.onchange = (e) => {
			if (this.currentTheme === "System") {
				const targetTheme = e.matches ? "Dark" : "Light";
				this.applyThemeProperties(targetTheme);
			}
		};
	}
}

export const themeManager = new ThemeManager();
