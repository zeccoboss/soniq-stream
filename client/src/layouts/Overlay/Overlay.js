import CreateElement from "@zecco/utils/dom/create-element";
import "./Overlay.styles.css";

const Overlay = () => {
	const root = new CreateElement("div");
	root.addClass("overlay", "overlay--hidden").setId("overlay");
	// overlay.className = "toast-overlay";
	root.setAttribute("aria-live", "polite");
	root.setAttribute("aria-atomic", "false");
	//  "overlay--show";
	return root.getElement();
};

let overlay = null;

const getOverlay = () => {
	if (overlay && document.body.contains(overlay)) return overlay;
	overlay = Overlay();
	document.body.appendChild(overlay);
	return overlay;
};

export { Overlay, Overlay as default, getOverlay };
