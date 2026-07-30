const mongoose = require('mongoose');

const contentRequestSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['movie', 'anime'], required: true },
    notes: { type: String },
    userId: { type: Number, required: true },
    username: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContentRequest', contentRequestSchema, 'content_requests');
