import CreateElement from "@zecco/utils/dom/create-element";
import { buildNode } from "@zecco/utils/dom/build-node.js";
import defaultAvatar from "@zecco/assets/images/default-profile.png";
import "./Profile.styles.css";
import { renderPlaylistCards } from "@zecco/components/PlaylistCard/PlaylistCard";
import { renderTrackCards } from "@zecco/components/TrackCard/TrackCard";

/**
 * ProfileDesktop — Desktop profile view component
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
export const ProfileDesktop = async ({ state, ctx, data = {} }) => {
	const root = new CreateElement("section");
	root.addClass("profile-section", "main-sections").setId("profile-section");

	// destructure at top — add isViewMode
	const {
		user = {},
		isOwner = false,
		isFollowingViewer = false,
		isViewMode = false,
		tracks = [],
		playlists = [],
	} = data;

	console.log(data);

	// ── State factories ──────────────────────────────────────

	function skeletonState() {
		return buildNode(`
			<section class="profile-state" id="profile-skeleton" data-content="skeleton">
				<!-- Cover skeleton -->
				<div class="profile-sk profile-sk--cover"></div>

				<!-- Identity skeleton -->
				<div class="profile-identity">
					<div class="profile-identity-top">
						<div class="profile-sk profile-sk--avatar"></div>
						<div class="profile-sk profile-sk--btn"></div>
					</div>
					<div class="profile-sk profile-sk--name" style="margin-top:12px"></div>
					<div class="profile-sk profile-sk--uid"  style="margin-top:6px;width:140px"></div>
					<div class="profile-stats" style="pointer-events:none;margin-top:12px">
						<div class="profile-stat">
							<div class="profile-sk profile-sk--stat-num"></div>
							<div class="profile-sk profile-sk--stat-label" style="margin-top:4px"></div>
						</div>
						<div class="profile-stat-divider"></div>
						<div class="profile-stat">
							<div class="profile-sk profile-sk--stat-num"></div>
							<div class="profile-sk profile-sk--stat-label" style="margin-top:4px"></div>
						</div>
						<div class="profile-stat-divider"></div>
						<div class="profile-stat">
							<div class="profile-sk profile-sk--stat-num"></div>
							<div class="profile-sk profile-sk--stat-label" style="margin-top:4px"></div>
						</div>
					</div>
					<div class="profile-sk profile-sk--bio" style="margin-top:12px"></div>
				</div>

				<!-- Tabs skeleton -->
				<div class="profile-content">
					<div class="profile-tabs" style="pointer-events:none">
						${["80px", "72px", "60px"]
							.map(
								(w) => `
							<div class="profile-sk profile-sk--tab" style="width:${w}"></div>
						`,
							)
							.join("")}
					</div>
					<div class="profile-panel active-profile-panel" style="gap:8px">
						${[1, 2, 3, 4]
							.map(
								() => `
							<div class="profile-sk-row">
								<div class="profile-sk profile-sk--track-cover"></div>
								<div style="flex:1;display:flex;flex-direction:column;gap:5px">
									<div class="profile-sk profile-sk--text-md"></div>
									<div class="profile-sk profile-sk--text-sm" style="width:50%"></div>
								</div>
								<div class="profile-sk profile-sk--text-sm" style="width:28px"></div>
							</div>
						`,
							)
							.join("")}
					</div>
				</div>
			</section>
		`);
	}

	const authGate = () =>
		buildNode(`
			<section class="profile-state profile-state--centered" id="profile-auth-gate" data-content="auth">
				<div class="profile-auth-icon">
					<i class="bi bi-person-circle"></i>
				</div>
				<h3 class="profile-auth-title">Your profile awaits</h3>
				<p class="profile-auth-sub">
					Log in to view your profile, upload, playlists and activity.
				</p>
				<div class="profile-auth-btns">
					<a href="/auth/login" class="profile-btn-accent">Login</a>
					<a href="/auth/register" class="profile-btn-ghost">Sign up</a>
				</div>
			</section>
		`);

	const contentState = () =>
		buildNode(`
			<section class="profile-state" id="profile-content" data-content="content">
				<div class="profile-scroll">
					${
						isViewMode
							? `<a href="#" class="profile-back-btn" data-back data-fallback="/">
								<i class="bi bi-arrow-left"></i> Back
							</a>`
							: ""
					}

					<!-- ── Cover ── -->
					<div class="profile-cover" id="profile-cover">
						<div class="profile-cover-glow"></div>
						<img
							src="${data?.user?.banner?.url}"
							alt="Profile cover"
							class="profile-cover-img"
							id="profile-cover-img"
							onerror="this.style.display='none'"
						/>
						${
							isOwner
								? `
							<button class="profile-cover-edit" id="profile-cover-edit-btn">
								<i class="bi bi-camera"></i> Edit Cover
							</button>
							<input type="file" id="profile-cover-input" accept="image/*" hidden />
						`
								: ""
						}
					</div>

					<!-- ── Identity ── -->
					<div class="profile-identity">
						<div class="profile-identity-top">
							<div class="profile-avatar-wrap">
								<img
									src="${data?.user?.avatar?.url ?? defaultAvatar}"
									alt="Profile avatar"
									class="profile-avatar-img"
									id="profile-avatar-img"
									onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
								/>
								<div class="profile-avatar-fallback" id="profile-avatar-fallback">
									${(user.username ?? "—").slice(0, 2).toUpperCase()}
								</div>
								${
									isOwner
										? `
									<button class="profile-avatar-edit-btn" id="profile-avatar-edit-btn">
										<i class="bi bi-pencil-fill"></i>
									</button>
									<input type="file" id="profile-avatar-input" accept="image/*" hidden />
								`
										: ""
								}
							</div>

							<div class="profile-identity-actions">
								${
									isOwner
										? `<button class="profile-edit-btn" id="profile-edit-btn">
											<i class="bi bi-pencil"></i> Edit Profile
										</button>`
										: `<button class="profile-follow-btn ${isFollowingViewer ? "following" : ""}" id="profile-follow-btn">
											<i class="bi ${isFollowingViewer ? "bi-person-check-fill" : "bi-person-plus"}"></i>
											${isFollowingViewer ? "Following" : "Follow"}
										</button>`
								}
							</div>
						</div>

						<h1 class="profile-name" id="profile-name">
							${user.username ?? user.username ?? "—"}
						</h1>
						<p class="profile-uid" id="profile-uid">
							@${user.username ?? "—"}
						</p>

						<div class="profile-stats" id="profile-stats">
							<div class="profile-stat" id="profile-stat-following">
								<span class="profile-stat-num" id="profile-following-count">
									${user.followingCount ?? 0}
								</span>
								<span class="profile-stat-label">Following</span>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat" id="profile-stat-followers">
								<span class="profile-stat-num" id="profile-followers-count">
									${user.followersCount ?? 0}
								</span>
								<span class="profile-stat-label">Followers</span>
							</div>
							<div class="profile-stat-divider"></div>
							<div class="profile-stat" id="profile-stat-upload">
								<span class="profile-stat-num" id="profile-upload-count">
									${user.uploadsCount ?? 0}
								</span>
								<span class="profile-stat-label">upload</span>
							</div>
						</div>

						${
							user.bio
								? `
							<p class="profile-bio" id="profile-bio">${user.bio}</p>
						`
								: ""
						}
						<p class="profile-since" id="profile-since">
							Member since ${user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
						</p>
					</div>

					<!-- ── Tabs + panels ── -->
					<div class="profile-content">
						<nav class="profile-tabs" id="profile-tabs">
							<button class="profile-tab active" data-tab="upload">
								<i class="bi bi-cloud-upload"></i> upload
							</button>
							<button class="profile-tab" data-tab="playlists">
								<i class="bi bi-collection-play"></i> Playlists
							</button>
							${
								isOwner
									? `
								<button class="profile-tab" data-tab="liked">
									<i class="bi bi-heart"></i> Liked
								</button>
							`
									: ""
							}
						</nav>

						<!-- upload panel -->
						<div class="profile-panel active-profile-panel" id="profile-panel-upload" data-panel="upload">
							<div class="profile-panel-empty ${tracks.length ? "hidden" : ""}" id="profile-upload-empty">
								<i class="bi bi-cloud-upload profile-panel-empty-icon"></i>
								<p class="profile-panel-empty-title">No upload yet</p>
								<p class="profile-panel-empty-sub">
									${isOwner ? "Share your music with the world" : "This artist hasn't uploaded yet"}
								</p>
								${
									isOwner
										? `
									<a href="/upload" class="profile-btn-accent">
										<i class="bi bi-upload"></i> Upload a Track
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
						<div class="profile-panel" id="profile-panel-playlists" data-panel="playlists">
							<div class="profile-panel-empty ${playlists.length ? "hidden" : ""}" id="profile-playlists-empty">
								<i class="bi bi-collection profile-panel-empty-icon"></i>
								<p class="profile-panel-empty-title">No playlists yet</p>
								<p class="profile-panel-empty-sub">
									${isOwner ? "Create your first playlist" : "No public playlists"}
								</p>
								${
									isOwner
										? `
									<button class="profile-btn-accent" id="profile-create-playlist-btn">
										<i class="bi bi-plus-lg"></i> Create Playlist
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
							<div class="profile-panel" id="profile-panel-liked" data-panel="liked">
								<div class="profile-panel-empty" id="profile-liked-empty">
									<i class="bi bi-heart profile-panel-empty-icon"></i>
									<p class="profile-panel-empty-title">No liked songs yet</p>
									<p class="profile-panel-empty-sub">Songs you like will appear here</p>
									<a href="/search" class="profile-btn-accent">
										<i class="bi bi-search"></i> Discover Music
									</a>
								</div>
								<div class="profile-track-list" id="profile-liked-list">
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
			<section class="profile-state profile-state--centered" id="profile-error" data-content="error">
				<div class="profile-error-icon">
					<i class="bi bi-wifi-off"></i>
				</div>
				<h3 class="profile-error-title">Couldn't load profile</h3>
				<p class="profile-error-sub" id="profile-error-msg">
					Something went wrong. Check your connection and try again.
				</p>
				<button class="profile-btn-accent" id="profile-retry-btn">
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
