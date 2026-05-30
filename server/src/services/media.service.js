const { getSignedUrl, BUCKETS } = require("./s3.service");

const createStreamPayload = async ({ storageKey, expiresIn }) => {
	const url = await getSignedUrl({
		bucket: BUCKETS.tracks,
		key: storageKey,
		expiresIn,
	});

	return {
		stream: {
			url,
			expiresIn,
		},
	};
};

const createTrackDownloadPayload = async ({ storageKey, expiresIn }) => {
	const url = await getSignedUrl({
		bucket: BUCKETS.tracks,
		key: storageKey,
		expiresIn,
	});

	return {
		download: {
			url,
			expiresIn,
		},
	};
};
module.exports = { createStreamPayload, createTrackDownloadPayload };
