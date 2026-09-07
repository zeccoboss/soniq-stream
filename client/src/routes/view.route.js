export class ViewRenderer {
	#outlets = new Map();
	#mounted = new Map();
	#layoutBuilder = null;

	get outletsSize() {
		return this.#outlets.size;
	}

	addOutlet(name, node) {
		if (!node) {
			console.warn(`[Router] addOutlet("${name}"): node is null.`);
			return;
		}
		this.#outlets.set(name, node);
	}

	setLayoutBuilder(fn) {
		this.#layoutBuilder = fn;
	}

	startTransition() {
		document.body.classList.add("route-loading");
	}

	endTransition() {
		document.body.classList.remove("route-loading");
	}

	unmountCurrent(outletName) {
		const node = this.#mounted.get(outletName);
		if (!node) return;
		try {
			node.__onUnmount?.();
		} catch (err) {
			console.error(`[Router] __onUnmount error ("${outletName}"):`, err);
		}
	}

	async render(stack, ctx) {
		const leaf = stack.at(-1);
		let outletName = leaf.outlet ?? "main";

		if (typeof outletName === "function") {
			outletName = outletName(ctx);
		}

		// 1. Layout & Outlet Sync
		if (outletName !== "root") {
			const mainOutlet = this.#outlets.get("main");
			const rootOutlet = this.#outlets.get("root");

			if ((!mainOutlet || !mainOutlet.isConnected) && this.#layoutBuilder) {
				try {
					const { shell, main } = await this.#layoutBuilder();
					if (rootOutlet) rootOutlet.replaceChildren(shell);
					this.addOutlet("main", main);
				} catch (err) {
					console.error("[Router] Failed to rebuild layout shell:", err);
				}
			}
		} else {
			this.unmountCurrent("main");
			this.#mounted.delete("main");
		}

		// 2. Component Resolution (Lazy loading support)
		let componentFn = leaf.component;

		if (leaf.lazy) {
			try {
				const mod = await leaf.component();
				componentFn = mod.default ?? mod;
			} catch (err) {
				console.error(
					`[Router] Failed to load lazy component for "${ctx.path}":`,
					err,
				);
				return;
			}
		}

		if (!componentFn) return;

		const node = await componentFn(ctx);
		if (!node) return;

		if (!(node instanceof Node)) {
			console.warn(`[Router] "${ctx.path}" did not return a DOM Node.`);
			return;
		}

		// 3. DOM Injection
		const outlet = this.#outlets.get(outletName);
		if (!outlet) {
			console.warn(`[Router] Outlet "${outletName}" not registered.`);
			return;
		}

		this.unmountCurrent(outletName);
		outlet.replaceChildren(node);
		this.#mounted.set(outletName, node);
	}

	/**
	 * Finds the actual scrollable element for a mounted outlet.
	 * Pages mark their real scroll container with [data-scroll-container] —
	 * the outer page wrapper itself never scrolls (overflow: hidden by design).
	 * Falls back to the mounted node itself if a page hasn't been tagged yet.
	 *
	 * @param {string} [outletName] - checks "main" then "root" if omitted
	 */
	getScrollContainer(outletName) {
		const tryOutlet = (name) => {
			const node = this.#mounted.get(name);
			if (!node) return null;
			return node.querySelector?.("[data-scroll-container]") ?? node;
		};
		if (outletName) return tryOutlet(outletName);
		return tryOutlet("main") ?? tryOutlet("root");
	}
}
