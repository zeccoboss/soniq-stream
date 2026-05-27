export class RouteMatcher {
	#routes = [];
	#notFound = null;

	register(routes) {
		this.#routes = routes;
	}

	setNotFound(handler) {
		this.#notFound = handler;
	}

	get notFound() {
		return this.#notFound;
	}

	parseQuery(searchParams) {
		const query = {};
		for (const [key, raw] of searchParams.entries()) {
			if (raw === "true") {
				query[key] = true;
				continue;
			}
			if (raw === "false") {
				query[key] = false;
				continue;
			}
			const n = Number(raw);
			query[key] = !Number.isNaN(n) && raw.trim() !== "" ? n : raw;
		}
		return query;
	}

	match(path) {
		const segments = path.split("/").filter(Boolean);
		return this.#matchRecursive(segments, this.#routes);
	}

	#matchRecursive(segments, routes, parentParams = {}, stack = []) {
		for (const route of routes) {
			const routeSegs = route.path.split("/").filter(Boolean);

			if (routeSegs.length > segments.length) continue;

			const matches = routeSegs.every(
				(seg, i) => seg.startsWith(":") || seg === segments[i],
			);
			if (!matches) continue;

			const params = { ...parentParams };
			routeSegs.forEach((seg, i) => {
				if (seg.startsWith(":")) params[seg.slice(1)] = segments[i];
			});

			const remaining = segments.slice(routeSegs.length);
			const nextStack = [...stack, route];

			if (remaining.length === 0) return { stack: nextStack, params };

			if (route.children?.length) {
				const child = this.#matchRecursive(
					remaining,
					route.children,
					params,
					nextStack,
				);
				if (child) return child;
			}
		}
		return null;
	}
}
