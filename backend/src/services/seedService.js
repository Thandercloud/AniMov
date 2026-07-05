const fs = require('fs');
const path = require('path');
const Movie = require('../models/Movie');
const Anime = require('../models/Anime');
const Review = require('../models/Review');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');

const SEED_FILE = path.join(__dirname, '../../db.json');

const seedDatabase = async () => {
    try {
        console.log('MongoDB: Running database initialization and seeding check...');

        // 1. Ensure collections are created
        await Movie.createCollection();
        await Anime.createCollection();
        await Review.createCollection();
        await User.createCollection();
        await Watchlist.createCollection();
        console.log('MongoDB: All collections verified/created.');

        // Load seed data if available
        let seedData = { movies: [], anime: [], reviews: [], users: [], watchlist: [] };
        if (fs.existsSync(SEED_FILE)) {
            try {
                seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
                console.log('MongoDB: Loaded seed data from db.json');
            } catch (err) {
                console.error('MongoDB: Error parsing db.json, using fallback seeds:', err.message);
            }
        } else {
            console.log('MongoDB: db.json not found, using fallback seed data.');
        }

        // 2. Seed Movies
        const movieCount = await Movie.countDocuments();
        if (movieCount === 0) {
            console.log('MongoDB: Movies collection empty. Seeding...');
            const moviesToInsert = seedData.movies && seedData.movies.length > 0 ? seedData.movies.map(m => ({ ...m, type: 'movie' })) : [
                {
                    id: 1,
                    title: "Dune: Part Two",
                    type: "movie",
                    year: 2024,
                    rating: 9.2,
                    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                    banner: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
                    runtime: "166 min",
                    genres: ["Sci-Fi", "Adventure", "Drama"],
                    synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                    status: "Released",
                    trailer: "https://www.youtube.com/embed/Way9Dexny3w",
                    director: "Denis Villeneuve",
                    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"]
                },
                {
                    id: 2,
                    title: "Spider-Man: Across the Spider-Verse",
                    type: "movie",
                    year: 2023,
                    rating: 9.0,
                    poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                    runtime: "140 min",
                    genres: ["Animation", "Action", "Adventure"],
                    synopsis: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.",
                    status: "Released"
                }
            ];
            await Movie.insertMany(moviesToInsert);
            console.log(`MongoDB: Seeded ${moviesToInsert.length} movies.`);
        }

        // 3. Seed Anime
        const animeCount = await Anime.countDocuments();
        if (animeCount === 0) {
            console.log('MongoDB: Anime collection empty. Seeding...');
            const animeToInsert = seedData.anime && seedData.anime.length > 0 ? seedData.anime.map(a => ({ ...a, type: 'anime' })) : [
                {
                    id: 101,
                    title: "Attack on Titan: Final Season",
                    type: "anime",
                    year: 2023,
                    rating: 9.8,
                    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                    banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
                    episodes: 28,
                    genres: ["Action", "Drama", "Fantasy"],
                    synopsis: "The epic conclusion to the war between Paradis and Marley as Eren's plan reaches its climax.",
                    status: "Completed",
                    trailer: "https://www.youtube.com/embed/M_OauHnAFc8",
                    studio: "MAPPA"
                },
                {
                    id: 102,
                    title: "Demon Slayer: Kimetsu no Yaiba",
                    type: "anime",
                    year: 2023,
                    rating: 9.3,
                    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                    episodes: 55,
                    genres: ["Action", "Supernatural", "Historical"],
                    synopsis: "Tanjiro Kamado's journey to turn his sister back into a human and defeat the demon Muzan Kibutsuji.",
                    status: "Ongoing"
                }
            ];
            await Anime.insertMany(animeToInsert);
            console.log(`MongoDB: Seeded ${animeToInsert.length} anime.`);
        }

        // 4. Seed Reviews
        const reviewCount = await Review.countDocuments();
        if (reviewCount === 0) {
            console.log('MongoDB: Reviews collection empty. Seeding...');
            const reviewsToInsert = seedData.reviews && seedData.reviews.length > 0 ? seedData.reviews : [
                {
                    id: 1001,
                    movieId: 1,
                    userId: 999999,
                    user: "FilmCritic88",
                    avatar: "FC",
                    rating: 9.5,
                    title: "A Sci-Fi masterpiece",
                    content: "Villeneuve has created a sci-fi epic that will be remembered for generations.",
                    metrics: { overall: 9.5, story: 9, characters: 10, visuals: 10, sound: 9 },
                    spoiler: false,
                    privacy: "public",
                    date: "2024-03-15",
                    likes: 245
                },
                {
                    id: 1002,
                    movieId: 101,
                    userId: 999999,
                    user: "AnimeFan42",
                    avatar: "AF",
                    rating: 10,
                    title: "Perfection",
                    content: "Isayama's masterful storytelling combined with MAPPA's animation created perfection.",
                    metrics: { overall: 10, story: 10, characters: 10, visuals: 10, sound: 10 },
                    spoiler: false,
                    privacy: "public",
                    date: "2023-11-10",
                    likes: 892
                }
            ];
            await Review.insertMany(reviewsToInsert);
            console.log(`MongoDB: Seeded ${reviewsToInsert.length} reviews.`);
        }

        // 5. Seed Users
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('MongoDB: Users collection empty. Seeding users...');
            const usersToInsert = seedData.users && seedData.users.length > 0 ? seedData.users : [
                {
                    id: 999999,
                    username: "demo_user",
                    email: "demo@movani.com",
                    password: "demo123",
                    displayName: "Demo User",
                    avatar: "DU",
                    joined: new Date('2024-01-01'),
                    preferences: {
                        genres: ["Action", "Animation", "Sci-Fi", "Drama", "Fantasy"],
                        content: { movies: true, anime: true, tvshows: false }
                    },
                    stats: { reviews: 2, watchlist: 4, following: 24, followers: 18 }
                }
            ];
            await User.insertMany(usersToInsert);
            console.log(`MongoDB: Seeded ${usersToInsert.length} users.`);
        }

        // 6. Seed Watchlist
        const watchlistCount = await Watchlist.countDocuments();
        if (watchlistCount === 0) {
            console.log('MongoDB: Watchlist collection empty. Seeding watchlist...');
            const watchlistToInsert = seedData.watchlist && seedData.watchlist.length > 0 ? seedData.watchlist.map((w, idx) => ({
                id: w.id || (1001 + idx),
                userId: w.userId,
                itemId: w.itemId,
                itemType: w.itemType,
                status: w.status || (idx % 2 === 0 ? 'unwatched' : 'watching'), // Seed some unwatched and some watching
                added: w.added ? new Date(w.added) : new Date()
            })) : [
                { id: 1001, userId: 999999, itemId: 1, itemType: 'movie', status: 'unwatched', added: new Date('2024-01-15') },
                { id: 1002, userId: 999999, itemId: 101, itemType: 'anime', status: 'watching', added: new Date('2024-01-20') },
                { id: 1003, userId: 999999, itemId: 2, itemType: 'movie', status: 'unwatched', added: new Date('2024-02-10') },
                { id: 1004, userId: 999999, itemId: 102, itemType: 'anime', status: 'completed', added: new Date('2024-02-15') }
            ];
            await Watchlist.insertMany(watchlistToInsert);
            console.log(`MongoDB: Seeded ${watchlistToInsert.length} watchlist items.`);
        }

        console.log('✓ MongoDB Seeding Check Completed Successfully');
    } catch (err) {
        console.error('❌ MongoDB Seeding Error:', err);
    }
};

module.exports = { seedDatabase };
