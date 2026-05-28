const TrackModel = require("../../models/track.model");
const { getSignedUrl, BUCKETS } = require("../../services/s3.service");

const streamTrack = async (req, res) => {
	try {
		// 👈 findOne by uuid not findById
		const track = await TrackModel.findOne({ uuid: req.params.uuid }).select(
			"user storage hasAudio visibility",
		);

		if (!track) {
			return res
				.status(404)
				.json({ success: false, message: "Track not found" });
		}

		if (!track.hasAudio) {
			return res
				.status(422)
				.json({ success: false, message: "Track has no Track data" });
		}

		if (track.visibility === "private") {
			return res
				.status(403)
				.json({ success: false, message: "This track is private" });
		}

		const streamUrl = await getSignedUrl({
			bucket: BUCKETS.tracks,
			key: track.storage.key,
			expiresIn: 60,
		});

		if (!streamUrl) {
			return res
				.status(500)
				.json({ success: false, message: "Could not generate stream URL" });
		}

		//  updated to use returnDocument if you need the updated track data
		await TrackModel.findOneAndUpdate(
			{ uuid: req.params.uuid },
			{ $inc: { playCount: 1 } },
			{ returnDocument: "after" }, // Keeps Mongoose happy and clears the warning log
		);

		return res.status(200).json({
			success: true,
			data: { streamUrl, expiresIn: 60 },
		});
	} catch (err) {
		console.error("[Track] streamTrack:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
};

module.exports = { streamTrack };
