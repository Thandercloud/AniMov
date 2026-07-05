const Anime = require('../models/Anime');
const mongoose = require('mongoose');

// Helper to find anime by ObjectId or custom numeric id
const findAnimeQuery = (idParam) => {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return { $or: [{ _id: idParam }, { id: Number(idParam) || -1 }] };
    }
    return { id: Number(idParam) || -1 };
};

// GET /api/anime
const getAllAnime = async (req, res, next) => {
    try {
        const filters = {};
        if (req.query.genre) {
            filters.genres = req.query.genre;
        }
        if (req.query.year) {
            filters.year = Number(req.query.year);
        }

        const animeList = await Anime.find(filters);
        res.json({ success: true, count: animeList.length, data: animeList });
    } catch (err) {
        next(err);
    }
};

// GET /api/anime/:id
const getAnimeById = async (req, res, next) => {
    try {
        const anime = await Anime.findOne(findAnimeQuery(req.params.id));
        if (!anime) {
            return res.status(404).json({ success: false, message: 'Anime not found' });
        }
        res.json({ success: true, data: anime });
    } catch (err) {
        next(err);
    }
};

// POST /api/anime
const createAnime = async (req, res, next) => {
    try {
        const animeData = req.body;
        const genresList = Array.isArray(animeData.genres)
            ? animeData.genres
            : (animeData.genres ? animeData.genres.split(',').map(g => g.trim()) : []);

        const newAnime = new Anime({
            ...animeData,
            id: Number(animeData.id) || Date.now(),
            rating: parseFloat(animeData.rating || 0),
            year: parseInt(animeData.year || new Date().getFullYear()),
            genres: genresList,
            type: 'anime'
        });

        await newAnime.save();
        res.status(201).json({ success: true, anime: newAnime });
    } catch (err) {
        next(err);
    }
};

// PUT /api/anime/:id
const updateAnime = async (req, res, next) => {
    try {
        if (req.body.genres && !Array.isArray(req.body.genres)) {
            req.body.genres = req.body.genres.split(',').map(g => g.trim());
        }

        const updatedAnime = await Anime.findOneAndUpdate(
            findAnimeQuery(req.params.id),
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedAnime) {
            return res.status(404).json({ success: false, message: 'Anime not found' });
        }

        res.json({ success: true, data: updatedAnime });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/anime/:id
const deleteAnime = async (req, res, next) => {
    try {
        const deletedAnime = await Anime.findOneAndDelete(findAnimeQuery(req.params.id));
        if (!deletedAnime) {
            return res.status(404).json({ success: false, message: 'Anime not found' });
        }
        res.json({ success: true, message: 'Anime deleted successfully', data: deletedAnime });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllAnime,
    getAnimeById,
    createAnime,
    updateAnime,
    deleteAnime
};
