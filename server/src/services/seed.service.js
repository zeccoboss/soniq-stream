const { v4: uuidV4 } = require("uuid");
const mongoose = require("mongoose");
const TrackModel = require("../models/track.model");

const seedTracks = async () => {
	try {
		// Keep these IDs as requested
		const existingCoverId = new mongoose.Types.ObjectId(
			"6a06cc0a05d11ffe6649a351",
		);
		const existingUser = new mongoose.Types.ObjectId(
			"6a06c63a5cae47378ef3e9a4",
		);

		const genresPool = [
			"Afrobeats",
			"Amapiano",
			"Highlife",
			"Gengetone",
			"Bongo Flava",
			"Alté",
			"Palm-wine",
			"Soukous",
			"Kwaito",
		];

		const artistsPool = [
			"Echo Master",
			"Lumina",
			"Vibe Architect",
			"Solaris",
			"Kizuna",
			"Onyx Pulse",
			"Neon Safari",
			"Desert Rose",
			"Afro-Link",
			"Zion Kid",
			"Melody Ghost",
			"The Groovist",
			"Pulse King",
			"Rhythm Bandit",
			"Luna Soul",
			"Velvet Voice",
			"Deep Blue",
			"Fuji Funk",
			"Bass Line",
			"Nova Star",
		];

		const tracks = Array.from({ length: 1000 }, (_, i) => {
			const duration = 150 + Math.floor(Math.random() * 150);
			const artist =
				artistsPool[Math.floor(Math.random() * artistsPool.length)];
			const year = 2018 + Math.floor(Math.random() * 9); // 2018 to 2026

			const genreCount = Math.random() > 0.85 ? 2 : 1;
			const selectedGenres = [...genresPool]
				.sort(() => 0.5 - Math.random())
				.slice(0, genreCount);

			const bitrate = [128, 192, 320][Math.floor(Math.random() * 3)];
			const sizeInMb = ((duration * bitrate) / 8 / 1024).toFixed(1);

			// Scale playcount by year: Older tracks tend to have more plays
			const playBias = (2027 - year) * 5000;
			const playCount = Math.floor(Math.random() * 10000) + playBias;

			return {
				uuid: uuidV4(),
				title: `Track ${i + 1}`,
				name: `track_${i + 1}.mp3`,
				artist: artist,
				artists: [artist],
				album: `${artist} Essentials Vol. ${Math.ceil((i + 1) / 50)}`,
				category: "uploaded",
				codec: "libmp3lame",
				duration: duration,
				bitrate: bitrate,
				sampleRate: 44100,
				format: "track/mpeg",
				hasAudio: true,
				hasCover: Math.random() > 0.05,
				hasVideo: false,
				size: `${sizeInMb} MB`,
				year: year,
				genre: selectedGenres,
				visibility: "public",
				playCount: playCount,
				user: existingUser,
				cover: existingCoverId,
				storage: {
					key: `track/track_${i + 1}.mp3`,
					baseUrl: "https://cdn.soniqstream.app/",
					type: "s3",
				},
				createdAt: new Date(
					year,
					Math.floor(Math.random() * 12),
					Math.floor(Math.random() * 28),
				).toISOString(),
			};
		});

		// Split into chunks of 100 to prevent database timeouts
		const chunkSize = 100;
		for (let i = 0; i < tracks.length; i += chunkSize) {
			const chunk = tracks.slice(i, i + chunkSize);
			await TrackModel.insertMany(chunk);
			console.log(`Seeded chunk ${i / chunkSize + 1}/10...`);
		}

		console.log("Success: 1000 tracks seeded with enhanced variety 😹");
	} catch (err) {
		console.error("Seeding failed:", err);
	}
};

module.exports = { seedTracks };
