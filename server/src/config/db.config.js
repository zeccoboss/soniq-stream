const mongoose = require("mongoose");

const getUri = () => {
	const uri =
		process.env.NODE_ENV === "production"
			? process.env.MONGODB_URI
			: process.env.DATABASE_URI;

	if (!uri) throw new Error("MongoDB URI is not defined");

	return uri;
};

const connectDB = async () => {
	const dbUri = getUri();

	try {
		console.time("MongoDB connection");

		await mongoose.connect(dbUri, {
			dbName: "soniq", // This forces the connection to use the soniq database
			autoIndex: process.env.NODE_ENV !== "production", // Only auto-index if NOT in production
			serverSelectionTimeoutMS: 5000, // prevents long hanging on bad connection
			socketTimeoutMS: 45000, // avoids silent stalls
		});

		console.timeEnd("MongoDB connection");
		console.log("MongoDB connected successfully.");
	} catch (error) {
		console.error("Connection error:", error.message);
		process.exit(1);
	}
};
module.exports = { connectDB };
