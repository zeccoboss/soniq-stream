import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Profile.styles.css";
import { renderPlaylistCards } from "@zecco/components/PlaylistCard/PlaylistCard";
import { renderTrackCards } from "@zecco/components/TrackCard/TrackCard";

/**
 * ProfileMobile — Mobile profile view component
 *
 * States:
 *   skeleton  → initial load
 *   auth      → not logged in
 *   content   → profile loaded
 *   error     → failed to load
 *
 * @async
 * @param {Object} props
 * @param {string} props.state
 * @param {Object} props.ctx   - Router context — ctx.params.username
 * @param {Object} props.data  - { user, isOwner, tracks, playlists }
 * @returns {Promise<Element>}
 */
export const ProfileMobile = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root
		.addClass("profile-section-mobile", "main-sections")
		.setId("profile-section-mobile");

	// destructure at top — add isViewMode
	const {
		user = {},
		isOwner = false,
		isFollowingViewer = false,
		isViewMode = false,
		tracks = [],
		playlists = [],
	} = data;

	// ── State factories ──────────────────────────────────────

	const skeletonState = () =>
		buildNode(`
			<section class="profile-mob-state" id="profile-mob-skeleton" data-content="skeleton">
				<div class="profile-mob-scroll">

					<!-- cover skeleton -->
					<div class="profile-sk profile-sk--cover-mob"></div>

					<!-- identity skeleton -->
					<div class="profile-mob-identity">
						<div class="profile-identity-top">
							<div class="profile-sk profile-sk--avatar-mob"></div>
							<div class="profile-sk profile-sk--btn-mob"></div>
						</div>
						<div class="profile-sk profile-sk--name-mob" style="margin-top:10px"></div>
						<div class="profile-sk profile-sk--uid-mob"  style="margin-top:5px;width:100px"></div>

						<!-- stats skeleton -->
						<div class="profile-mob-stats" style="pointer-events:none;margin-top:10px">
							<div class="profile-stat">
								<div class="profile-sk profile-sk--stat-num-mob"></div>
								<div class="profile-sk profile-sk--stat-label-mob" style="margin-top:3px"></div>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat">
								<div class="profile-sk profile-sk--stat-num-mob"></div>
								<div class="profile-sk profile-sk--stat-label-mob" style="margin-top:3px"></div>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat">
								<div class="profile-sk profile-sk--stat-num-mob"></div>
								<div class="profile-sk profile-sk--stat-label-mob" style="margin-top:3px"></div>
							</div>
						</div>

						<div class="profile-sk profile-sk--bio-mob" style="margin-top:10px"></div>
					</div>

					<!-- tabs skeleton -->
					<div class="profile-mob-tabs" style="pointer-events:none">
						${["72px", "80px", "60px"]
							.map(
								(w) => `
							<div class="profile-sk profile-sk--tab-mob" style="width:${w}"></div>
						`,
							)
							.join("")}
					</div>

					<!-- rows skeleton -->
					<div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
						${[1, 2, 3]
							.map(
								() => `
							<div class="profile-sk-row">
								<div class="profile-sk profile-sk--track-cover-mob"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:5px">
									<div class="profile-sk profile-sk--text-md-mob"></div>
									<div class="profile-sk profile-sk--text-sm-mob" style="width:50%"></div>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>

				</div>
			</section>
		`);

	const authGate = () =>
		buildNode(`
			<section class="profile-mob-state profile-mob-state--centered" id="profile-mob-auth" data-content="auth">
				<div class="profile-auth-icon">
					<i class="bi bi-person-circle"></i>
				</div>
				<h3 class="profile-auth-title">Your profile awaits</h3>
				<p class="profile-auth-sub">
					Log in to view your profile, upload and activity.
				</p>
				<div class="profile-auth-btns">
					<a href="/auth/login" class="profile-btn-accent">Login</a>
					<a href="/auth/register" class="profile-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const contentState = () =>
		buildNode(`
			<section class="profile-mob-state" id="profile-mob-content" data-content="content">
				<div class="profile-mob-scroll">
					${
						isViewMode
							? `<a href="#" class="profile-back-btn" data-back data-fallback="/">
								<i class="bi bi-arrow-left"></i> Back
							</a>`
							: ""
					}

					<!-- ── Cover ── -->
					<div class="profile-mob-cover" id="profile-mob-cover">
						<div class="profile-cover-glow"></div>
						<img
							src="${data?.user?.banner?.url}"
							alt="Profile cover"
							class="profile-cover-img"
							id="profile-mob-cover-img"
							onerror="this.style.display='none'"
						/>
						${
							isOwner
								? `
							<button class="profile-cover-edit" id="profile-mob-cover-edit-btn">
								<i class="bi bi-camera"></i> Edit
							</button>
							<input type="file" id="profile-mob-cover-input" accept="image/*" hidden />
						`
								: ""
						}
					</div>

					<!-- ── Identity ── -->
					<div class="profile-mob-identity">
						<div class="profile-identity-top">
							<div class="profile-avatar-wrap">
								<img
									src="${data?.user?.avatar?.url ?? defaultAvatar}"
									alt="Profile avatar"
									class="profile-avatar-img profile-avatar-img--mob"
									id="profile-mob-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
								/>
								<div class="profile-avatar-fallback profile-avatar-fallback--mob" id="profile-mob-avatar-fallback">
									${(user.username ?? "—").slice(0, 2).toUpperCase()}
								</div>
								${
									isOwner
										? `
									<button class="profile-avatar-edit-btn" id="profile-mob-avatar-edit-btn">
										<i class="bi bi-pencil-fill"></i>
									</button>
									<input type="file" id="profile-mob-avatar-input" accept="image/*" hidden />
								`
										: ""
								}
							</div>

							<div class="profile-identity-actions">
								${
									isOwner
										? `<button class="profile-edit-btn" id="profile-mob-edit-btn">
											<i class="bi bi-pencil"></i> Edit
										</button>`
										: `<button class="profile-follow-btn ${isFollowingViewer ? "following" : ""}" id="profile-follow-btn">
											<i class="bi ${isFollowingViewer ? "bi-person-check-fill" : "bi-person-plus"}"></i>
											${isFollowingViewer ? "Following" : "Follow"}
										</button>`
								}
							</div>
						</div>

						<h1 class="profile-name profile-name--mob" id="profile-mob-name">
							${user.username ?? user.username ?? "—"}
						</h1>
						<p class="profile-uid" id="profile-mob-uid">
							@${user.username ?? "—"}
						</p>

						<div class="profile-mob-stats" id="profile-mob-stats">
							<div class="profile-stat" id="profile-mob-stat-following">
								<span class="profile-stat-num" id="profile-mob-following-count">
									${user.followingCount ?? 0}
								</span>
								<span class="profile-stat-label">Following</span>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat" id="profile-mob-stat-followers">
								<span class="profile-stat-num" id="profile-mob-followers-count">
									${user.followersCount ?? 0}
								</span>
								<span class="profile-stat-label">Followers</span>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat" id="profile-mob-stat-upload">
								<span class="profile-stat-num" id="profile-mob-upload-count">
									${user.uploadsCount ?? 0}
								</span>
								<span class="profile-stat-label">upload</span>
							</div>
						</div>

						${
							user.bio
								? `
							<p class="profile-bio" id="profile-mob-bio">${user.bio}</p>
						`
								: ""
						}
						<p class="profile-since" id="profile-mob-since">
							Member since ${user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
						</p>
					</div>

					<!-- ── Tabs ── -->
					<div class="profile-mob-content">
						<nav class="profile-mob-tabs" id="profile-mob-tabs">
							<button class="profile-mob-tab active" data-tab="upload">
								<i class="bi bi-cloud-upload"></i> upload
							</button>
							<button class="profile-mob-tab" data-tab="playlists">
								<i class="bi bi-collection-play"></i> Playlists
							</button>
							${
								isOwner
									? `
								<button class="profile-mob-tab" data-tab="liked">
									<i class="bi bi-heart"></i> Liked
								</button>
							`
									: ""
							}
						</nav>

						<!-- upload panel -->
						<div class="profile-mob-panel active-profile-mob-panel" id="profile-mob-panel-upload" data-panel="upload">
							<div class="profile-panel-empty ${tracks.length ? "hidden" : ""}" id="profile-mob-upload-empty">
								<i class="bi bi-cloud-upload profile-panel-empty-icon"></i>
								<p class="profile-panel-empty-title">No upload yet</p>
								<p class="profile-panel-empty-sub">
									${isOwner ? "Share your music with the world" : "This artist hasn't uploaded yet"}
								</p>
								${
									isOwner
										? `
									<a href="/upload" class="profile-btn-accent">
										<i class="bi bi-upload"></i> Upload
									</a>
								`
										: ""
								}
							</div>
							<div class="profile-track-list" id="profile-upload-list">
								${renderTrackCards(tracks)}
							</div>
						</div>

						<!-- Playlists panel -->
						<div class="profile-mob-panel" id="profile-mob-panel-playlists" data-panel="playlists">
							<div class="profile-panel-empty ${playlists.length ? "hidden" : ""}" id="profile-mob-playlists-empty">
								<i class="bi bi-collection profile-panel-empty-icon"></i>
								<p class="profile-panel-empty-title">No playlists yet</p>
								<p class="profile-panel-empty-sub">
									${isOwner ? "Create your first playlist" : "No public playlists"}
								</p>
								${
									isOwner
										? `
									<button class="profile-btn-accent" id="profile-mob-create-playlist-btn">
										<i class="bi bi-plus-lg"></i> Create
									</button>
								`
										: ""
								}
							</div>
							<div class="profile-playlist-grid" id="profile-playlist-grid">
								${renderPlaylistCards(playlists)}
							</div>
						</div>

						<!-- Liked panel (owner only) -->
						${
							isOwner
								? `
							<div class="profile-mob-panel" id="profile-mob-panel-liked" data-panel="liked">
								<div class="profile-panel-empty" id="profile-mob-liked-empty">
									<i class="bi bi-heart profile-panel-empty-icon"></i>
									<p class="profile-panel-empty-title">No liked songs yet</p>
									<p class="profile-panel-empty-sub">Songs you like will appear here</p>
									<a href="/search" class="profile-btn-accent">
										<i class="bi bi-search"></i> Discover
									</a>
								</div>
								<div class="profile-track-list" id="profile-mob-liked-list">
									<!-- injected by profile.events.js -->
								</div>
							</div>
						`
								: ""
						}
					</div>

				</div>
			</section>
		`);

	const errorState = () =>
		buildNode(`
			<section class="profile-mob-state profile-mob-state--centered" id="profile-mob-error" data-content="error">
				<div class="profile-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="profile-error-title">Couldn't load profile</h3>
				<p class="profile-error-sub" id="profile-mob-error-msg">
					Something went wrong. Check your connection and try again.
				</p>
				<button class="profile-btn-accent" id="profile-mob-retry-btn">
					<i class="bi bi-arrow-clockwise"></i> Try Again
				</button>
			</section>
		`);

	// ── Pick state view ──────────────────────────────────────
	const getStateView = (state) => {
		switch (state) {
			case "auth":
				return authGate();
			case "content":
				return contentState();
			case "error":
				return errorState();
			default:
				return skeletonState();
		}
	};

	root.append(getStateView(state));
	return root.getElement();
};
