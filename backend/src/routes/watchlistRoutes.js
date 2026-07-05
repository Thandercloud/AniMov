const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistStatus } = require('../controllers/watchlistController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getWatchlist)
    .post(validateFields(['userId', 'itemId', 'itemType']), addToWatchlist)
    .delete(removeFromWatchlist);

router.route('/:id')
    .put(validateFields(['status']), updateWatchlistStatus);

module.exports = router;
