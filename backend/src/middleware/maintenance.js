const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const path = require('path');

const maintenanceMiddleware = async (req, res, next) => {
    try {
        // 1. Check if maintenance mode is enabled
        const maintenanceSetting = await SystemSettings.findOne({ key: 'maintenanceMode' });
        const isMaintenanceActive = maintenanceSetting ? maintenanceSetting.value === true : false;

        if (!isMaintenanceActive) {
            return next();
        }

        // 2. Exclude essential admin/auth endpoints so admins can log in and manage the site
        const isAuthAPI = req.originalUrl.startsWith('/api/auth');
        const isAdminAPI = req.originalUrl.startsWith('/api/admin');
        const isAdminFile = req.originalUrl.includes('admin.html') || 
                            req.originalUrl.includes('admin.js') || 
                            req.originalUrl.includes('admin.css') ||
                            req.originalUrl.includes('maintenance.html');

        if (isAuthAPI || isAdminAPI || isAdminFile) {
            return next();
        }

        // 3. Check if user is an authenticated Admin
        const userId = req.headers['x-user-id'] || req.query.userId;
        if (userId) {
            const user = await User.findOne({ id: Number(userId) });
            if (user && user.role === 'admin') {
                return next(); // Let admin pass
            }
        }

        // 4. Check for blocked IP lists
        // (We can extend this to block banned IPs as part of Security/Moderation)
        const ipSetting = await SystemSettings.findOne({ key: 'blockedIPs' });
        const blockedIPs = ipSetting ? ipSetting.value || [] : [];
        const clientIP = req.ip || req.connection.remoteAddress;
        if (blockedIPs.includes(clientIP)) {
            return res.status(403).json({ success: false, message: 'Forbidden. Your IP has been blocked.' });
        }

        // 5. Intercept request
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(503).json({
                success: false,
                maintenance: true,
                message: 'The website is currently undergoing scheduled maintenance. Please try again shortly.'
            });
        }

        // For front-end page requests, serve the maintenance page directly
        return res.sendFile(path.join(__dirname, '../../../frontend/maintenance.html'));
    } catch (err) {
        next(err);
    }
};

module.exports = maintenanceMiddleware;
