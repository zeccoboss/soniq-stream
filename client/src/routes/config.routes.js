// ============================================================
/** biome-ignore-all assist/source/organizeImports: <To organize imports> */
//  config.routes.js
//
//  Route table for the SoniqStream SPA.
//
//  Outlet rules:
//    "main"  (default) — rendered inside <main> within the layout shell
//    "root"            — rendered into #app, covers full viewport
//                        Use for: auth pages, 404, verification
//
//  Guard values:
//    "auth"  — user must be logged in (setAuthChecker returns truthy)
//    "admin" — user must have role "admin"
//
//  Lazy loading:
//    Set lazy: true and component: () => import("./Page.js")
//    The module is not loaded until the user first visits.
// ============================================================

// ── Regular pages ────────────────────────────────────────────
import { HomePage } from "@zecco/pages/Home/HomePage.js";
import { LibraryPage } from "@zecco/pages/Library/LibraryPage.js";
import { SearchPage } from "@zecco/pages/Search/SearchPage.js";
import { UploadPage } from "@zecco/pages/Upload/UploadPage.js";
import { SettingsPage } from "@zecco/pages/Settings/SettingsPage.js";
import { ProfilePage } from "@zecco/pages/Profile/ProfilePage.js";

// ── Auth pages (outlet: "root") ──────────────────────────────
import { LoginPage } from "@zecco/pages/Login/LoginPage.js";
import { RegisterPage } from "@zecco/pages/Register/RegisterPage.js";
import { PasswordPage } from "@zecco/pages/Password/PasswordPage.js";
import { VerificationPage } from "@zecco/pages/Verification/VerificationPage.js";
import { mobileScreen } from "@zecco/core/screen-break-points";
import { NotificationPage } from "@zecco/pages/Notifications/NotificationPage.js";
import { PlaylistPage } from "@zecco/pages/Playlist/PlaylistPage";

export const routes = [
	// ── Public pages — rendered into <main> ──────────────────

	{
		// / is the default route — it will be matched when the user visits the root of the site (e.g., https://example.com/)
		path: "/",
		component: HomePage,
		// outlet: "main" is the default — no need to specify
	},
	{
		// /search is the search page — it will be matched when the user visits /search (e.g., https://example.com/search)
		path: "/search",
		component: SearchPage,
	},
	{
		// /profile → your own profile (ctx.params is empty; ProfilePage
		// falls back to currentUser.uuid when no param is present)
		path: "/profile",
		component: ProfilePage,
	},
	{
		// Never a nav destination — always a drill-in from a card click.
		// Public playlists are viewable by guests, so no auth guard;
		// PlaylistPage itself handles private/not-found states.
		path: "/playlist",
		component: PlaylistPage,
	},

	// ── Auth-guarded pages ───────────────────────────────────
	{
		// /library is the user's library page — it will be matched when the user visits /library (e.g., https://example.com/library)
		path: "/library",
		component: LibraryPage,
		guard: "auth",
	},
	{
		// /notification is the user's notification page — it will be matched when the user visits /notification (e.g., https://example.com/notification)
		path: "/notification",
		component: NotificationPage,
	},
	{
		// /upload is the upload page — it will be matched when the user visits /upload (e.g., https://example.com/upload)
		path: "/upload",
		component: UploadPage,
		guard: "auth",
	},
	{
		// /settings is the settings page — it will be matched when the user visits /settings (e.g., https://example.com/settings)
		path: "/settings",
		component: SettingsPage,
		guard: "auth",
	},

	// ── Auth pages — rendered into #app root ─────────────────
	// These cover the full viewport on top of the layout shell.
	// They use outlet: "root" so the sidebar/footer stay in the DOM
	// but are hidden behind the auth page (z-index / position: fixed).

	{
		// /login is the login page — it will be matched when the user visits /auth/login (e.g., https://example.com/auth/login)
		path: "/auth/login",
		component: LoginPage,
		outlet: "root",
	},
	{
		// Register is a single page that manages its own 3-step flow
		// internally — no child routes needed.
		path: "/auth/register",
		component: RegisterPage,
		outlet: "root",
	},
	{
		// Forgot password — manages its own 5-step flow internally.
		path: "/auth/forgot-password",
		component: PasswordPage,
		outlet: "root",
	},
	{
		// Shared verification page — handles both email verify
		// and password reset tokens via ?type=register|reset query param.
		path: "/auth/verify-reset",
		component: VerificationPage,
		outlet: "root",
	},

	{
		// Shared verification page — handles both email verify
		// and password reset tokens via ?type=register|reset query param.
		path: "/auth/verify",
		component: VerificationPage,
		outlet: "root",
	},
	{
		path: "/player",
		outlet: () => (mobileScreen.matches ? "root" : "main"),
		lazy: true,
		component: () =>
			import("@zecco/pages/Player/PlayerPage.js").then((mod) => mod.default),
	},

	// ── Lazy-loaded pages ────────────────────────────────────
	// Module not loaded until first visit.

	{
		path: "/admin",
		guard: "admin",
		lazy: true,
		component: () => import("@zecco/pages/Admin/AdminPage.js"),
	},
	{
		path: "/dashboard",
		// guard: "admin",
		lazy: true,
		component: () => import("@zecco/pages/Dashboard/DashboardPage.js"),
	},
];
