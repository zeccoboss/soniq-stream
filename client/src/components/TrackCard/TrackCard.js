import { store } from "@zecco/store";
import { viewNavigate } from "@zecco/utils/view-navigate.js";
import { showActionSheet } from "@zecco/components/ActionSheet/ActionSheet.js";
import "./TrackCard.styles.css";
import { logger } from "@zecco/core/logger";

/**
 * Build the HTML for one track card. Pure template — no DOM writes,
 * no event binding. Pair with wireTrackCardClicks() for interactivity.
 *
 * @param {Object} track - shaped track from sanitizeTrackData (has uuid,
 *   cover.storage.baseUrl, user.uuid, isLiked if the API provides it)
 */
export const buildTrackCardHTML = (track) => `
	<div class="music_card" data-track-card-uuid="${track.uuid}">
		<div class="card_img_container">
			<img
				src="${track?.cover?.url ?? "/src/assets/images/track-cover.png"}"
				class="card_img"
				alt=""
				width="50"
				height="50"
				loading="lazy"
				onerror="this.style.display='none'"
			/>
			<div class="card_overlay" data-track-play>
				<i class="bi bi-play-fill"></i>
			</div>
		</div>

		<div class="card_music_details">
			<h4 class="card_artist_name" data-track-artist>${track?.artist ?? "Unknown artist"}</h4>
			<p class="card_music_title">${track?.title ?? "Unknown title"}</p>
		</div>

		<div class="music_card_control">
			<button class="card_like_btn ${track?.isLiked ? "card_like_btn--active" : ""}" data-track-like type="button">
				<i class="bi bi-heart"></i>
			</button>
			<button class="card_options_btn" data-track-options type="button">
				<i class="bi bi-three-dots"></i>
			</button>
		</div>
	</div>
`;

/** Render a list of tracks as cards, joined into one HTML string. */
export const renderTrackCards = (tracks = []) =>
	tracks.map(buildTrackCardHTML).join("");

/**
 * ONE delegated listener on whatever container you pass — safe across
 * re-renders since it lives on the ancestor, not the cards themselves.
 *
 * @param {Element} root
 * @param {Object} opts
 * @param {Array}    opts.tracks       - full list backing this render, used
 *   as the play queue so next/prev works (matches store.player.loadQueue)
 * @param {Function} [opts.onLikeToggle] - async (track) => void, called
 *   optimistically before any API call — caller owns the actual request
 */
export const wireTrackCardClicks = (
	root,
	{ tracks = [], onLikeToggle } = {},
) => {
	root.addEventListener("click", (e) => {
		const card = e.target.closest("[data-track-card-uuid]");
		if (!card) return;
		const uuid = card.dataset.trackCardUuid;
		const track = tracks.find((t) => t.uuid === uuid);
		if (!track) return;

		// Play — loadQueue keeps next/prev working across the whole list
		if (e.target.closest("[data-track-play]")) {
			const index = tracks.findIndex((t) => t.uuid === uuid);
			store.player.loadQueue(tracks, index);
			return;
		}

		// Like — optimistic UI, caller supplies the real API call
		if (e.target.closest("[data-track-like]")) {
			const btn = e.target.closest("[data-track-like]");
			btn.classList.toggle("card_like_btn--active");
			onLikeToggle?.(track).catch(() =>
				btn.classList.toggle("card_like_btn--active"),
			); // revert on failure
			return;
		}

		// Artist name → their profile, as a view (doesn't move nav highlight)
		if (e.target.closest("[data-track-artist]")) {
			if (track.user?.uuid)
				viewNavigate("/profile", { identifier: track.user.uuid });
			return;
		}

		// Options menu → reuse the same bottom-sheet as the mobile "+" button
		if (e.target.closest("[data-track-options]")) {
			const anchorBtn = e.target.closest("[data-track-options]");
			showOptionsMenu(anchorBtn, {
				title: track.title,
				actions: [
					{
						label: "Go to Artist",
						icon: "bi-person-circle",
						onClick: () =>
							track.user?.uuid &&
							viewNavigate("/profile", { identifier: track.user.uuid }),
					},
					{
						label: "Share",
						icon: "bi-share",
						onClick: () =>
							navigator.clipboard?.writeText(
								`${location.origin}/track?identifier=${track.uuid}`,
							),
					},
				],
			});
			return;
		}
	});
};
