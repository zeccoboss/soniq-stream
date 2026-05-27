import apiClient from "@zecco/config/axios.config.js";

export class BaseService {
	/**
	 * Removes empty query values
	 */
	_cleanParams(params = {}) {
		return Object.fromEntries(
			Object.entries(params).filter(
				([_, value]) =>
					value !== undefined && value !== null && value !== "",
			),
		);
	}

	/**
	 * Standard GET request
	 */
	async get(url, { params = {}, signal } = {}) {
		try {
			const res = await apiClient.get(url, {
				params: this._cleanParams(params),
				signal,
			});

			return res.data;
		} catch (error) {
			this._handleError(error);
		}
	}

	/**
	 * Standard POST request (Updated to forward extra Axios options)
	 */
	async post(url, data = {}, { params = {}, signal, ...options } = {}) {
		try {
			const res = await apiClient.post(url, data, {
				params: this._cleanParams(params),
				signal,
				...options, // <--- This dynamically forwards headers, onUploadProgress, etc.
			});

			return res?.data;
		} catch (error) {
			this._handleError(error);
		}
	}

	/**
	 * Standard PATCH request
	 */
	async patch(url, data = {}, { params = {}, signal } = {}) {
		try {
			const res = await apiClient.patch(url, data, {
				params: this._cleanParams(params),
				signal,
			});

			return res.data;
		} catch (error) {
			this._handleError(error);
		}
	}

	/**
	 * Standard DELETE request
	 */
	async delete(url, { params = {}, signal } = {}) {
		try {
			const res = await apiClient.delete(url, {
				params: this._cleanParams(params),
				signal,
			});

			return res.data;
		} catch (error) {
			this._handleError(error);
		}
	}

	/**
	 * Centralized error formatter
	 */
	_handleError(error) {
		const formattedError = {
			message:
				error.response?.data?.message ||
				error.message ||
				"Something went wrong",
			status: error.response?.status || 500,
			data: error.response?.data || null,
			original: error,
		};

		console.error(`[${this.constructor.name}]`, formattedError);

		throw formattedError;
	}
}
