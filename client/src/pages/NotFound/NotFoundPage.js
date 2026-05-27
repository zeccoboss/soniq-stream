import { buildNode } from "@zecco/utils/dom/build-node.js";
import "./NotFound.style.css";

/**
 * NotFoundPage — 404 handler
 *
 * Route:   setNotFound() in router — catches any unmatched path
 * Outlet:  "root" — renders directly into #app, no sidebar/footer
 *
 * No states needed — always shows the same content.
 * Router passes ctx so we can show the attempted path.
 *
 * @async
 * @param {Object} ctx - Router context { path }
 * @returns {Promise<Element>}
 */
export const NotFoundPage = async (ctx) => {
	const attemptedPath = ctx?.path ?? "";

	const root = buildNode(`
		<div class="nf-page">

			<!-- Background noise/glow -->
			<div class="nf-glow nf-glow--1"></div>
			<div class="nf-glow nf-glow--2"></div>

			<!-- Logo -->
			<a href="/" class="nf-logo" data-replace>
				Soniq<span>Stream</span>
			</a>

			<!-- Main content -->
			<div class="nf-body">

				<!-- Giant 404 -->
				<div class="nf-code-wrap" aria-hidden="true">
					<span class="nf-code">4</span>
					<div class="nf-vinyl">
						<div class="nf-vinyl-label">
							<i class="bi bi-music-note-beamed"></i>
						</div>
					</div>
					<span class="nf-code">4</span>
				</div>

				<h1 class="nf-title">Lost in the noise</h1>
				<p class="nf-sub">
					The page
					${
						attemptedPath
							? `<code class="nf-path">${attemptedPath}</code>`
							: "you're looking for"
					}
					doesn't exist or was moved.
				</p>

				<!-- Actions -->
				<div class="nf-actions">
					<a href="/" class="nf-btn-ghost" data-fallback="/" data-back data-replace>
						<i class="bi bi-arrow-left"></i> Go Back
						<!-- data-back: tries history.back(), falls back to "/" if no history -->
						<!-- This is better UX than always going home, because if they got here via a broken link within the app, they can just go back to where they were instead of losing their place -->
						<!-- If they came from an external site, history.back() will just take them back there, which is also fine because they can try to find the correct link there -->
					</a>
					<a href="/" class="nf-btn-primary" data-replace>
						<i class="bi bi-house-fill"></i> Go Home
					</a>
					<a href="/search" class="nf-btn-ghost">
						<i class="bi bi-search"></i> Search
					</a>
				</div>

				<!-- Quick nav -->
				<div class="nf-nav">
					<span class="nf-nav-label">Or jump to</span>
					<div class="nf-nav-links">
						<a href="/library"  class="nf-nav-link">Library</a>
						<span class="nf-nav-dot" aria-hidden="true"></span>
						<a href="/upload"   class="nf-nav-link">Upload</a>
						<span class="nf-nav-dot" aria-hidden="true"></span>
						<a href="/settings" class="nf-nav-link">Settings</a>
					</div>
				</div>

			</div>

		</div>
	`);

	return root;
};
