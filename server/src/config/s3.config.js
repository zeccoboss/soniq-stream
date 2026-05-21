const { S3Client } = require("@aws-sdk/client-s3");

function getS3Config() {
	const isProduction = process.env.NODE_ENV === "production";
	console.log(
		`[S3 Config] Initializing S3 Client in ${isProduction ? "production" : "development"} mode...`,
	);

	if (isProduction) {
		// Production Configuration (Backblaze B2)
		return {
			region: process.env.B2_REGION,
			endpoint: process.env.B2_ENDPOINT,
			credentials: {
				accessKeyId: process.env.B2_ACCESS_KEY,
				secretAccessKey: process.env.B2_SECRET_KEY,
			},
			forcePathStyle: true,
			// Backblaze uses HTTPS/TLS by default, so we don't set tls: false here
		};
	} else {
		// Development Configuration (Local MinIO)
		return {
			endpoint: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
			region: process.env.MINIO_REGION || "us-east-1",
			credentials: {
				accessKeyId: process.env.MINIO_ACCESS_KEY,
				secretAccessKey: process.env.MINIO_SECRET_KEY,
			},
			forcePathStyle: true, // Required for MinIO pathing
			tls: false, // Keeps your local non-HTTPS setup working perfectly
		};
	}
}

const s3Client = new S3Client(getS3Config());

module.exports = s3Client;
