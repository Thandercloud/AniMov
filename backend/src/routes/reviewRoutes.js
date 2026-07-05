const express = require('express');
const router = express.Router();
const { getAllReviews, getReviewById, createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getAllReviews)
    .post(validateFields(['userId', 'movieId', 'rating', 'content']), createReview);

router.route('/:id')
    .get(getReviewById)
    .put(updateReview)
    .delete(deleteReview);

module.exports = router;
