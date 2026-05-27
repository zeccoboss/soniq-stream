import { BaseStore } from "./base.store";

export class UiStore extends BaseStore {
   #activePage = "home";
   #overlayOpen = false;
   #deepLinkTrackId = null;

   get activePage() { return this.#activePage; }
   set activePage(page) {
      if (!page || typeof page !== "string") return;
      this.#activePage = page;
      this.emit("page_changed", page);
   }

   get overlayOpen() { return this.#overlayOpen; }
   openOverlay() { this.#overlayOpen = true; this.emit("overlay_changed", true); }
   closeOverlay() { this.#overlayOpen = false; this.emit("overlay_changed", false); }

   get deepLinkTrackId() { return this.#deepLinkTrackId; }
   
   captureDeepLink() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("track");
      if (id) this.#deepLinkTrackId = id;
      return id ?? null;
   }

   clearDeepLink() { this.#deepLinkTrackId = null; }

   clear() {
      this.#activePage = "home";
      this.#overlayOpen = false;
      this.#deepLinkTrackId = null;
      this.emit("page_changed", "home");
   }
}
