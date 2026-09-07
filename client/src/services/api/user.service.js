class UserService {
	// AUTH
	getProfile() {
		return this.get(ENDPOINTS.USER.PROFILE);
	}
	getFeaturedArtists() {
		return this.get(ENDPOINTS.USER.FEATURED_ARTISTS);
	}
	getRecentPlays() {
		return this.get(ENDPOINTS.USER.RECENT_PLAYS);
	}
	getLikedContent() {
		return this.get(ENDPOINTS.USER.LIKED_CONTENT);
	}
	getForYou() {
		return this.get(ENDPOINTS.USER.FOR_YOU);
	}
}

export const userService = new UserService();
