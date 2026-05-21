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
			firstName: "System",
			lastName: "Admin",
			username: process.env.ADMIN_USERNAME,
			email: process.env.ADMIN_EMAIL,
			password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
			roles: Object.values(rolesList),
			verified: true,
			dob: new Date("1970-01-01"), // Admin placeholder
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
		admin.settingsId = newSettings._id;

		await admin.save();
		await welcomeAdmin(admin.email);

		console.log("Admin created successfully!");
	} catch (err) {
		console.error("initAdmin Error:", err);
	}
};

module.exports = { initAdmin };
