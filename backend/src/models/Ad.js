const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    targetUrl: { type: String, default: '#' },
    slot: { type: String, default: 'sidebar', enum: ['banner', 'sidebar', 'popup'] },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Ad', adSchema, 'ads');
