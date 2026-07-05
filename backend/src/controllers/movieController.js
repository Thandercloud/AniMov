const Movie = require('../models/Movie');
const mongoose = require('mongoose');

// Helper to find movie by ObjectId or custom numeric id
const findMovieQuery = (idParam) => {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return { $or: [{ _id: idParam }, { id: Number(idParam) || -1 }] };
    }
    return { id: Number(idParam) || -1 };
};

// GET /api/movies
const getAllMovies = async (req, res, next) => {
    try {
        const filters = {};
        if (req.query.genre) {
            filters.genres = req.query.genre;
        }
        if (req.query.year) {
            filters.year = Number(req.query.year);
        }
        
        const movies = await Movie.find(filters);
        res.json({ success: true, count: movies.length, data: movies });
    } catch (err) {
        next(err);
    }
};

// GET /api/movies/:id
const getMovieById = async (req, res, next) => {
    try {
        const movie = await Movie.findOne(findMovieQuery(req.params.id));
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, data: movie });
    } catch (err) {
        next(err);
    }
};

// POST /api/movies
const createMovie = async (req, res, next) => {
    try {
        const movieData = req.body;
        const genresList = Array.isArray(movieData.genres)
            ? movieData.genres
            : (movieData.genres ? movieData.genres.split(',').map(g => g.trim()) : []);

        const newMovie = new Movie({
            ...movieData,
            id: Number(movieData.id) || Date.now(),
            rating: parseFloat(movieData.rating || 0),
            year: parseInt(movieData.year || new Date().getFullYear()),
            genres: genresList,
            type: 'movie'
        });

        await newMovie.save();
        res.status(201).json({ success: true, movie: newMovie });
    } catch (err) {
        next(err);
    }
};

// PUT /api/movies/:id
const updateMovie = async (req, res, next) => {
    try {
        if (req.body.genres && !Array.isArray(req.body.genres)) {
            req.body.genres = req.body.genres.split(',').map(g => g.trim());
        }

        const updatedMovie = await Movie.findOneAndUpdate(
            findMovieQuery(req.params.id),
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedMovie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        res.json({ success: true, data: updatedMovie });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/movies/:id
const deleteMovie = async (req, res, next) => {
    try {
        const deletedMovie = await Movie.findOneAndDelete(findMovieQuery(req.params.id));
        if (!deletedMovie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, message: 'Movie deleted successfully', data: deletedMovie });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie
};
