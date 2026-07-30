const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Authenticated session required.' });
        }

        const user = await User.findOne({ id: Number(userId) });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User profile not found.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden. Admin credentials required.' });
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: 'Forbidden. This account has been banned.' });
        }

        req.adminUser = user;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = adminAuth;
