import { readFromLocalStorage, writeToLocalStorage, removeFromLocalStorage } from "@zecco/services/storage/local-storage";

export class BaseStore {
   #events = {};

   /**
    * Subscribe to a store modification event
    * @param {string} event 
    * @param {Function} callback 
    * @returns {Function} Unsubscribe cleanup function
    */
   on(event, callback) {
      if (!this.#events[event]) {
         this.#events[event] = [];
      }
      this.#events[event].push(callback);
      return () => this.off(event, callback);
   }

   off(event, callback) {
      if (!this.#events[event]) return;
      this.#events[event] = this.#events[event].filter(cb => cb !== callback);
   }

   emit(event, data) {
      if (!this.#events[event]) return;
      for (let i = this.#events[event].length - 1; i >= 0; i--) {
         this.#events[event][i](data);
      }
   }

   // Local Storage Utilities exposed safely to modules
   storageGet(key) { return readFromLocalStorage(key); }
   storageSet(key, val) { writeToLocalStorage(key, val); }
   storageRemove(key) { removeFromLocalStorage(key); }
}
