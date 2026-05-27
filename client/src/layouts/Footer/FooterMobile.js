import CreateElement from "@zecco/utils/dom/create-element";

const FooterMobile = () => {
	// Create element
	const footer = new CreateElement("footer");

	// Set attributes and add html content
	footer.addClass("footer").setId("mob-footer").innerHTML = `
		<nav class="mob-footer-nav">
			<ul class="mob-footer-list">
				<li class="mob-nav-item">
					<a href="/" id="home-nav-link" data-nav-link="/" class="mob-nav-link active-nav">
						<i class="bi bi-house-fill mob-nav-icon"></i>
						<span class="mob-nav-label">Home</span>
					</a>
				</li>

				<li class="mob-nav-item">
					<a href="/search" id="search-nav-link" data-nav-link="/search" class="mob-nav-link">
						<i class="bi bi-search mob-nav-icon"></i>
						<span class="mob-nav-label">Search</span>
					</a>
				</li>

				<li class="mob-nav-item mob-nav-item--center">
					<a href="/upload" id="upload-nav-link" data-nav-link="/upload" class="mob-nav-link mob-nav-link--primary">
						<i class="bi bi-plus-circle-fill mob-nav-icon-lg"></i>
						<span class="mob-nav-label-sm">New</span>
					</a>
				</li>

				<li class="mob-nav-item">
					<a href="/library" id="lib-nav-link" data-nav-link="/library" class="mob-nav-link">
						<i class="bi bi-collection mob-nav-icon"></i>
						<span class="mob-nav-label">Library</span>
					</a>
				</li>

				<li class="mob-nav-item">
					<a href="/profile" id="profile-nav-link" data-nav-link="/profile" class="mob-nav-link">
						<i class="bi bi-person-circle mob-nav-icon"></i>
						<span class="mob-nav-label">You</span>
					</a>
				</li>
			</ul>
		</nav>
	`;

	return footer.getElement();
};

export default FooterMobile;
