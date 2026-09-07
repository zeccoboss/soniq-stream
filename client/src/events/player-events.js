import { router } from "@zecco/routes/router.js";
import { store } from "@zecco/store/index.js";

export const initGlobalPlayerTriggers = () => {
	if (router.currentPath === "/player") return;
	// 1. Auto-expand when a track starts loading or playing
	store.player.on("player_store:track_changed", (track) => {
		if (track && router.currentPath !== "/player") {
			router.navigate("/player");
		}
	});
};
