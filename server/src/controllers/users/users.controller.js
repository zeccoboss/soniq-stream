const bcrypt = require("bcrypt");
const { v4: uuidV4 } = require("uuid");
const UserModel = require("../../models/user.model");
const { rolesList } = require("../../config/roles-list.config");
const {
	getPublicProfile,
} = require("../../services/feeds/profile-feed.service");

const SENSITIVE_FIELDS =
	"-password -refreshToken -verificationToken -verificationTokenExpiry -passwordVerificationToken -passwordVerificationTokenExpiry -lastPasswordVerificationSentAt -lastUserVerificationSentAt";

// ── GET /users ─────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			verified,
			search,
			sortBy = "createdAt",
			order = "desc",
		} = req.query;

		const pageNum = Math.max(1, parseInt(page));
		const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
		const skip = (pageNum - 1) * limitNum;

		const filter = {};
		if (verified !== undefined) filter.verified = verified === "true";
		if (search) {
			const regex = { $regex: search, $options: "i" };
			filter.$or = [
				{ username: regex },
				{ email: regex },
				{ fullname: regex },
			];
		}

		const SORTABLE = ["createdAt", "username", "email"];
		const sortField = SORTABLE.includes(sortBy) ? sortBy : "createdAt";
		const sortOrder = order === "asc" ? 1 : -1;

		const [users, total] = await Promise.all([
			UserModel.find(filter)
				.select(SENSITIVE_FIELDS)
				.sort({ [sortField]: sortOrder })
				.skip(skip)
				.limit(limitNum),
			UserModel.countDocuments(filter),
		]);

		const totalPages = Math.ceil(total / limitNum);

		return res.status(200).json({
			success: true,
			data: users,
			pagination: {
				total,
				totalPages,
				currentPage: pageNum,
				limit: limitNum,
				hasNextPage: pageNum < totalPages,
				hasPrevPage: pageNum > 1,
			},
		});
	} catch (err) {
		console.error("[Users] getAllUsers:", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// ── GET /users/:uuid ───────────────────────────────────────────────────────────
const getUser = async (req, res) => {
	try {
		const { uuid } = req.params; // 👈 was destructuring {id} but using uuid
		const isOwner = req.user.uuid === uuid;
		const isAdmin = req.user.roles?.includes(rolesList.Admin);

		const user = await UserModel.findOne({ uuid }).select(SENSITIVE_FIELDS);

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (!isOwner && !isAdmin) {
			return res.status(200).json({
				success: true,
				data: {
					uuid: user.uuid,
					username: user.username,
					fullname: user.fullname,
					bio: user.bio,
					avatar: user.avatar,
					cover: user.cover,
				},
			});
		}

		return res.status(200).json({ success: true, data: user });
	} catch (err) {
		console.error("[Users] getUser:", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const getUserProfile = async (req, res) => {
	try {
		const { username } = req.params;
		const profileData = await getPublicProfile(username);
		res.json({ success: true, data: profileData });
	} catch (error) {
		res.status(404).json({ success: false, message: error.message });
	}
};

// ── POST /users ────────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			username,
			email,
			password,
			dob,
			gender,
			country,
			genres,
			termsAccepted,
		} = req.body;

		const existingEmail = await UserModel.findOne({ email });
		if (existingEmail) {
			return res
				.status(409)
				.json({ success: false, message: "Email already exists" });
		}

		const user = await UserModel.create({
			uuid: uuidV4(),
			firstName,
			lastName,
			username,
			email,
			password: await bcrypt.hash(password, 10),
			roles: [rolesList.User],
			verified: true,
			authProviders: ["local"],
			dob,
			gender,
			country,
			genres,
			termsAccepted,
			avatar: null,
			banner: null, // Fixed: schema uses 'banner', not 'cover'
		});

		return res.status(201).json({
			success: true,
			message: "User created successfully",
			data: { uuid: user.uuid, username: user.username, email: user.email },
		});
	} catch (err) {
		console.error("[Users] createUser:", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// ── PUT /users/me ──────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
	try {
		const userId = req.user._id; // internal _id for DB lookup
		const { username, fullname, bio } = req.body;

		const user = await UserModel.findById(userId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (username) user.username = username;
		if (fullname) user.fullname = fullname;
		if (bio !== undefined) user.bio = bio;

		await user.save();

		return res.status(200).json({
			success: true,
			message: "Profile updated",
			data: {
				uuid: user.uuid,
				username: user.username,
				fullname: user.fullname,
				bio: user.bio,
			},
		});
	} catch (err) {
		console.error("[Users] updateUser:", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// ── DELETE /users/:uuid ────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
	try {
		const { uuid } = req.params; // 👈 was {id} but using uuid
		const isAdmin = req.user.roles?.includes(rolesList.Admin);
		const isOwner = req.user.uuid === uuid; // 👈 compare uuids not _id vs id

		if (!isAdmin && !isOwner) {
			return res.status(403).json({ success: false, message: "Forbidden" });
		}

		const user = await UserModel.findOneAndDelete({ uuid });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		return res
			.status(200)
			.json({ success: true, message: "User deleted successfully" });
	} catch (err) {
		console.error("[Users] deleteUser:", err);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

module.exports = {
	getAllUsers,
	getUser,
	getUserProfile,
	createUser,
	updateUser,
	deleteUser,
};
