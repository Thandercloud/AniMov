const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    reporterId: { type: Number, required: true },
    reporterName: { type: String },
    contentType: { type: String, enum: ['review', 'comment'], required: true },
    contentId: { type: Number, required: true }, // The ID of the review, or comment ID
    reviewId: { type: Number }, // Parent review ID if contentType is comment
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'resolved', 'dismissed'] },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema, 'reports');
