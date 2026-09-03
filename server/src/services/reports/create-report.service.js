const Report = require("../../models/report.model");
const Track = require("../../models/track.model");
const User = require("../../models/user.model");
const Comment = require("../../models/comment.model");
const Playlist = require("../../models/playlist.model");

const TARGET_MODELS = { Track, User, Comment, Playlist };

const VALID_REASONS = [
	"copyright",
	"spam",
	"harassment",
	"explicit-content",
	"impersonation",
	"other",
];

const createReport = async ({
	reporterId,
	targetType,
	targetUuid,
	reason,
	description,
}) => {
	if (!TARGET_MODELS[targetType]) {
		const err = new Error("Invalid report target type");
		err.status = 400;
		throw err;
	}
	if (!VALID_REASONS.includes(reason)) {
		const err = new Error("Invalid report reason");
		err.status = 400;
		throw err;
	}

	const TargetModel = TARGET_MODELS[targetType];
	const target = await TargetModel.findOne({ uuid: targetUuid }).select(
		"_id user",
	);

	if (!target) {
		const err = new Error(`${targetType} not found`);
		err.status = 404;
		throw err;
	}

	// User targets ARE the owner; Track/Comment/Playlist have a .user owner field
	const targetOwnerId = targetType === "User" ? target._id : target.user;
	if (targetOwnerId && targetOwnerId.toString() === reporterId.toString()) {
		const err = new Error("You cannot report your own content");
		err.status = 400;
		throw err;
	}

	try {
		return await Report.create({
			reportedBy: reporterId,
			targetType,
			targetId: target._id,
			reason,
			description,
		});
	} catch (err) {
		if (err.code === 11000) {
			const dupErr = new Error("You have already reported this content");
			dupErr.status = 409;
			throw dupErr;
		}
		throw err;
	}
};

module.exports = { createReport };
