// core/event-bus.js

/**
 * EventEmitter — Base class for pub/sub across the app.
 *
 * Usage:
 *   class PlayerStore extends EventEmitter { ... }
 *   class AuthService extends EventEmitter { ... }
 *
 * API:
 *   on(event, callback)   → subscribe, returns unsubscribe fn
 *   off(event, callback)  → unsubscribe manually
 *   emit(event, payload)  → fire all listeners for this event
 *   once(event, callback) → subscribe for one emission only
 *   clear(event?)         → clear one event's listeners, or all
 */
export class EventEmitter {
	#listeners = new Map();

	/**
	 * Subscribe to an event.
	 * @param {string} event
	 * @param {Function} callback
	 * @returns {Function} unsubscribe — call to remove this listener
	 */
	on(event, callback) {
		if (!this.#listeners.has(event)) {
			this.#listeners.set(event, new Set());
		}
		this.#listeners.get(event).add(callback);

		// Return unsub fn — matches what playerEvents already expects
		// const unsub = store.player.on("track_changed", cb);
		// unsub(); // removes it
		return () => this.off(event, callback);
	}

	/**
	 * Unsubscribe from an event manually.
	 * @param {string} event
	 * @param {Function} callback
	 */
	off(event, callback) {
		this.#listeners.get(event)?.delete(callback);
	}

	/**
	 * Fire all listeners for an event.
	 * @param {string} event
	 * @param {*} payload
	 */
	emit(event, payload) {
		this.#listeners.get(event)?.forEach((cb) => {
			try {
				cb(payload);
			} catch (err) {
				// Don't let one bad listener break the others
				console.error(`[EventEmitter] Listener error on "${event}":`, err);
			}
		});
	}

	/**
	 * Subscribe for one emission only — auto-removes after first fire.
	 * Useful for "wait for track to load then do X" patterns.
	 * @param {string} event
	 * @param {Function} callback
	 * @returns {Function} unsubscribe — in case you need to cancel before it fires
	 */
	once(event, callback) {
		const wrapper = (payload) => {
			callback(payload);
			this.off(event, wrapper);
		};
		return this.on(event, wrapper);
	}

	/**
	 * Clear listeners for one event, or all events if no arg passed.
	 * Call on unmount of pages that registered many listeners.
	 * @param {string} [event]
	 */
	clear(event) {
		if (event) {
			this.#listeners.delete(event);
		} else {
			this.#listeners.clear();
		}
	}

	/**
	 * Dev utility — see what's currently subscribed.
	 * Strip this out or gate behind isDev in production.
	 */
	debug() {
		const out = {};
		this.#listeners.forEach((set, event) => {
			out[event] = set.size;
		});
		console.table(out);
	}
}

// ── Singleton global bus ───────────────────────────────────────
// For cross-module communication that doesn't belong to any one class.
// Import this directly when you don't want to extend EventEmitter.
//
// Usage:
//   import { bus } from "@zecco/core/event-bus.js";
//   bus.on("user:logout", () => { ... });
//   bus.emit("user:logout");
export const bus = new EventEmitter();
