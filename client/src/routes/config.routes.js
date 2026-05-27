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

export const routes = [
	// ── Public pages — rendered into <main> ──────────────────

	{
		path: "/",
		component: HomePage,
		// outlet: "main" is the default — no need to specify
	},
	{
		path: "/search",
		component: SearchPage,
	},
	{
		path: "/library",
		component: LibraryPage,
		guard: "auth",
	},

	// ── Auth-guarded pages ───────────────────────────────────

	{
		path: "/upload",
		component: UploadPage,
		guard: "auth",
	},
	{
		path: "/settings",
		component: SettingsPage,
		guard: "auth",
	},
	{
		// /profile/zeccoboss → ctx.params.username = "zeccoboss"
		path: "/profile",
		component: ProfilePage,
		guard: "auth",
	},

	// ── Auth pages — rendered into #app root ─────────────────
	// These cover the full viewport on top of the layout shell.
	// They use outlet: "root" so the sidebar/footer stay in the DOM
	// but are hidden behind the auth page (z-index / position: fixed).

	{
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
