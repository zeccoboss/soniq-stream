import { router } from "@zecco/routes/router";
import { toast } from "@zecco/components/Toast/Toast";
import { showModal } from "@zecco/components/Modal/Modal";
import { filterLibraryContent } from "@zecco/features/library/library.helpers";

const SEE_ALL_TAB_MAP = {
	"lib-see-all-liked": "liked",
	"lib-see-all-liked-mobile": "liked",
	"lib-see-all-upload": "upload",
	"lib-see-all-upload-mobile": "upload",
	"lib-see-all-playlists": "playlists",
	"lib-see-all-playlists-mobile": "playlists",
	"lib-see-all-recent": "recent",
	"lib-see-all-recent-mobile": "recent",
	"lib-see-all-artists": "following",
	"lib-see-all-artists-mobile": "following",
};

const setActiveTab = (container, tab = "all") => {
	const tabs = container.querySelectorAll(".lib-filter-tab");
	tabs.forEach((btn) => {
		btn.classList.toggle("active", btn.dataset.tab === tab);
	});
	filterLibraryContent(tab);
};

const getRequestedTab = () => {
	const params = new URLSearchParams(window.location.search);
	return params.get("tab") || "all";
};

const syncTabUrl = (tab = "all") => {
	const params = new URLSearchParams(window.location.search);
	params.set("tab", tab);
	const nextUrl = `${window.location.pathname}?${params.toString()}`;
	window.history.replaceState(window.history.state, "", nextUrl);
};

const libraryEvents = (container) => {
	if (!container) return;

	setActiveTab(container, getRequestedTab());

	container.addEventListener("click", (e) => {
		const heroCard = e.target.closest(
			"#lib-hero-liked, #lib-hero-upload, #lib-hero-recent, #lib-hero-liked-mobile, #lib-hero-upload-mobile, #lib-hero-recent-mobile",
		);
		if (heroCard) {
			const heroTabMap = {
				"lib-hero-liked": "liked",
				"lib-hero-liked-mobile": "liked",
				"lib-hero-upload": "upload",
				"lib-hero-upload-mobile": "upload",
				"lib-hero-recent": "recent",
				"lib-hero-recent-mobile": "recent",
			};

			const tab = heroTabMap[heroCard.id] || "all";
			setActiveTab(container, tab);
			syncTabUrl(tab);
			return;
		}

		const tabBtn = e.target.closest(".lib-filter-tab");
		if (tabBtn) {
			const tab = tabBtn.dataset.tab || "all";
			setActiveTab(container, tab);
			syncTabUrl(tab);
			return;
		}

		const seeAllBtn = e.target.closest(".lib-sec-link");
		if (seeAllBtn?.id && SEE_ALL_TAB_MAP[seeAllBtn.id]) {
			const tab = SEE_ALL_TAB_MAP[seeAllBtn.id];
			setActiveTab(container, tab);
			syncTabUrl(tab);
			return;
		}

		const createBtn = e.target.closest(
			"#lib-new-playlist-btn, #lib-create-playlist-btn",
		);
		if (createBtn) {
			showModal({
				title: "Create Playlist",
				message: "Playlist creation flow will be connected next.",
				type: "info",
				confirmLabel: "Okay",
			});
			return;
		}

		const moreHeaderBtn = e.target.closest("#lib-more-btn");
		if (moreHeaderBtn) {
			toast({ message: "More library options coming soon", type: "info" });
			return;
		}

		const playlistCard = e.target.closest(
			".lib-playlist-card, .lib-playlist-item-mobile",
		);
		if (playlistCard) {
			const playlistId = playlistCard.dataset.playlistId;
			if (!playlistId) {
				toast({ message: "Playlist is missing an id", type: "warning" });
				return;
			}
			router.navigate(`/library/playlist/${playlistId}`);
			return;
		}

		const trackMoreBtn = e.target.closest(".lib-track-more");
		if (trackMoreBtn) {
			toast({ message: "Track actions are coming soon", type: "info" });
			return;
		}

		const trackRow = e.target.closest(".lib-track-row");
		if (trackRow) {
			const title =
				trackRow.querySelector(".lib-track-title")?.textContent?.trim() ||
				"Track";
			toast({ message: `${title} selected`, type: "info" });
			return;
		}

		const artistChip = e.target.closest(".lib-artist-chip");
		if (artistChip) {
			const artistId = artistChip.dataset.artistId;
			const artistName =
				artistChip.querySelector(".lib-artist-name")?.textContent?.trim() ||
				"Artist";

			if (artistId) {
				router.navigate(`/artist/${artistId}`);
				return;
			}

			toast({ message: `${artistName} profile is not linked yet`, type: "info" });
		}
	});
};

export { libraryEvents };
