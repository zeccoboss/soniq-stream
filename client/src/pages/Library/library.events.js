import { toast } from "@zecco/components/Toast/Toast";
import showPlaylistModal from "@zecco/components/PlaylistModal/PlaylistModal";
import { showOptionsMenu } from "@zecco/components/OptionsMenu/OptionsMenu";
import { playlistService } from "@zecco/services/api/playlist.service";
import { viewNavigate } from "@zecco/utils/view-navigate";

/**
 * libraryEvents — Filter tabs, hero cards, and "See all" links are now
 * plain <a href="/library?section=..."> anchors, handled automatically by
 * the router's global click interceptor. This file only wires what ISN'T
 * plain navigation: playlist creation, track options, drill-in clicks.
 */
const libraryEvents = (container, { data, onPlaylistCreated } = {}) => {
	if (!container) return;

	container.addEventListener("click", (e) => {
		const createBtn = e.target.closest(
			"#lib-new-playlist-btn, #lib-create-playlist-btn",
		);
		if (createBtn) {
			showPlaylistModal({
				onCreate: async ({ name, description, visibility }) => {
					const res = await playlistService.create({
						name,
						description,
						visibility,
					});
					toast({ message: `"${name}" created`, type: "success" });
					if (res?.data) onPlaylistCreated?.(res.data);
				},
			});
			return;
		}

		if (e.target.closest("#lib-more-btn")) {
			toast({ message: "More library options coming soon", type: "info" });
			return;
		}

		const playlistEl = e.target.closest("[data-playlist-uuid]");
		if (playlistEl) {
			const uuid = playlistEl.dataset.playlistUuid;
			if (!uuid) {
				toast({ message: "Playlist is missing an id", type: "warning" });
				return;
			}
			viewNavigate("/playlist", { identifier: uuid }); // leaving Library — real "view" navigation
			return;
		}

		const optionsBtn = e.target.closest("[data-track-options]");
		if (optionsBtn) {
			const row = optionsBtn.closest("[data-track-uuid]");
			const title =
				row?.querySelector(".lib-track-title")?.textContent?.trim() ??
				"Track";
			const artistUuid = row?.dataset.artistUuid;
			showOptionsMenu(optionsBtn, {
				title,
				actions: [
					{
						label: "Go to Artist",
						icon: "bi-person-circle",
						onClick: () =>
							artistUuid &&
							viewNavigate("/profile", { identifier: artistUuid }),
					},
				],
			});
			return;
		}

		const trackRow = e.target.closest("[data-track-uuid]");
		if (trackRow) {
			const title =
				trackRow.querySelector(".lib-track-title")?.textContent?.trim() ??
				"Track";
			toast({ message: `Playing ${title}`, type: "info" });
			// TODO: real queue playback needs the full list this row belongs
			// to (liked vs. uploads vs. recent), not just the row itself —
			// wire once store.player's expected track shape is confirmed.
			return;
		}

		const artistChip = e.target.closest("[data-artist-uuid]");
		if (artistChip) {
			const uuid = artistChip.dataset.artistUuid;
			if (uuid) viewNavigate("/profile", { identifier: uuid });
			return;
		}
	});
};

export { libraryEvents };
