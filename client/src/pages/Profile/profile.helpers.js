/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
const filterProfilePanels = (tab) => {
	const tabs = document.querySelectorAll(".profile-tab");
	const panels = document.querySelectorAll(".profile-panel");

	if (tabs.length === 0 || panels.length === 0) return;

	// Clear active states
	tabs.forEach((t) => t.classList.remove("active"));
	panels.forEach((p) => p.classList.remove("active-profile-panel"));

	// Set active tab and panel
	const activeTab = document.querySelector(`[data-tab="${tab}"]`);
	const activePanel = document.querySelector(`[data-panel="${tab}"]`);

	if (activeTab) activeTab.classList.add("active");
	if (activePanel) activePanel.classList.add("active-profile-panel");
};

/**
 * profile.helpers.js
 * Pure functions — no DOM, no state.
 */

/** Compact follower/following/upload counts — 1.2k, 340, etc. */
export const formatCount = (n = 0) => {
	if (n < 1000) return String(n);
	if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
	return `${(n / 1_000_000).toFixed(1)}m`;
};

/** Is this the logged-in user's own profile — drives Edit vs Follow button */
export const isOwnProfile = (profile) => !!profile?.viewer?.isOwnProfile;

/** Current follow state for the viewer, false if not logged in or own profile */
export const isFollowing = (profile) => !!profile?.viewer?.isFollowing;

/**
 * Which tab-content to show: tracks or playlists.
 * Falls back to whichever has content if the requested tab is empty.
 */
export const resolveActiveTab = (profile, requestedTab = "tracks") => {
	const hasTracks = (profile?.content?.publicTracks?.length ?? 0) > 0;
	const hasPlaylists = (profile?.content?.publicPlaylists?.length ?? 0) > 0;

	if (requestedTab === "tracks" && !hasTracks && hasPlaylists)
		return "playlists";
	if (requestedTab === "playlists" && !hasPlaylists && hasTracks)
		return "tracks";
	return requestedTab;
};
s;
export { filterProfilePanels };
