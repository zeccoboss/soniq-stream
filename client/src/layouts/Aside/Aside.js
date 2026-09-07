import { store } from "@zecco/store/index.js";
import { buildNode } from "@zecco/utils/dom/build-node";
import CreateElement from "@zecco/utils/dom/create-element";
import { sidebarEvents } from "./Aside.events.js";
import {
	buildFooterMarkup,
	buildMenuMarkup,
	parseQueryString,
	resolveActiveNavPath,
} from "./Aside.helper.js";

const Aside = () => {
	const isSidebarCollapsed = store.ui.isSidebarCollapsed;
	const activePath = resolveActiveNavPath(
		location.pathname,
		parseQueryString(),
	);

	const sidebar = new CreateElement("aside");
	sidebar.setId("sidebar").addClass("sidebar");
	if (isSidebarCollapsed) sidebar.addClass("collapsed");

	const headerNode = buildNode(`
		<div class="sidebar-header">
			<div id="logo-wrapper" class="logo-wrapper" title="Toggle Menu">
				<div class="logo logo-embedded" id="app-logo">
					<div class="logo-icon logo-orb">
						<span class="logo-orb-ring"></span>
						<i class="bi bi-soundwave"></i>
					</div>
					<h1 class="logo-text">Soniq<span>Stream</span></h1>
				</div>
			</div>
			<button id="sidebar-toggle" class="sidebar-toggle" title="Collapse Menu">
				<i class="bi bi-layout-sidebar-inset"></i>
			</button>
		</div>
	`);

	const content = `
		<div id="sidebar-dynamic-content">
			${buildMenuMarkup(store.auth.user, activePath)}
		</div>
		${buildFooterMarkup(store.auth.user)}
	`;

	sidebar.append(headerNode, buildNode(content));
	const sidebarElement = sidebar.getElement();

	// Deferred one tick so buildLayout.js has inserted this into the live
	// DOM before the MutationObserver in sidebarEvents starts watching it.
	requestAnimationFrame(() => sidebarEvents(sidebarElement));

	return sidebarElement;
};

export default Aside;
