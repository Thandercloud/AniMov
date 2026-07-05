const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    userId: { type: Number, default: 0 },
    movieId: { type: Number, required: true },
    user: { type: String },
    avatar: { type: String },
    rating: { type: Number, required: true },
    title: { type: String },
    content: { type: String, required: true },
    metrics: {
        overall: { type: Number, default: 0 },
        story: { type: Number, default: 0 },
        characters: { type: Number, default: 0 },
        visuals: { type: Number, default: 0 },
        sound: { type: Number, default: 0 }
    },
    spoiler: { type: Boolean, default: false },
    privacy: { type: String, default: 'public' },
    category: { type: String, default: 'movie' },
    email: { type: String },
    date: { type: String },
    likes: { type: Number, default: 0 },
    comments: { type: Array, default: [] }
});

module.exports = mongoose.model('Review', reviewSchema, 'reviews');
