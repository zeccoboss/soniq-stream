import { getMultiTags } from "@zecco/helpers/dom-helper";
import { HistoryManager } from "./history.route";
import { RouteMatcher } from "./matcher.route";
import { NavigationPipeline } from "./pipeline.route";
import { ViewRenderer } from "./view.route";

class AppRouter {
	constructor() {
		this.history = new HistoryManager();
		this.matcher = new RouteMatcher();
		this.pipeline = new NavigationPipeline();
		this.view = new ViewRenderer();

		this.isNavigating = false;
		this.prefetched = new Set();
	}

	// ── Configuration Proxies ──────────────────────────────
	addOutlet(name, node) {
		this.view.addOutlet(name, node);
		return this;
	}
	register(routes) {
		this.matcher.register(routes);
		return this;
	}
	setNotFound(fn) {
		this.matcher.setNotFound(fn);
		return this;
	}
	setAuthChecker(fn) {
		this.pipeline.setAuthChecker(fn);
		return this;
	}
	setGuardRejectHandler(fn) {
		this.pipeline.setGuardRejectHandler(fn);
		return this;
	}
	use(fn) {
		this.pipeline.use(fn);
		return this;
	}
	setLayoutBuilder(fn) {
		this.view.setLayoutBuilder(fn);
		return this;
	}

	// ── Core Navigation Engine ─────────────────────────────
	async #navigate(url, historyMode = "push") {
		const fullUrl = new URL(url, location.origin);
		const path = fullUrl.pathname;
		const query = this.matcher.parseQuery(fullUrl.searchParams);

		if (historyMode === "push") {
			this.history.saveScroll(location.pathname, scrollY);
		}

		let match = this.matcher.match(path);

		if (!match && this.matcher.notFound) {
			match = {
				stack: [{ path, component: this.matcher.notFound, outlet: "root" }],
				params: {},
			};
		}

		if (!match) {
			console.warn("[Router] No route matched:", path);
			this.isNavigating = false;
			return;
		}

		const ctx = {
			path,
			params: match.params,
			query,
			input: { ...match.params, ...query },
		};

		// Guards
		const passedGuards = await this.pipeline.runGuards(match.stack, path);
		if (!passedGuards) {
			this.isNavigating = false;
			const targetUrl = path + fullUrl.search;
			await this.#navigate(
				`/auth/login?redirect=${encodeURIComponent(targetUrl)}`,
				"replace",
			);
			return;
		}

		// Middlewares
		const mwResult = await this.pipeline.runMiddlewares(ctx);
		if (mwResult.status === "redirect") {
			this.isNavigating = false;
			await this.#navigate(mwResult.url, "replace");
			return;
		}
		if (mwResult.status === "aborted") {
			this.isNavigating = false;
			return;
		}

		// Render Pipeline
		this.view.startTransition();
		try {
			await this.view.render(match.stack, ctx);
		} catch (err) {
			console.error("[Router] Render error:", err);
		} finally {
			this.view.endTransition();
		}

		// Browser History API
		if (historyMode !== "pop") {
			const newUrl = path + fullUrl.search;
			historyMode === "replace"
				? history.replaceState({ path }, "", newUrl)
				: history.pushState({ path }, "", newUrl);
		}

		// Internal Sync & Scroll Restore
		this.history.sync(path, historyMode);

		queueMicrotask(() => {
			scrollTo(0, this.history.getScroll(path));
		});

		this.isNavigating = false;
	}

	// ── Public API ─────────────────────────────────────────
	navigate(path) {
		if (this.isNavigating) return;
		this.isNavigating = true;
		this.#navigate(path, "push");
	}

	replace(path) {
		if (this.isNavigating) return;
		this.isNavigating = true;
		this.#navigate(path, "replace");
	}

	redirect(path) {
		this.replace(path);
	}

	back(fallback = "/") {
		if (this.isNavigating) return;
		if (this.history.canGoBack()) {
			const target = this.history.getTarget("back");
			this.history.step("back");
			this.isNavigating = true;
			this.#navigate(target, "pop");
		} else {
			this.navigate(fallback);
		}
	}

	forward() {
		if (this.isNavigating || !this.history.canGoForward()) return;
		const target = this.history.getTarget("forward");
		this.history.step("forward");
		this.isNavigating = true;
		this.#navigate(target, "pop");
	}

	prefetch(path) {
		if (this.prefetched.has(path)) return;
		const match = this.matcher.match(path);
		if (!match) return;

		this.prefetched.add(path);
		for (const route of match.stack) {
			if (route.lazy && route.component) route.component().catch(() => {});
		}
	}

	// ── Interceptors & Listeners ───────────────────────────
	interceptLinks() {
		document.addEventListener("click", (e) => {
			const anchor = e.target.closest("a");
			if (!anchor) return;

			if (anchor.hasAttribute("data-back")) {
				e.preventDefault();
				this.back(anchor.getAttribute("data-fallback") || "/");
				return;
			}

			if (anchor.hasAttribute("data-navigation")) {
				anchor.classList.add("active-nav");
				const navs = getMultiTags("[data-navigation]");
				for (const n of navs) {
					if (n !== anchor) n.classList.remove("active-nav");
				}
				this.back(anchor.getAttribute("data-fallback") || "/");
				return;
			}

			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("http") || href === "#") return;

			e.preventDefault();
			anchor.hasAttribute("data-replace")
				? this.replace(href)
				: this.navigate(href);
		});

		document.addEventListener("mouseover", (e) => {
			const anchor = e.target.closest("a");
			if (!anchor) return;
			const href = anchor.getAttribute("href");
			if (href && !href.startsWith("http") && href !== "#") {
				this.prefetch(href);
			}
		});
		return this;
	}

	observeLinks() {
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const href = entry.target.getAttribute("href");
				if (href && !href.startsWith("http")) this.prefetch(href);
			}
		});
		document.querySelectorAll("a[href]").forEach((a) => io.observe(a));
		return this;
	}

	init() {
		if (this.view.outletsSize === 0) {
			console.warn("[Router] No outlets registered.");
		}

		this.history.reset(location.pathname);

		window.addEventListener("popstate", () => {
			if (this.isNavigating) return;
			this.isNavigating = true;
			this.#navigate(location.href, "pop");
		});

		this.interceptLinks();
		this.observeLinks();
		this.#navigate(location.href, "pop");

		return this;
	}
}

export const router = new AppRouter();
