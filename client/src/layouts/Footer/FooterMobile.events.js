import { showActionSheet } from "@zecco/components/ActionSheet/ActionSheet.js";
import showPlaylistModal from "@zecco/components/PlaylistModal/PlaylistModal.js";
import { router } from "@zecco/routes/router.js";
import { playlistService } from "@zecco/services/api/playlist.service.js";
import { toast } from "@zecco/components/Toast/Toast.js";

export const footerMobileEvents = (footerElement) => {
	const newBtn = footerElement.querySelector("#mob-new-btn");

	newBtn?.addEventListener("click", (e) => {
		e.preventDefault();
		showActionSheet({
			title: "Add something new",
			actions: [
				{
					label: "Create Playlist",
					icon: "bi-collection-play",
					onClick: () => {
						showPlaylistModal({
							onCreate: async ({ name, description, visibility }) => {
								await playlistService.create({
									name,
									description,
									visibility,
								});
								toast({
									message: `"${name}" created`,
									type: "success",
								});
								router.navigate("/library");
							},
						});
					},
				},
				{
					label: "Upload Track",
					icon: "bi-cloud-upload",
					onClick: () => router.navigate("/upload"),
				},
			],
		});
	});
};
