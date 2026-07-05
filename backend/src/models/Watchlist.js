const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    userId: { type: Number, required: true },
    itemId: { type: Number, required: true },
    itemType: { type: String, required: true },
    status: { type: String, default: 'unwatched', enum: ['unwatched', 'watching', 'completed', 'dropped'] },
    added: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Watchlist', watchlistSchema, 'watchlists');
