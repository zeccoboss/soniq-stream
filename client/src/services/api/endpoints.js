// ======================================================
// API ENDPOINTS
// Centralized endpoint registry
// ======================================================

export const ENDPOINTS = {
	// ==================================================
	// Admin
	// ==================================================

	ADMIN: {
		BASE: "/admin",
		OVERVIEW: "/admin/overview",
		USERS: "/admin/users",
		REPORTS: "/admin/reports",
		TRACKS: "/admin/tracks",
		STATS: "/admin/stats",
		RESOLVE_REPORT: (report_uuid) => `/admin/reports/${report_uuid}`,
		SETTINGS: "/admin/settings", // No specific route in the backend yet, but this is a placeholder for future admin settings endpoints
		DELETE_TRACK: (track_uuid) => `/admin/tracks/${track_uuid}`,
		UPDATE_USER_ROLE: (user_uuid) => `/admin/users/${user_uuid}/role`,
		TOGGLE_USER_STATUS: (user_uuid) => `/admin/users/${user_uuid}/status`,
	},

	// ==================================================
	// Auth
	// ==================================================uuid

	AUTH: {
		LOGIN: "/auth/login",
		REGISTER: "/auth/register",
		LOGOUT: "/auth/logout",
		REFRESH: "/auth/refresh",
		VERIFY_TOKEN: "/auth/verify",
		FORGOT_PASSWORD: "/auth/forgot-password",
		RESEND_VERIFICATION: "/auth/resend-verification",
		VERIFY_REGISTER: (token) => `/auth/verify/register/${token}`,
		VERIFY_RESET: (token) => `/auth/verify/reset/${token}`,
	},

	// ==================================================
	// OAuth
	// ==================================================

	OAUTH: {
		GOOGLE: "/oauth/google",
		FACEBOOK: "/oauth/facebook",
		GITHUB: "/oauth/github",
	},

	// ==================================================
	// track
	// ==================================================

	TRACKS: {
		BASE: "/tracks",
		TRENDING: "/tracks/trending",
		NEW_UPLOADS: "/tracks/new-upload",
		TOP_TRACKS: "/tracks/top-tracks",
		POPULAR: "/tracks/popular",
		SEARCH: "/tracks/search",
		UPLOAD: "/tracks/upload",
		PLAY_STATE: "/me/player",
		LIKE: (track_uuid) => `/tracks/${track_uuid}/like`,
		STREAM: (track_uuid) => `/tracks/${track_uuid}/stream`,
		METADATA: (track_uuid) => `/tracks/${track_uuid}/metadata`,
		COMMENT: (track_uuid) => `/tracks/${track_uuid}/comment`,
		SHARE: (track_uuid) => `/tracks/${track_uuid}/share`,
	},

	// ==================================================
	// User
	// ==================================================

	USER: {
		BASE: "/users",
		PROFILE: (userId) => `/users/${userId}`,
		PUBLIC_PROFILE: (identifier) => `/users/profile?identifier=${identifier}`,
		UPDATE_ME: "/users/me",
		FEATURED_ARTISTS: "/users/featured-artists",
		RECENT_PLAYS: "/users/recent-plays",
		LIKED_CONTENT: "/users/liked",
		FOR_YOU: "/users/for-you",
	},

	SOCIAL: {
		FOLLOW: (uuid) => `/social/${uuid}/follow`,
		UNFOLLOW: (uuid) => `/social/${uuid}/follow`,
	},
	// ==================================================
	// Playlists
	// ==================================================

	PLAYLIST: {
		BASE: "/playlists",
		TRENDING: "/playlists/trending",
		FEATURED: "/playlists/featured",
		BY_ID: (playlistId) => `/playlists/${playlistId}`,
	},

	// ==================================================
	// Albums
	// ==================================================

	ALBUM: {
		BASE: "/albums",
		BY_ID: (albumId) => `/albums/${albumId}`,
	},

	// ==================================================
	// Search
	// ==================================================

	SEARCH: {
		ALL: "/search",
	},

	// ==================================================
	// upload
	// ==================================================

	// ==================================================
	// Feeds
	// ==================================================
	FEEDS: {
		DISCOVER: "feeds/discover",
		EXPLORE: "/feeds/explore",
		FOR_YOU: "/feeds/for-you",
	},

	// ==================================================
	// Me (User-specific)
	// ==================================================

	ME: {
		BASE: "/me",
		SETTINGS: "/me/settings",
		LIBRARY: "/me/library",
		SEARCHES: "/me/searches",
		PLAYER: "/me/player",
	},

	UPLOAD: {
		TRACK: "/tracks/upload", // Maps perfectly to /api/v1/tracks/upload based on your backend base router
		IMAGE: "/upload/image",
	},

	// ==================================================
	// Notifications
	// ==================================================

	NOTIFICATIONS: {
		BASE: "/notifications",
		UNREAD_COUNT: "/notifications/unread-count",
		MARK_READ: (notification_uuid) =>
			`/notifications/${notification_uuid}/read`,
		MARK_ALL_READ: "/notifications/read-all",
	},
};
