import CreateElement from "@zecco/utils/dom/create-element";

const FooterMobile = () => {
	// Create element
	const footer = new CreateElement("footer");

	// Set attributes and add html content
	footer.addClass("footer").setId("mob-footer").innerHTML = `
		<nav class="mob-footer">
			<ul class="footer-nav-list">
				<li id="home" class="home mobile-nav-item">
					<a href="/" id="home-nav-link" data-nav-link="/" class="nav-links mobile-nav-links">
						<i class="bi bi-house nav-icons"></i>
						<span class="mobile-nav-label">Home</span>
					</a>
				</li>

				<li id="/upload" class="upload">
					<a href="/upload" id="upload-nav-link" data-nav-link="/upload" class="nav-links  mobile-nav-links">
						<i class="bi bi-cloud-upload-fill nav-icons"></i>
						<span class="mobile-nav-label">Upload</span>
					</a>
				</li>

				<li id="/search" class="">
					<a href="/search" id="search-nav-link" data-nav-link="/search" class="nav-links  mobile-nav-links">
						<i class="bi bi-search nav-icons"></i>
						<span class="mobile-nav-label">Search</span>
					</a>
				</li>

				<!-- <li id="/profile" class="profile">
					<a href="/profile" data-nav-link="/profile" class="nav-links  mobile-nav-links">
						<i class="bi bi-person-circle nav-icons"></i>
						<span class="mobile-nav-label">Profile</span>
					</a>
				</li> -->

				<li id="library" class="library">
					<a href="/library"  id="lib-nav-link" data-nav-link="/library" class="nav-links  mobile-nav-links">
						<i class="bi bi-music-note-list nav-icons"></i>
						<span class="mobile-nav-label">Library</span>
					</a>
				</li>
			</ul>
		</nav>
	`;
	// biome-ignore lint/suspicious/useIterableCallbackReturn: <Making the line short >
	footer.getChildren("svg").forEach((svg) => svg.classList.add("footer-svg"));

	return footer.getElement();
};

export default FooterMobile;
