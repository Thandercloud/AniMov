const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');
const Anime = require('../models/Anime');
const Review = require('../models/Review');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const movieRoutes = require('./movieRoutes');
const animeRoutes = require('./animeRoutes');
const reviewRoutes = require('./reviewRoutes');
const watchlistRoutes = require('./watchlistRoutes');
const adminRoutes = require('./adminRoutes');

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/movies', movieRoutes);
router.use('/api/anime', animeRoutes);
router.use('/api/reviews', reviewRoutes);
router.use('/api/watchlist', watchlistRoutes);
router.use('/api/admin', adminRoutes);

// GET /api/search
router.get('/api/search', async (req, res, next) => {
    try {
        const query = req.query.q || '';
        if (!query.trim()) {
            return res.json({ success: true, movies: [], anime: [] });
        }
        const regex = new RegExp(query, 'i');
        const movies = await Movie.find({
            $or: [
                { title: regex },
                { genres: regex },
                { director: regex }
            ]
        });
        const anime = await Anime.find({
            $or: [
                { title: regex },
                { genres: regex },
                { studio: regex }
            ]
        });
        res.json({ success: true, movies, anime });
    } catch (err) {
        next(err);
    }
});

// Aggregated /data.json endpoint for frontend compatibility
router.get('/data.json', async (req, res, next) => {
    try {
        const movies = await Movie.find({});
        const anime = await Anime.find({});
        const reviews = await Review.find({});
        const users = await User.find({});
        const watchlist = await Watchlist.find({});
        
        res.json({
            movies,
            anime,
            trending: [1, 101, 2, 102], // default trending IDs from seed data
            reviews,
            users,
            watchlist,
            moviesData: movies,
            animeData: anime
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
