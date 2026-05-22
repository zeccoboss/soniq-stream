const { v4: uuidV4 } = require("uuid");

class AppConfig {
	#appName = "SoniqStream";

	#port =
		process.env.NODE_ENV === "production" ? (process.env.PORT ?? 3500) : 3500;

	get base() {
		return process.env.NODE_ENV === "production"
			? process.env.BASE_URL
			: `http://localhost:${this.port}`;
	}

	get appName() {
		return this.#appName;
	}

	get port() {
		return this.#port;
	}

	get client() {
		const isProd = process.env.NODE_ENV === "production";
		return isProd ? process.env.CLIENT_BASE_URL : "http://localhost:5173";
	}

	date() {
		return Date.now();
	}

	imageName(type) {
		if (!type) {
			console.error("[AppConfig]: Give a valid image type");
			return;
		}
		const time = new Date().toTimeString();
		const date = `${new Date().toDateString()}-${time.slice(0, time.indexOf(" "))}`;
		return `${this.#appName}-${type}-${uuidV4()}-${date}`;
	}

	get trackName() {
		const time = new Date().toTimeString();
		const date = `${new Date().toDateString()}-${time.slice(0, time.indexOf(" "))}`;
		return `${this.#appName}-${uuidV4()}-${date}`;
	}

	// Get the path for local
	local = {
		bannerKey: "images/user-banner.jpg",
		adminAvatarKey: "images/admin-avatar.png",
		userAvatarKey: "images/user-avatar.png",
		coverKey: "images/track-cover.png",
	};
}

const appConfig = new AppConfig();

module.exports = appConfig;
