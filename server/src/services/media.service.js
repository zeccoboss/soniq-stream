const { getSignedUrl, BUCKETS } = require("./s3.service");

const createStreamPayload = async ({ storageKey, expiresIn = 180000 }) => {
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

module.exports = { createStreamPayload };
