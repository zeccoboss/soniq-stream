import { BaseStore } from "./base.store";

class AuthStore extends BaseStore {
	#user = null;
	#token = null;

	get user() {
		return this.#user;
	}
	set user(data) {
		if (!data || typeof data !== "object") {
			console.error("[AuthStore]: Invalid user data.");
			return;
		}

		// Default fallback settings in case a new or unverified user document lacks them
		const defaultSettings = {
			theme: "Dark",
			language: "en",
			region: "NG",
			streamingQuality: "auto",
			notificationUploads: true,
			notificationLikes: false,
			profileVisibility: "public",
		};

		this.#user = {
			uuid: data.uuid ?? null,
			username: data.username ?? null,
			email: data.email ?? null,
			avatar: data.avatar ?? null,
			isVerified: data.isVerified ?? false,
			isAdmin: data.isAdmin ?? false,
			...data,
			// Nest your settings object safely right inside the user model
			settings: { ...defaultSettings, ...data.settings },
		};

		this.storageSet("user", this.#user);
		this.emit("auth_store:auth_changed", this.#user);
		// Optional: Emit a dedicated settings event so UI elements like Theme togglers don't have to listen to a massive profile block change
		this.emit("auth_store:settings_changed", this.#user.settings);
	}

	get settings() {
		return this.#user?.settings ?? null;
	}

	/**
	 * Updates specific root user details or nested settings profiles in memory
	 */
	updateUser(fields, value = null) {
		if (!this.#user) return console.error("[AuthStore]: No user to update.");

		const updates = typeof fields === "string" ? { [fields]: value } : fields;
		if (!updates || typeof updates !== "object") return;

		this.#user = { ...this.#user, ...updates };
		this.storageSet("user", this.#user);
		this.emit("auth_store:auth_changed", this.#user);
	}

	/**
	 * Explicit shorthand helper for updating app preferences cleanly
	 */
	updateSettings(settingsFields, value = null) {
		if (!this.#user) return;

		const updates =
			typeof settingsFields === "string"
				? { [settingsFields]: value }
				: settingsFields;
		if (!updates || typeof updates !== "object") return;

		this.#user.settings = { ...this.#user.settings, ...updates };
		this.storageSet("user", this.#user);

		this.emit("auth_store:auth_changed", this.#user);
		this.emit("auth_store:settings_changed", this.#user.settings);
	}

	get token() {
		return this.#token;
	}
	set token(value) {
		if (!value || typeof value !== "string") {
			this.storageRemove("token");
			return;
		}
		this.#token = value;
		this.storageSet("token", value);
	}

	get isLoggedIn() {
		return !!this.#token;
	}
	get isAuthenticated() {
		return !!this.#token || !!this.storageGet("token");
	}

	setAuth(user, token) {
		this.token = token;
		this.user = user; // Set user last so it captures token availability if needed
	}

	clear() {
		this.#user = null;
		this.#token = null;
		this.storageRemove("token");
		this.storageRemove("user");
		this.emit("auth_store:auth_changed", null);
		this.emit("auth_store:settings_changed", null);
	}

	init() {
		const token = this.storageGet("token");
		const user = this.storageGet("user");
		if (token) this.#token = token;
		if (user) this.#user = user;
	}
}

export { AuthStore };
