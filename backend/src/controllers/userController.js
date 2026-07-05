const User = require('../models/User');
const mongoose = require('mongoose');

// Helper to find a user by MongoDB ObjectId or custom numeric id
const findUserQuery = (idParam) => {
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return { $or: [{ _id: idParam }, { id: Number(idParam) || -1 }] };
    }
    return { id: Number(idParam) || -1 };
};

// GET /api/users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({});
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findOne(findUserQuery(req.params.id));
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// POST /api/users (CRUD creation)
const createUser = async (req, res, next) => {
    try {
        const { username, email, password, displayName } = req.body;
        const emailRegex = new RegExp(`^${email}$`, 'i');
        const existingUser = await User.findOne({ email: emailRegex });
        
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const newUser = new User({
            id: Date.now(),
            username,
            email,
            password,
            displayName: displayName || username,
            avatar: username.substring(0, 2).toUpperCase(),
            joined: new Date(),
            stats: { reviews: 0, watchlist: 0, following: 0, followers: 0 }
        });

        await newUser.save();
        res.status(201).json({ success: true, data: newUser });
    } catch (err) {
        next(err);
    }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            findUserQuery(req.params.id),
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: updatedUser });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
    try {
        const deletedUser = await User.findOneAndDelete(findUserQuery(req.params.id));
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully', data: deletedUser });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const emailRegex = new RegExp(`^${email}$`, 'i');
        const userExists = await User.findOne({ email: emailRegex });
        
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({
            id: Date.now(),
            username,
            email,
            password,
            displayName: username,
            avatar: username.substring(0, 2).toUpperCase(),
            joined: new Date(),
            stats: { reviews: 0, watchlist: 0, following: 0, followers: 0 }
        });

        await newUser.save();
        res.status(201).json({ success: true, user: newUser });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const emailRegex = new RegExp(`^${email}$`, 'i');
        const user = await User.findOne({ email: emailRegex, password });
        
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
    try {
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const userId = parseInt(req.headers['x-user-id'] || req.query.userId);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Valid user ID is required.' });
        }
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    register,
    login,
    logout,
    getMe
};
