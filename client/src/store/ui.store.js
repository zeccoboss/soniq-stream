import { BaseStore } from "./base.store";

export class UiStore extends BaseStore {
	#activePage = "home";
	#overlayOpen = false;
	#deepLinkTrackId = null;
	#isSidebarCollapsed = true; // Initial state
	#playerActive = false;

	// --- Active Page ---

	get playerActive() {
		return this.#playerActive;
	}

	set playerActive(active) {
		this.#playerActive = active;
		this.emit("player_active_changed", active);
	}

	get activePage() {
		return this.#activePage;
	}
	set activePage(page) {
		if (!page || typeof page !== "string") return;
		this.#activePage = page;
		this.emit("page_changed", page);
	}

	// --- Sidebar ---
	get isSidebarCollapsed() {
		return this.#isSidebarCollapsed;
	}

	toggleSidebar() {
		this.#isSidebarCollapsed = !this.#isSidebarCollapsed;
		this.emit("sidebar_toggled", this.#isSidebarCollapsed);
	}

	// --- Overlay ---
	get overlayOpen() {
		return this.#overlayOpen;
	}
	openOverlay() {
		this.#overlayOpen = true;
		this.emit("overlay_changed", true);
	}
	closeOverlay() {
		this.#overlayOpen = false;
		this.emit("overlay_changed", false);
	}

	// --- Deep Link ---
	get deepLinkTrackId() {
		return this.#deepLinkTrackId;
	}

	captureDeepLink() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("track");
		if (id) this.#deepLinkTrackId = id;
		return id ?? null;
	}

	clearDeepLink() {
		this.#deepLinkTrackId = null;
	}

	// --- Global Clear ---
	clear() {
		this.#activePage = "home";
		this.#overlayOpen = false;
		this.#deepLinkTrackId = null;
		this.#isSidebarCollapsed = false;
		this.emit("page_changed", "home");
	}
}
