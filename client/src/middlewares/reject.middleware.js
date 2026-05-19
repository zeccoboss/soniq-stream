import toast from "@zecco/components/Toast/Toast";
import { appConfig } from "@zecco/config/app.config";

const capitalizeFirstLetter = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const rejectMiddleware = async ({ path }) => {
	const page = path.split("/")[1];
	const protectedPages = appConfig.PROTECTED_ROUTES.map(
		(route) => route.split("/")[1],
	);

	// Handle the standard authentication rejection
	if (protectedPages.includes(page)) {
		toast({
			message: `You must be logged in to access the ${capitalizeFirstLetter(page)} page.`,
			type: "warning",
			duration: 4000,
		});
	}
};
