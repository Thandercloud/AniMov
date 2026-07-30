const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String },
    avatar: { type: String },
    joined: { type: Date, default: Date.now },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    banned: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    preferences: {
        genres: { type: [String], default: [] },
        content: {
            movies: { type: Boolean, default: true },
            anime: { type: Boolean, default: true },
            tvshows: { type: Boolean, default: false }
        }
    },
    stats: {
        reviews: { type: Number, default: 0 },
        watchlist: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        followers: { type: Number, default: 0 }
    }
});

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Pre-findOneAndUpdate hook to hash password when updating
userSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    if (update.$set && update.$set.password) {
        try {
            const salt = await bcrypt.genSalt(10);
            update.$set.password = await bcrypt.hash(update.$set.password, salt);
        } catch (err) {
            throw err;
        }
    } else if (update.password) {
        try {
            const salt = await bcrypt.genSalt(10);
            update.password = await bcrypt.hash(update.password, salt);
        } catch (err) {
            throw err;
        }
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
