// core/error-handler.js
import { toast } from "@zecco/components/Toast/Toast.js";

const reportError = ({
	message,
	error,
	severity = "error",
	silent = false,
}) => {
	console.error(`[ErrorHandler]`, message, error);
	if (!silent) {
		toast({ message, type: severity === "fatal" ? "error" : "warning" });
	}
	// future: send to backend log endpoint
};

export const initErrorHandler = () => {
	window.addEventListener("error", (e) => {
		reportError({ message: "Something went wrong", error: e.error });
	});

	window.addEventListener("unhandledrejection", (e) => {
		reportError({ message: "A background task failed", error: e.reason });
	});
};

export { reportError };
