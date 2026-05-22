// @zecco/config/axios.config.js
import { appConfig } from "@zecco/config/app.config";
import { router } from "@zecco/routes/router";
import {
	readFromLocalStorage,
	removeFromLocalStorage,
	writeToLocalStorage,
} from "@zecco/services/storage/local-storage";
import axios from "axios";

const apiClient = axios.create({
	baseURL: appConfig.API_BASE_URL,
	timeout: 15000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// ========================================================
// Request Interceptor
// ========================================================

apiClient.interceptors.request.use(
	(config) => {
		const token = readFromLocalStorage("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// ========================================================
// Response Interceptor
// ========================================================

// 1. Move the queue state OUTSIDE the interceptor function entirely
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

// 2. A single, flattened response interceptor
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// 401 Token Refresh Logic
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return apiClient(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			return new Promise((resolve, reject) => {
				apiClient
					.get("/auth/refresh")
					.then((response) => {
						const newAccessToken = response.data.accessToken;
						writeToLocalStorage("token", newAccessToken);

						apiClient.defaults.headers.common["Authorization"] =
							`Bearer ${newAccessToken}`;
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

						processQueue(null, newAccessToken);
						resolve(apiClient(originalRequest));
					})
					.catch((err) => {
						processQueue(err, null);
						removeFromLocalStorage("token");
						router.navigate("/login");
						reject(err);
					})
					.finally(() => {
						isRefreshing = false;
					});
			});
		}

		// THIS LINE FIXES THE FRONTEND CRASH
		// It ensures base.service.js receives the error to format it properly.
		return Promise.reject(error);
	},
);

export default apiClient;
