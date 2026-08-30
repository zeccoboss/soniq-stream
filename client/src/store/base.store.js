// biome-ignore assist/source/organizeImports: <Skip this file for import sorting>
import {
	readFromLocalStorage,
	writeToLocalStorage,
	removeFromLocalStorage,
} from "@zecco/services/storage/local-storage";
import { EventEmitter } from "@zecco/core/event-bus";

/**
 * BaseStore — Base class for all store modules.
 *
 * Extends EventEmitter so every store gets:
 *   this.on(event, cb)     → subscribe, returns unsub fn
 *   this.off(event, cb)    → unsubscribe manually
 *   this.emit(event, data) → fire all listeners
 *   this.once(event, cb)   → subscribe for one fire only
 *   this.clear(event?)     → clear listeners on unmount
 *
 * Also exposes localStorage helpers so child stores
 * don't need to import storage utilities directly.
 */
export class BaseStore extends EventEmitter {
	// ── Storage helpers ──────────────────────────────────────
	// Exposed so child stores call this.storageGet(key)
	// instead of importing storage utils in every module.

	storageGet(key) {
		return readFromLocalStorage(key);
	}

	storageSet(key, value) {
		writeToLocalStorage(key, value);
	}

	storageRemove(key) {
		removeFromLocalStorage(key);
	}
}
