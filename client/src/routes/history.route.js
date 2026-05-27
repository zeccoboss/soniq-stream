export class HistoryManager {
	#stack = [];
	#index = -1;
	#scrollPositions = new Map();

	get stack() {
		return this.#stack;
	}
	get index() {
		return this.#index;
	}

	canGoBack() {
		return this.#index > 0;
	}

	canGoForward() {
		return this.#index < this.#stack.length - 1;
	}

	saveScroll(path, yOffset) {
		this.#scrollPositions.set(path, yOffset);
	}

	getScroll(path) {
		return this.#scrollPositions.get(path) ?? 0;
	}

	sync(path, mode) {
		if (mode === "replace") {
			if (this.#index >= 0) {
				this.#stack[this.#index] = path;
			}
			return;
		}

		if (mode === "pop") {
			const curr = this.#index;
			let found = -1;

			for (let i = curr - 1; i >= 0; i--) {
				if (this.#stack[i] === path) {
					found = i;
					break;
				}
			}
			if (found === -1) {
				for (let i = curr + 1; i < this.#stack.length; i++) {
					if (this.#stack[i] === path) {
						found = i;
						break;
					}
				}
			}

			if (found !== -1) {
				this.#index = found;
			} else {
				this.#stack = [path];
				this.#index = 0;
			}
			return;
		}

		this.#stack = this.#stack.slice(0, this.#index + 1);
		this.#stack.push(path);
		this.#index = this.#stack.length - 1;
	}

	getTarget(direction) {
		if (direction === "back" && this.canGoBack()) {
			return this.#stack[this.#index - 1];
		}
		if (direction === "forward" && this.canGoForward()) {
			return this.#stack[this.#index + 1];
		}
		return null;
	}

	step(direction) {
		if (direction === "back") this.#index--;
		if (direction === "forward") this.#index++;
	}

	reset(initialPath) {
		this.#stack = [initialPath];
		this.#index = 0;
	}
}
