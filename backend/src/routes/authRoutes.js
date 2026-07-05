const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/userController');
const { validateFields } = require('../middleware/validate');

router.post('/register', validateFields(['username', 'email', 'password']), register);
router.post('/login', validateFields(['email', 'password']), login);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;
