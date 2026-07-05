const Review = require('../models/Review');
const User = require('../models/User');
const mongoose = require('mongoose');

// Strip HTML tags to prevent XSS attacks
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim();
};

// Helper to find review by ObjectId or custom numeric id
const findReviewQuery = (idParam) => {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return { $or: [{ _id: idParam }, { id: Number(idParam) || -1 }] };
    }
    return { id: Number(idParam) || -1 };
};

// GET /api/reviews
const getAllReviews = async (req, res, next) => {
    try {
        const filters = {};
        if (req.query.userId) {
            filters.userId = Number(req.query.userId);
        }
        if (req.query.movieId) {
            filters.movieId = Number(req.query.movieId);
        }

        const reviews = await Review.find(filters).sort({ id: -1 });
        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        next(err);
    }
};

// GET /api/reviews/:id
const getReviewById = async (req, res, next) => {
    try {
        const review = await Review.findOne(findReviewQuery(req.params.id));
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.json({ success: true, data: review });
    } catch (err) {
        next(err);
    }
};

// POST /api/reviews
const createReview = async (req, res, next) => {
    try {
        const { userId, movieId, rating, title, content, metrics, spoiler, privacy, category, type } = req.body;
        const reviewCategory = category || type || 'movie';
        
        const uId = userId ? Number(userId) : 0;
        const mId = Number(movieId);

        if (uId <= 0) {
            return res.status(401).json({ success: false, message: 'Unauthorized. You must be logged in to submit a review.' });
        }

        const ratingNum = parseFloat(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
            return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 10.' });
        }

        // Fetch user information automatically from user record
        const user = await User.findOne({ id: uId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent duplicate reviews for the same movie from the same user
        const existingReview = await Review.findOne({ userId: uId, movieId: mId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already submitted a review for this movie/anime.' });
        }

        const finalUser = user.displayName || user.username;
        const finalAvatar = user.avatar || finalUser.substring(0, 2).toUpperCase();
        const finalEmail = user.email || '';

        const sanitizedTitle = title ? sanitizeInput(title) : `Review of Title ${mId}`;
        const sanitizedContent = content ? sanitizeInput(content) : '';

        const newReview = new Review({
            id: Date.now(),
            userId: uId,
            movieId: mId,
            user: finalUser,
            avatar: finalAvatar,
            rating: ratingNum,
            title: sanitizedTitle,
            content: sanitizedContent,
            email: finalEmail,
            metrics: metrics || { overall: ratingNum, story: ratingNum, characters: ratingNum, visuals: ratingNum, sound: ratingNum },
            spoiler: !!spoiler,
            privacy: privacy || 'public',
            category: reviewCategory,
            date: new Date().toISOString(), // Full ISO string saves date and time
            likes: 0,
            comments: []
        });

        await newReview.save();

        // Increment user's review counts
        await User.findOneAndUpdate({ id: uId }, { $inc: { 'stats.reviews': 1 } });

        res.status(201).json({ success: true, review: newReview });
    } catch (err) {
        next(err);
    }
};

// PUT /api/reviews/:id
const updateReview = async (req, res, next) => {
    try {
        const updatedReview = await Review.findOneAndUpdate(
            findReviewQuery(req.params.id),
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, data: updatedReview });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
    try {
        const deletedReview = await Review.findOneAndDelete(findReviewQuery(req.params.id));
        if (!deletedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Decrement user's review counts
        await User.findOneAndUpdate({ id: deletedReview.userId }, { $inc: { 'stats.reviews': -1 } });

        res.json({ success: true, message: 'Review deleted successfully', data: deletedReview });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
};
