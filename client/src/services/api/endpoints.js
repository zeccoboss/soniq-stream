// ======================================================
// API ENDPOINTS
// Centralized endpoint registry
// ======================================================

export const ENDPOINTS = {
	// ==================================================
	// Auth
	// ==================================================

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
		FEATURED_ARTISTS: "/users/featured-artists",
		RECENT_PLAYS: "/users/recent-plays",
		LIKED_CONTENT: "/users/liked",
		FOR_YOU: "/users/for-you",
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
};
