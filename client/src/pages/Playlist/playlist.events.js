import { store } from "@zecco/store/";
import { playlistService } from "@zecco/services/api/playlist.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";
import { viewNavigate } from "@zecco/utils/view-navigate.js";

export const playlistEvents = (root, { playlist, setPlaylist }) => {
	// ── Save / unsave (hidden entirely for the owner — see template) ──
	const saveBtn = root.querySelector("[data-playlist-save-btn]");
	saveBtn?.addEventListener("click", async () => {
		if (saveBtn.disabled) return;
		saveBtn.disabled = true;

		const wasSaved = playlist.viewer.hasSaved;
		setPlaylist({ viewer: { ...playlist.viewer, hasSaved: !wasSaved } });

		try {
			await playlistService.toggleSave(playlist.uuid);
		} catch (err) {
			setPlaylist({ viewer: { ...playlist.viewer, hasSaved: wasSaved } }); // revert
			toast({
				message: err.message || "Couldn't update saved playlists.",
				type: "error",
			});
		} finally {
			saveBtn.disabled = false;
		}
	});

	// ── Creator name/avatar → their profile ──
	root
		.querySelector("[data-playlist-creator]")
		?.addEventListener("click", () => {
			viewNavigate("/profile", { identifier: playlist.user.uuid });
		});

	// ── Track rows → load the whole playlist as the queue, start at click ──
	root.querySelectorAll("[data-playlist-track-index]").forEach((row) => {
		row.addEventListener("click", () => {
			const index = Number(row.dataset.playlistTrackIndex);
			store.player.loadQueue(playlist.trackIds, index);
		});
	});

	// ── Retry (error state) ──
	root
		.querySelector("[data-playlist-retry]")
		?.addEventListener("click", () => {
			root.dispatchEvent(
				new CustomEvent("playlist:retry", { bubbles: true }),
			);
		});
};
