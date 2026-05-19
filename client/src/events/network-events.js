/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
const listeners = {};

export function on(event, callback) {
	if (!listeners[event]) listeners[event] = [];
	listeners[event].push(callback);
}

export function off(event, callback) {
	if (!listeners[event]) return;
	listeners[event] = listeners[event].filter((cb) => cb !== callback);
}

export function emit(event, data) {
	if (!listeners[event]) return;
	listeners[event].forEach((cb) => cb(data));
}

if (typeof window !== "undefined") {
	const handleNetworkChange = (isOnline) => {
		const appElement = document.getElementById("app");
		if (!appElement) return;

		if (isOnline) {
			appElement.classList.remove("app-offline");
		} else {
			appElement.classList.add("app-offline");

			// Dynamically import your Toast to notify the user
			import("@zecco/components/Toast/Toast.js").then(
				({ default: toast }) => {
					toast({
						message:
							"You are currently offline. SoniqStream is running in disconnected mode.",
						type: "error",
						duration: 4000,
					});
				},
			);
		}
	};

	// FIXED: Subscribing using your custom pub/sub engine instead of native window events
	on("NETWORK_ONLINE", () => handleNetworkChange(true));
	on("NETWORK_OFFLINE", () => handleNetworkChange(false));

	// Initial execution step to handle a user loading the app while already offline
	window.addEventListener("DOMContentLoaded", () => {
		if (!navigator.onLine) {
			document.getElementById("app")?.classList.add("app-offline");
		}
	});
}
