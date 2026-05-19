const { v4: uuidV4 } = require("uuid");

class AppConfig {
	#appName = "SoniqStream";

	#port = process.env.NODE_ENV === "production" ? process.env.PORT : 3500;
	#client_base_url = "https://zecco-music-app.vercel.app/";
	#client_dev_url = "http://localhost:5173/";

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
		// Correctly toggles between production and local development, fixing the private syntax error
		return process.env.NODE_ENV === "production"
			? this.#client_base_url
			: this.#client_dev_url;
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
