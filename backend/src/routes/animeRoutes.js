const express = require('express');
const router = express.Router();
const { getAllAnime, getAnimeById, createAnime, updateAnime, deleteAnime } = require('../controllers/animeController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getAllAnime)
    .post(validateFields(['title']), createAnime);

router.route('/:id')
    .get(getAnimeById)
    .put(updateAnime)
    .delete(deleteAnime);

module.exports = router;
