const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String },
    avatar: { type: String },
    joined: { type: Date, default: Date.now },
    preferences: {
        genres: { type: [String], default: [] },
        content: {
            movies: { type: Boolean, default: true },
            anime: { type: Boolean, default: true },
            tvshows: { type: Boolean, default: false }
        }
    },
    stats: {
        reviews: { type: Number, default: 0 },
        watchlist: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        followers: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('User', userSchema);
