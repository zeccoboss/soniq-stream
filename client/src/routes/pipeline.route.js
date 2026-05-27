export class NavigationPipeline {
	#middlewares = [];
	#authChecker = null;
	#onGuardReject = null;

	setAuthChecker(fn) {
		this.#authChecker = fn;
	}

	setGuardRejectHandler(fn) {
		this.#onGuardReject = fn;
	}

	use(fn) {
		this.#middlewares.push(fn);
	}

	async runGuards(stack, path) {
		const user = this.#authChecker?.();

		for (const route of stack) {
			if (!route.guard) continue;

			const failAuth = route.guard === "auth" && !user;
			const failAdmin =
				route.guard === "admin" && !user?.roles.includes("Admin");

			if (failAuth || failAdmin) {
				try {
					this.#onGuardReject?.({ path });
				} catch (err) {
					console.error(
						"[Router] Error inside onGuardReject handler:",
						err,
					);
				}
				return false;
			}
		}
		return true;
	}

	async runMiddlewares(ctx) {
		for (const mw of this.#middlewares) {
			let called = false;
			let redirectPath = null;

			await mw(ctx, (url) => {
				if (typeof url === "string") {
					redirectPath = url;
				}
				called = true;
			});

			if (redirectPath) return { status: "redirect", url: redirectPath };
			if (!called) return { status: "aborted" };
		}
		return { status: "passed" };
	}
}
