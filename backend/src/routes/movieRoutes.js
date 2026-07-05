const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie } = require('../controllers/movieController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getAllMovies)
    .post(validateFields(['title']), createMovie);

router.route('/:id')
    .get(getMovieById)
    .put(updateMovie)
    .delete(deleteMovie);

module.exports = router;
