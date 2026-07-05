const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'movie', enum: ['movie', 'anime'] },
    year: { type: Number },
    rating: { type: Number, default: 0 },
    poster: { type: String },
    banner: { type: String },
    runtime: { type: String },
    genres: { type: [String], default: [] },
    synopsis: { type: String },
    status: { type: String },
    trailer: { type: String },
    director: { type: String },
    cast: { type: [String], default: [] },
    userId: { type: Number, default: 0 }
});

module.exports = mongoose.model('Movie', movieSchema, 'movies');
