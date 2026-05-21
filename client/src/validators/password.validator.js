import { buttonLoadingSpinner } from "@zecco/components/ButtonLoadingSpinner.js";
import loadLoggedInUser from "@zecco/helpers/load-logged-in-user.js";
import { showFormFeed } from "@zecco/helpers/show-form-feed.js";
import { loginAccountService } from "@zecco/services/login-account-service.js";
import CreateElement from "@zecco/utils/dom/create-element";

const validateLogin = () => {
	const loginForm = document.querySelector("#login-form");
	const passwordInput = document.querySelector(".lg_user_pwd");
	const identifierInput = document.querySelector(".lg_user_name");
	const submitBtn = document.querySelector("#lg-submit-btn");

	// Create element that holds feed for form validation
	// const feedHolder = new CreateElement("span", "Feed holder"); // Create elemet
	// feedHolder.addClass("feed_holder"); // Add the class

	// submitBtn.addEventListener("click", async (e) => {
	// 	e.preventDefault();

	// 	// Get values from inputs
	// 	const identifier = identifierInput.value.trim().toLocaleLowerCase();
	// 	const userPassword = passwordInput.value.trim().toLocaleLowerCase();

	// 	if (!identifier) {
	// 		showFormFeed(
	// 			`All feilds are required!`,
	// 			feedHolder.getElement(),
	// 			loginForm,
	// 			identifierInput,
	// 		);

	// 		feedHolder.addClass("error_color");
	// 		feedHolder.removeClass("warning_color");

	// 		identifierInput.style.outline = `1px solid var(--error-border)`;
	// 		return;
	// 	} else {
	// 		feedHolder.remove();
	// 		identifierInput.style.outline =
	// 			"1px solid var(--clear-border-warning)";
	// 	}

	// 	if (!userPassword) {
	// 		showFormFeed(
	// 			`All feilds are required!`,
	// 			feedHolder.getElement(),
	// 			loginForm,
	// 			passwordInput,
	// 		);

	// 		feedHolder.addClass("error_color");
	// 		feedHolder.removeClass("warning_color");

	// 		passwordInput.style.outline = `1px solid var(--error-border)`;
	// 		return;
	// 	} else {
	// 		feedHolder.remove();
	// 		passwordInput.style.outline = "1px solid var(--clear-border-warning)";
	// 	}

	// 	if (identifier && userPassword) {
	// 		const user = { identifier, password: userPassword };
	// 		submitBtn.disabled = true;
	// 		submitBtn.appendChild(buttonLoadingSpinner.getElement());
	// 		const axiosDetails = await loginAccountService("href="/auth/login"", user); // Call service function to send request
	// 		setTimeout(() => {
	// 			submitBtn.disabled = false;
	// 			buttonLoadingSpinner.remove();

	// 			if (axiosDetails.status === 404) {
	// 				feedHolder.removeClass("form_feed");

	// 				showFormFeed(
	// 					axiosDetails.data.error,
	// 					feedHolder.getElement(),
	// 					loginForm,
	// 					passwordInput,
	// 				);

	// 				feedHolder.getElement().style = "text-align: center";

	// 				passwordInput.style.outline = `1px solid var(--error-border)`;
	// 				identifierInput.style.outline = `1px solid var(--error-border)`;

	// 				feedHolder.addClass("error_color");
	// 				feedHolder.removeClass("warning_color");
	// 				return;
	// 			} else if (axiosDetails.status === 403) {
	// 				feedHolder.removeClass("form_feed");

	// 				showFormFeed(
	// 					axiosDetails.data.error,
	// 					feedHolder.getElement(),
	// 					loginForm,
	// 					passwordInput,
	// 				);

	// 				passwordInput.style.outline = `1px solid var(--error-border)`;
	// 				identifierInput.style.outline = `1px solid var(--error-border)`;

	// 				feedHolder.addClass("error_color");
	// 				feedHolder.removeClass("warning_color");
	// 				return;
	// 			} else if (axiosDetails.status === 400) {
	// 				showFormFeed(
	// 					axiosDetails.data.error,
	// 					feedHolder.getElement(),
	// 					loginForm,
	// 					passwordInput,
	// 				);

	// 				feedHolder.removeClass("error_color");
	// 				feedHolder.addClass("warning_color");
	// 				return;
	// 			} else if (axiosDetails.status === 500) {
	// 				showFormFeed(
	// 					`500 Network error`,
	// 					feedHolder.getElement(),
	// 					loginForm,
	// 					passwordInput,
	// 				);

	// 				feedHolder.removeClass("error_color");
	// 				feedHolder.addClass("warning_color");
	// 				return;
	// 			} else if (axiosDetails.status === 202) {
	// 				showFormFeed(
	// 					`Processing... Login successful`,
	// 					feedHolder.getElement(),
	// 					loginForm,
	// 					passwordInput,
	// 				);

	// 				passwordInput.style.outline = `1px solid var(--clear-border-warning)`;
	// 				identifierInput.style.outline = `1px solid var(--clear-border-warning)`;
	// 				feedHolder.addClass("clear_error_color");

	// 				setTimeout(() => {
	// 					// Call to load user details after login
	// 					// loadLoggedInUser(axiosDetails.data.accessToken);
	// 					console.log("[SUCCESS]: Login successful");
	// 				}, 3000);
	// 			}
	// 		}, 1000);
	// 	}
	// });
};

export { validateLogin };
