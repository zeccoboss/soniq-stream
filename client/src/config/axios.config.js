import { appConfig } from "@zecco/config/app.config";
import { router } from "@zecco/routes/router";
import { readFromLocalStorage } from "@zecco/services/storage/local-storage";
import { store } from "@zecco/store/store.js";
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
	(error) => Promise.reject(error),
);

// ========================================================
// Response Interceptor Global State
// ========================================================
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

// ========================================================
// Response Interceptor
// ========================================================
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (!originalRequest) return Promise.reject(error);

		// Check if it's explicitly an expired token
		const isUnauthorized = error.response?.status === 401;
		const isTokenExpired = error.response?.data?.code === "TOKEN_EXPIRED";
		const isAuthMissingOrInvalid =
			error.response?.data?.code === "UNAUTHENTICATED";
		const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
		const shouldTryRefresh =
			isUnauthorized &&
			(isTokenExpired ||
				isAuthMissingOrInvalid ||
				!error.response?.data?.code);

		if (shouldTryRefresh && !originalRequest._retry && !isRefreshRequest) {
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
				// Use base axios to avoid triggering the request interceptor
				axios
					.get(`${appConfig.API_BASE_URL}/auth/refresh`, {
						withCredentials: true,
					})
					.then((response) => {
						const newAccessToken = response?.data?.accessToken;
						if (!newAccessToken) {
							throw new Error(
								"Missing access token from refresh response",
							);
						}
						store.auth.token = newAccessToken;

						apiClient.defaults.headers.common["Authorization"] =
							`Bearer ${newAccessToken}`;
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

						processQueue(null, newAccessToken);
						resolve(apiClient(originalRequest));
					})
					.catch((err) => {
						processQueue(err, null);
						store.auth.clear();
						router.replace("/auth/login");
						reject(err);
					})
					.finally(() => {
						isRefreshing = false;
					});
			});
		}

		return Promise.reject(error);
	},
);

export default apiClient;
