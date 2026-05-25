// @zecco/features/profile/profile.events.js
import { networkHandler } from "@zecco/core/network-handler.js";
import { toast } from "@zecco/components/Toast/Toast.js";

export const profileEvents = (root, { state, setState, setData }) => {
	// Prevent duplicate listeners on re-renders
	if (root.hasAttribute("data-events-bound")) return;
	root.setAttribute("data-events-bound", "true");

	// ── Tab Switching Helper ──
	const switchTab = (clickedTab, isMobile) => {
		const tabClass = isMobile ? ".profile-mob-tab" : ".profile-tab";
		const panelClass = isMobile ? ".profile-mob-panel" : ".profile-panel";
		const activePanelClass = isMobile
			? "active-profile-mob-panel"
			: "active-profile-panel";

		const targetTab = clickedTab.dataset.tab;
		if (!targetTab) return;

		// Update Tab UI
		root
			.querySelectorAll(tabClass)
			.forEach((tab) => tab.classList.remove("active"));
		clickedTab.classList.add("active");

		// Update Panel UI
		root.querySelectorAll(panelClass).forEach((panel) => {
			if (panel.dataset.panel === targetTab) {
				panel.classList.add(activePanelClass);
			} else {
				panel.classList.remove(activePanelClass);
			}
		});
	};

	// ── Image Upload Handler (Optimistic UI) ──
	const handleImageUpload = (e, type, isMobile) => {
		const input = e.target;
		const file = input.files?.[0];
		if (!file) return;

		// 1. Strict Network Check (Stop flow if offline)
		if (networkHandler.getStatus() === "offline") {
			toast({
				message: `Cannot update ${type} photo while offline. Please check your connection.`,
				type: "error",
				duration: 4000,
			});
			input.value = ""; // Clear the input so it can be re-triggered later
			return;
		}

		try {
			// 2. Create Object URL for instant preview
			const objectUrl = URL.createObjectURL(file);

			// 3. Resolve target DOM elements based on layout
			const imgId = isMobile
				? type === "cover"
					? "#profile-mob-cover-img"
					: "#profile-mob-avatar-img"
				: type === "cover"
					? "#profile-cover-img"
					: "#profile-avatar-img";

			const fallbackId = isMobile
				? "#profile-mob-avatar-fallback"
				: "#profile-avatar-fallback";

			const imgEl = root.querySelector(imgId);
			if (imgEl) {
				imgEl.src = objectUrl;
				imgEl.style.display = "block"; // Ensure it's visible if it previously errored out
			}

			// If it's an avatar, hide the text fallback since we now have an image
			if (type === "avatar") {
				const fallbackEl = root.querySelector(fallbackId);
				if (fallbackEl) fallbackEl.style.display = "none";
			}

			toast({
				message: `${type.charAt(0).toUpperCase() + type.slice(1)} photo updated successfully!`,
				type: "success",
			});

			// Note: At this point in a real flow, you'd dispatch the `file` to your backend API via a FormData payload.
			// e.g., await meService.uploadAvatar(file);
		} catch (err) {
			console.error("Image preview error:", err);
			toast({ message: `Failed to preview ${type} image`, type: "error" });
		}
	};

	// ── Master Change Handler (For Hidden File Inputs) ──
	root.addEventListener("change", (e) => {
		const targetId = e.target.id;

		if (targetId === "profile-cover-input")
			handleImageUpload(e, "cover", false);
		if (targetId === "profile-mob-cover-input")
			handleImageUpload(e, "cover", true);

		if (targetId === "profile-avatar-input")
			handleImageUpload(e, "avatar", false);
		if (targetId === "profile-mob-avatar-input")
			handleImageUpload(e, "avatar", true);
	});

	// ── Master Click Handler ──
	root.addEventListener("click", async (e) => {
		// 1. Tabs
		const desktopTab = e.target.closest(".profile-tab");
		if (desktopTab) {
			switchTab(desktopTab, false);
			return;
		}
		const mobileTab = e.target.closest(".profile-mob-tab");
		if (mobileTab) {
			switchTab(mobileTab, true);
			return;
		}

		// 2. Edit Profile Navigation
		const editBtn = e.target.closest(
			"#profile-edit-btn, #profile-mob-edit-btn",
		);
		if (editBtn) {
			toast({
				message: "Opening profile editor...",
				type: "info",
				duration: 1500,
			});
			// You can trigger router navigation here later: window.location.href = '/settings/profile'
			return;
		}

		// 3. Follow / Unfollow Action
		const followBtn = e.target.closest(
			"#profile-follow-btn, #profile-mob-follow-btn",
		);
		if (followBtn) {
			if (networkHandler.getStatus() === "offline") {
				toast({
					message: "Internet connection required to follow users.",
					type: "warning",
				});
				return;
			}

			const isFollowing = followBtn.classList.contains("following");

			// Optimistic UI toggle
			followBtn.classList.toggle("following");
			followBtn.innerHTML = isFollowing
				? '<i class="bi bi-person-plus"></i> Follow'
				: '<i class="bi bi-person-check-fill"></i> Following';

			toast({
				message: isFollowing ? "Unfollowed user" : "Following user!",
				type: isFollowing ? "info" : "success",
			});
			return;
		}

		// 4. Image Upload Triggers (Proxying clicks to hidden inputs)
		const coverEditBtn = e.target.closest("#profile-cover-edit-btn");
		if (coverEditBtn) {
			root.querySelector("#profile-cover-input")?.click();
			return;
		}
		const mobCoverEditBtn = e.target.closest("#profile-mob-cover-edit-btn");
		if (mobCoverEditBtn) {
			root.querySelector("#profile-mob-cover-input")?.click();
			return;
		}

		const avatarEditBtn = e.target.closest("#profile-avatar-edit-btn");
		if (avatarEditBtn) {
			root.querySelector("#profile-avatar-input")?.click();
			return;
		}
		const mobAvatarEditBtn = e.target.closest("#profile-mob-avatar-edit-btn");
		if (mobAvatarEditBtn) {
			root.querySelector("#profile-mob-avatar-input")?.click();
			return;
		}

		// 5. Create Playlist (Empty State action)
		const createPlaylistBtn = e.target.closest(
			"#profile-create-playlist-btn, #profile-mob-create-playlist-btn",
		);
		if (createPlaylistBtn) {
			toast({ message: "Opening playlist creator...", type: "info" });
			return;
		}

		// 6. Error State Retry
		const retryBtn = e.target.closest(
			"#profile-retry-btn, #profile-mob-retry-btn",
		);
		if (retryBtn) {
			if (networkHandler.getStatus() === "offline") {
				toast({
					message: "Still offline. Reconnect and try again.",
					type: "error",
				});
				return;
			}
			toast({ message: "Retrying connection...", type: "info" });
			setState("skeleton"); // Bubbles back to ProfilePage.js to re-fetch
			return;
		}
	});
};
