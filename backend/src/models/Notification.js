const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    userId: { type: Number, default: 0 }, // 0 represents broadcast notifications (to all users)
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info', enum: ['info', 'warning', 'success', 'error'] },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
