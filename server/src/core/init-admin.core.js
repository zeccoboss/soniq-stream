const bcrypt = require("bcrypt");
const { rolesList } = require("../config/roles-list.config");
const { v4: uuidV4 } = require("uuid");
const UserModel = require("../models/user.model");
const appConfig = require("../config/app.config");
const {
	avaterImageHandler,
	bannerImageHandler,
	getImageExtension,
} = require("../helpers/handle-images.helpers");
const { welcomeAdmin } = require("../helpers/mailer.helper");
const {
	getLocalMediaSize,
	getLocalImageDimensions,
} = require("../helpers/media.helpers");
const SettingsModel = require("../models/settings.model");

const initAdmin = async () => {
	try {
		const adminExists = await UserModel.findOne({
			roles: { $in: [rolesList.Admin] },
		});
		if (adminExists) return console.log("Admin already exists!");

		const adminAvatarKey = appConfig.local.adminAvatarKey;
		const adminBannerKey = appConfig.local.bannerKey;

		const adminAvatarDimensions =
			await getLocalImageDimensions(adminAvatarKey);
		const adminBannerDimensions =
			await getLocalImageDimensions(adminBannerKey);

		if (!adminAvatarDimensions || !adminBannerDimensions) {
			console.error("Error retrieving admin image dimensions.");
			return;
		}

		console.log("Creating Admin...");

		const admin = await UserModel.create({
			uuid: uuidV4(),
			firstName: process.env.ADMIN_FIRST_NAME,
			lastName: process.env.ADMIN_LAST_NAME,
			username: process.env.ADMIN_USERNAME,
			email: process.env.ADMIN_EMAIL,
			fullname: process.env.ADMIN_FULLNAME,
			password: await bcrypt.hash(process.env.ADMIN_TEST_PASSWORD, 10),
			roles: Object.values(rolesList),
			verified: true,
			dob: new Date("2005-04-10"), // Admin placeholder
			gender: "other",
			country: "US",
			genres: ["Classical"], // Admin requirement
			termsAccepted: true,
			verificationToken: null,
		});

		const avatarConfig = {
			user: admin._id,
			format: `image/${getImageExtension(adminAvatarKey)}`,
			size: getLocalMediaSize(adminAvatarKey),
			dimensions: adminAvatarDimensions,
			storage: {
				key: adminAvatarKey,
				baseUrl: appConfig.base,
				type: "local",
			},
		};
		const bannerConfig = {
			user: admin._id,
			format: `image/${getImageExtension(adminBannerKey)}`,
			size: getLocalMediaSize(adminBannerKey),
			dimensions: adminBannerDimensions,
			storage: {
				key: adminBannerKey,
				baseUrl: appConfig.base,
				type: "local",
			},
		};

		const [avatar, banner] = await Promise.all([
			avaterImageHandler(avatarConfig),
			bannerImageHandler(bannerConfig),
		]);

		admin.avatar = avatar._id;
		admin.banner = banner._id; // Updated from 'cover' to 'banner'

		const newSettings = await SettingsModel.create({ user: admin._id });
		admin.settings = newSettings._id;

		await admin.save();
		welcomeAdmin(admin.email);

		console.log("Admin created successfully!");
	} catch (err) {
		console.error("initAdmin Error:", err);
	}
};

module.exports = { initAdmin };
