const screenBreakPoints = {
	mobileScreen: matchMedia("(min-width: 150px) and (max-width: 680px)"),
	bigScreen: matchMedia("(min-width: 681px) and (max-width: 940px)"),
	largeScreen: matchMedia("(min-width: 941px) and (max-width: 1220px)"),
};

const mobileScreen = screenBreakPoints.mobileScreen;
const bigScreen = screenBreakPoints.bigScreen;
const largeScreen = screenBreakPoints.largeScreen;

export { mobileScreen, bigScreen, largeScreen, screenBreakPoints };
