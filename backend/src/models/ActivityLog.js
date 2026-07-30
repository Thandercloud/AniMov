const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    userId: { type: Number, required: true },
    username: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String },
    ip: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');
