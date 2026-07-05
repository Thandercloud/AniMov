const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { validateFields } = require('../middleware/validate');

router.route('/')
    .get(getAllUsers)
    .post(validateFields(['username', 'email', 'password']), createUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
