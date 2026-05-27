import { router } from "@zecco/routes/router";
import { toast } from "@zecco/components/Toast/Toast";
import { showModal, hideModal } from "@zecco/components/Modal/Modal";
import { trackService } from "@zecco/services/api/track.service";
import { mobileScreen } from "@zecco/core/screen-break-points";
import { filterLibraryContent } from "@zecco/features/library/library.helpers";

const libraryEvents = (container) => {
	if (!container) return;

	const isMobile = mobileScreen.matches;

	// ── Tab filtering (Desktop & Mobile) ──────────────────────────────────────
	const setupTabFiltering = () => {
		const tabButtons = container.querySelectorAll(".lib-filter-tab");

		tabButtons.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const tab = e.target.dataset.tab;

				// Remove active class from all tabs
				tabButtons.forEach((b) => b.classList.remove("active"));
				e.target.classList.add("active");

				// Filter library content based on selected tab
				filterLibraryContent(tab);

				// Also navigate to update URL
				router.navigate(`/library?tab=${tab}`);
			});
		});
	};

	// ── Create new playlist (Desktop) ──────────────────────────────────────────
	const setupPlaylistCreation = () => {
		const newPlaylistBtn =
			container.querySelector("#lib-new-playlist-btn") ||
			container.querySelector("#lib-create-playlist-btn");

		if (!newPlaylistBtn) return;

		newPlaylistBtn.addEventListener("click", () => {
			showModal({
				title: "Create Playlist",
				message: "Enter a name for your new playlist",
				type: "info",
				confirmLabel: "Create",
				cancelLabel: "Cancel",
				onConfirm: async () => {
					const playlistName = prompt("Playlist name:");
					if (!playlistName) return;

					try {
						// TODO: Replace with actual API call
						// const newPlaylist = await playlistService.create({ name: playlistName });
						toast({
							message: `Playlist "${playlistName}" created successfully!`,
							type: "success",
						});
						// TODO: Refresh playlists list
					} catch (error) {
						console.error("[Library] Playlist creation error:", error);
						toast({
							message: "Failed to create playlist. Please try again.",
							type: "error",
						});
					}
				},
			});
		});
	};

	// ── Hero card play buttons (Play Liked / My upload / Recently Played) ────
	const setupHeroCardPlayButtons = () => {
		const heroCards = container.querySelectorAll(".lib-hero-card");
		heroCards.forEach((card) => {
			const playBtn = card.querySelector(".lib-hero-play");
			if (!playBtn) return;

			playBtn.addEventListener("click", async () => {
				const heroTitle = card
					.querySelector(".lib-hero-title")
					?.textContent?.trim();

				try {
					// Determine which playlist to load based on hero card type
					let tracks = [];
					if (heroTitle === "Liked Songs") {
						// TODO: Fetch liked tracks
						tracks = [];
					} else if (heroTitle === "My upload") {
						// TODO: Fetch uploaded tracks
						tracks = [];
					} else if (heroTitle === "Recently Played") {
						// TODO: Fetch recently played tracks
						tracks = [];
					}

					if (tracks.length === 0) {
						toast({
							message: `No tracks in ${heroTitle}`,
							type: "warning",
						});
						return;
					}

					// TODO: Play tracks in mini player
					// playTracks(tracks);
					toast({
						message: `Playing ${heroTitle}...`,
						type: "info",
					});
				} catch (error) {
					console.error("[Library] Hero play error:", error);
					toast({
						message: "Failed to play. Please try again.",
						type: "error",
					});
				}
			});
		});
	};

	// ── Playlist card interactions ─────────────────────────────────────────────
	const setupPlaylistCardEvents = () => {
		const playlistGrid = container.querySelector("#lib-playlist-grid");
		if (!playlistGrid) return;

		playlistGrid.addEventListener("click", async (e) => {
			const playlistCard = e.target.closest(".lib-playlist-card");
			if (!playlistCard) return;

			const playBtn = e.target.closest(".lib-playlist-card__play");
			const deleteBtn = e.target.closest(".lib-playlist-card__delete");
			const editBtn = e.target.closest(".lib-playlist-card__edit");

			try {
				if (playBtn) {
					// Play playlist
					const playlistId = playlistCard.dataset.playlistId;
					// TODO: Fetch playlist tracks and play
					toast({
						message: "Playing playlist...",
						type: "info",
					});
				} else if (deleteBtn) {
					// Delete playlist with confirmation
					const playlistName = playlistCard.querySelector(
						".lib-playlist-title",
					)?.textContent;
					showModal({
						title: "Delete Playlist?",
						message: `Are you sure you want to delete "${playlistName}"? This cannot be undone.`,
						type: "danger",
						confirmLabel: "Delete",
						cancelLabel: "Keep",
						onConfirm: async () => {
							try {
								const playlistId = playlistCard.dataset.playlistId;
								// TODO: Call API to delete playlist
								// await playlistService.delete(playlistId);
								playlistCard.remove();
								toast({
									message: "Playlist deleted successfully",
									type: "success",
								});
							} catch (error) {
								console.error(
									"[Library] Delete playlist error:",
									error,
								);
								toast({
									message: "Failed to delete playlist",
									type: "error",
								});
							}
						},
					});
				} else if (editBtn) {
					// Edit playlist name
					const playlistName = playlistCard.querySelector(
						".lib-playlist-title",
					)?.textContent;
					const newName = prompt("New playlist name:", playlistName);
					if (!newName) return;

					try {
						const playlistId = playlistCard.dataset.playlistId;
						// TODO: Call API to update playlist
						// await playlistService.update(playlistId, { name: newName });
						toast({
							message: "Playlist renamed successfully",
							type: "success",
						});
					} catch (error) {
						console.error("[Library] Edit playlist error:", error);
						toast({
							message: "Failed to rename playlist",
							type: "error",
						});
					}
				} else {
					// Navigate to playlist
					const playlistId = playlistCard.dataset.playlistId;
					router.navigate(`/library/playlist/${playlistId}`);
				}
			} catch (error) {
				console.error("[Library] Playlist card event error:", error);
				toast({
					message: "An error occurred",
					type: "error",
				});
			}
		});
	};

	// ── Track list interactions (Like/Unlike, Play, More actions) ──────────────
	const setupTrackListEvents = () => {
		const trackLists = container.querySelectorAll(".lib-track-list");

		trackLists.forEach((trackList) => {
			trackList.addEventListener("click", async (e) => {
				const trackRow = e.target.closest(".lib-track-row");
				if (!trackRow) return;

				const likeBtn = e.target.closest(".lib-track__like");
				const playBtn = e.target.closest(".lib-track__play");
				const removeBtn = e.target.closest(".lib-track__remove");
				const moreBtn = e.target.closest(".lib-track__more");

				const trackId = trackRow.dataset.trackId;
				const trackName = trackRow
					.querySelector(".lib-track-title")
					?.textContent?.trim();

				try {
					if (playBtn) {
						// Play single track
						// TODO: Play track in mini player
						toast({
							message: `Playing "${trackName}"...`,
							type: "info",
						});
					} else if (likeBtn) {
						// Toggle like
						const isLiked = likeBtn.classList.contains("liked");
						if (isLiked) {
							// TODO: Unlike track
							// await trackService.unlikeTrack(trackId);
							likeBtn.classList.remove("liked");
							toast({
								message: `Removed from Liked Songs`,
								type: "info",
							});
						} else {
							// Like track
							await trackService.likeTrack(trackId);
							likeBtn.classList.add("liked");
							toast({
								message: `Added to Liked Songs`,
								type: "success",
							});
						}
					} else if (removeBtn) {
						// Remove from current list (uploaded/liked/etc)
						showModal({
							title: "Remove Track?",
							message: `Remove "${trackName}" from this list?`,
							type: "default",
							confirmLabel: "Remove",
							cancelLabel: "Keep",
							onConfirm: async () => {
								try {
									// TODO: Call appropriate API to remove track
									trackRow.remove();
									toast({
										message: "Track removed",
										type: "success",
									});
								} catch (error) {
									console.error(
										"[Library] Remove track error:",
										error,
									);
									toast({
										message: "Failed to remove track",
										type: "error",
									});
								}
							},
						});
					} else if (moreBtn) {
						// Show context menu / more options
						// TODO: Show context menu with options like:
						// - Add to Playlist
						// - Share
						// - View Artist
						toast({
							message: "More options coming soon",
							type: "info",
						});
					}
				} catch (error) {
					console.error("[Library] Track event error:", error);
					toast({
						message: "An error occurred",
						type: "error",
					});
				}
			});
		});
	};

	// ── Artist follow/unfollow ────────────────────────────────────────────────
	const setupArtistEvents = () => {
		const artistRow = container.querySelector("#lib-artist-row");
		if (!artistRow) return;

		artistRow.addEventListener("click", async (e) => {
			const artistChip = e.target.closest(".lib-artist-chip");
			if (!artistChip) return;

			const followBtn = e.target.closest(".lib-artist__follow");
			const artistId = artistChip.dataset.artistId;
			const artistName = artistChip
				.querySelector(".lib-artist-name")
				?.textContent?.trim();

			try {
				if (followBtn) {
					const isFollowing = followBtn.classList.contains("following");
					if (isFollowing) {
						// TODO: Unfollow artist
						// await userService.unfollowArtist(artistId);
						followBtn.classList.remove("following");
						toast({
							message: `Unfollowed ${artistName}`,
							type: "info",
						});
					} else {
						// TODO: Follow artist
						// await userService.followArtist(artistId);
						followBtn.classList.add("following");
						toast({
							message: `Following ${artistName}`,
							type: "success",
						});
					}
				} else {
					// Navigate to artist page
					router.navigate(`/artist/${artistId}`);
				}
			} catch (error) {
				console.error("[Library] Artist event error:", error);
				toast({
					message: "An error occurred",
					type: "error",
				});
			}
		});
	};

	// ── More options button (Desktop header) ───────────────────────────────────
	const setupMoreOptionsBtn = () => {
		const moreBtn = container.querySelector("#lib-more-btn");
		if (!moreBtn) return;

		moreBtn.addEventListener("click", () => {
			showModal({
				title: "Library Options",
				message: "Choose an action",
				type: "default",
				confirmLabel: "Sort A-Z",
				cancelLabel: "Close",
				onConfirm: async () => {
					// TODO: Sort library by name
					toast({
						message: "Library sorted",
						type: "info",
					});
				},
			});
		});
	};

	// ── Responsive event setup ────────────────────────────────────────────────
	const setupResponsiveEvents = () => {
		// Add mobile-specific event handling if needed
		if (isMobile) {
			// Mobile-specific adjustments can be added here
		}
	};

	// ── Initialize all events ─────────────────────────────────────────────────
	const init = () => {
		setupTabFiltering();
		setupPlaylistCreation();
		setupHeroCardPlayButtons();
		setupPlaylistCardEvents();
		setupTrackListEvents();
		setupArtistEvents();
		setupMoreOptionsBtn();
		setupResponsiveEvents();
	};

	init();
};

export { libraryEvents };
