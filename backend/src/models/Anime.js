const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'anime', enum: ['movie', 'anime'] },
    year: { type: Number },
    rating: { type: Number, default: 0 },
    poster: { type: String },
    banner: { type: String },
    episodes: { type: Number },
    genres: { type: [String], default: [] },
    synopsis: { type: String },
    status: { type: String },
    trailer: { type: String },
    studio: { type: String },
    userId: { type: Number, default: 0 }
});

module.exports = mongoose.model('Anime', animeSchema, 'anime');
