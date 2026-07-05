const Watchlist = require('../models/Watchlist');
const User = require('../models/User');

// GET /api/watchlist
const getWatchlist = async (req, res, next) => {
    try {
        const userId = parseInt(req.query.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Valid User ID is required.' });
        }

        const list = await Watchlist.find({ userId });
        res.json(list);
    } catch (err) {
        next(err);
    }
};

// POST /api/watchlist
const addToWatchlist = async (req, res, next) => {
    try {
        const { userId, itemId, itemType } = req.body;
        const uId = parseInt(userId);
        const iId = parseInt(itemId);

        const existing = await Watchlist.findOne({ userId: uId, itemId: iId, itemType });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already in watchlist' });
        }

        const newEntry = new Watchlist({
            id: Date.now(),
            userId: uId,
            itemId: iId,
            itemType,
            added: new Date()
        });

        await newEntry.save();

        // Update user stats
        await User.findOneAndUpdate({ id: uId }, { $inc: { 'stats.watchlist': 1 } });

        res.status(201).json({ success: true, entry: newEntry });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/watchlist
const removeFromWatchlist = async (req, res, next) => {
    try {
        const { userId, itemId, id } = req.body;
        let deletedEntry = null;

        if (id) {
            deletedEntry = await Watchlist.findOneAndDelete({ id: parseInt(id) });
        } else if (userId && itemId) {
            deletedEntry = await Watchlist.findOneAndDelete({ userId: parseInt(userId), itemId: parseInt(itemId) });
        }

        if (deletedEntry) {
            // Decrement user watchlist stat
            await User.findOneAndUpdate({ id: deletedEntry.userId }, { $inc: { 'stats.watchlist': -1 } });
            return res.json({ success: true });
        }

        res.status(404).json({ success: false, message: 'Item not found in watchlist' });
    } catch (err) {
        next(err);
    }
};

// PUT /api/watchlist/:id
const updateWatchlistStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const idParam = req.params.id;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required.' });
        }

        let query = { id: Number(idParam) || -1 };
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            query = { $or: [{ _id: idParam }, { id: Number(idParam) || -1 }] };
        }

        const updatedEntry = await Watchlist.findOneAndUpdate(
            query,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!updatedEntry) {
            return res.status(404).json({ success: false, message: 'Watchlist item not found.' });
        }

        res.json({ success: true, entry: updatedEntry });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistStatus
};
