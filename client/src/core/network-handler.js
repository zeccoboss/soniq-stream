import { emit } from "@zecco/events/network-events.js";

export const NETWORK_STATUS = Object.freeze({
	ONLINE: "online",
	OFFLINE: "offline",
});

class NetworkHandler {
	constructor() {
		this.status = navigator.onLine
			? NETWORK_STATUS.ONLINE
			: NETWORK_STATUS.OFFLINE;

		// FIXED: Bind handlers explicitly so removeEventListener works seamlessly
		this.setOnline = this.setOnline.bind(this);
		this.setOffline = this.setOffline.bind(this);

		this.init();
	}

	init() {
		// Clean up previous instances perfectly before rebinding
		window.removeEventListener("online", this.setOnline);
		window.removeEventListener("offline", this.setOffline);

		window.addEventListener("online", this.setOnline);
		window.addEventListener("offline", this.setOffline);
	}

	setOnline() {
		this.status = NETWORK_STATUS.ONLINE;
		emit("NETWORK_ONLINE", { status: this.status });
	}

	setOffline() {
		this.status = NETWORK_STATUS.OFFLINE;
		emit("NETWORK_OFFLINE", { status: this.status });
	}

	getStatus() {
		return this.status;
	}
}

const networkHandler = new NetworkHandler();

export { networkHandler };
