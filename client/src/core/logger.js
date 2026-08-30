// core/logger.js
import { toast } from "@zecco/components/Toast/Toast.js";

const isDev = import.meta.env.MODE === "development";

const shouldToast = {
	error: true,
	warn: true,
	info: false,
	debug: false,
};

const consoleFn = {
	error: console.error,
	warn: console.warn,
	info: console.info,
	debug: console.log,
};

const log = (
	level,
	message,
	{ context = "", silent = false, meta = null } = {},
) => {
	const prefix = context ? `[${context}]` : "";

	// Always log to console in dev. In prod, skip debug noise.
	if (isDev || level !== "debug") {
		consoleFn[level](prefix, message, meta ?? "");
	}

	// Toast only if this level normally toasts, and not explicitly silenced
	if (shouldToast[level] && !silent) {
		toast({
			message,
			type:
				level === "error" ? "error" : level === "warn" ? "warning" : "info",
		});
	}

	// future: send error/warn to backend log endpoint here
};

export const logger = {
	error: (message, opts) => log("error", message, opts),
	warn: (message, opts) => log("warn", message, opts),
	info: (message, opts) => log("info", message, opts),
	debug: (message, opts) => log("debug", message, opts),
};
