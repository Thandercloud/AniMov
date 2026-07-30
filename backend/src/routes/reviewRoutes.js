const express = require('express');
const router = express.Router();
const { getAllReviews, getReviewById, createReview, updateReview, deleteReview, likeReview, addComment } = require('../controllers/reviewController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getAllReviews)
    .post(validateFields(['userId', 'movieId', 'rating', 'content']), createReview);

router.route('/:id')
    .get(getReviewById)
    .put(updateReview)
    .delete(deleteReview);

router.route('/:id/like')
    .post(likeReview);

router.route('/:id/comments')
    .post(addComment);

module.exports = router;
