const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const Movie = require('../models/Movie');
const Anime = require('../models/Anime');
const Review = require('../models/Review');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const Report = require('../models/Report');
const ContentRequest = require('../models/ContentRequest');
const SystemSettings = require('../models/SystemSettings');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Ad = require('../models/Ad');

const adminAuth = require('../middleware/adminAuth');

// Apply admin authentication to all admin routes
router.use(adminAuth);

// Helper function to log actions
const logAdminAction = async (req, action, details) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const log = new ActivityLog({
            id: Date.now() + Math.floor(Math.random() * 1000),
            userId: req.adminUser.id,
            username: req.adminUser.username,
            action,
            details,
            ip: clientIP,
            date: new Date()
        });
        await log.save();
    } catch (err) {
        console.error('Failed to log admin action:', err.message);
    }
};

// 1. Dashboard Statistics & Analytics
router.get('/stats', async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const bannedUserCount = await User.countDocuments({ banned: true });
        const movieCount = await Movie.countDocuments();
        const animeCount = await Anime.countDocuments();
        const reviewCount = await Review.countDocuments();
        
        // Sum review comments
        const reviews = await Review.find({});
        let commentCount = 0;
        reviews.forEach(r => {
            if (r.comments) commentCount += r.comments.length;
        });

        const pendingReportCount = await Report.countDocuments({ status: 'pending' });
        const pendingRequestCount = await ContentRequest.countDocuments({ status: 'pending' });

        // Growth metrics (mock charts data)
        const userGrowth = [
            { date: 'Mon', count: Math.max(5, userCount - 15) },
            { date: 'Tue', count: Math.max(8, userCount - 12) },
            { date: 'Wed', count: Math.max(10, userCount - 8) },
            { date: 'Thu', count: Math.max(12, userCount - 5) },
            { date: 'Fri', count: Math.max(15, userCount - 3) },
            { date: 'Sat', count: Math.max(18, userCount - 1) },
            { date: 'Sun', count: userCount }
        ];

        const recentActivity = await ActivityLog.find({}).sort({ date: -1 }).limit(10);

        res.json({
            success: true,
            stats: {
                users: userCount,
                bannedUsers: bannedUserCount,
                movies: movieCount,
                anime: animeCount,
                reviews: reviewCount,
                comments: commentCount,
                pendingReports: pendingReportCount,
                pendingRequests: pendingRequestCount
            },
            charts: {
                userGrowth,
                categoryDistribution: [
                    { name: 'Movies', value: movieCount },
                    { name: 'Anime', value: animeCount }
                ]
            },
            recentActivity
        });
    } catch (err) {
        next(err);
    }
});

// 2. User Management
router.get('/users', async (req, res, next) => {
    try {
        const query = req.query.q || '';
        const filter = {};
        if (query) {
            const regex = new RegExp(query, 'i');
            filter.$or = [
                { username: regex },
                { email: regex },
                { displayName: regex }
            ];
        }
        const users = await User.find(filter).sort({ joined: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
});

router.put('/users/:id', async (req, res, next) => {
    try {
        const uId = Number(req.params.id);
        const updateData = req.body;

        const user = await User.findOne({ id: uId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent self-demotion or self-banning for safety
        if (user.id === req.adminUser.id && (updateData.role === 'user' || updateData.banned === true)) {
            return res.status(400).json({ success: false, message: 'You cannot ban yourself or revoke your own admin rights.' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { id: uId },
            { $set: updateData },
            { new: true }
        );

        await logAdminAction(req, 'Update User', `Updated properties for user ${user.username} (ID: ${user.id})`);
        res.json({ success: true, data: updatedUser });
    } catch (err) {
        next(err);
    }
});

router.delete('/users/:id', async (req, res, next) => {
    try {
        const uId = Number(req.params.id);
        if (uId === req.adminUser.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
        }

        const deletedUser = await User.findOneAndDelete({ id: uId });
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await logAdminAction(req, 'Delete User', `Deleted user account ${deletedUser.username} (ID: ${uId})`);
        res.json({ success: true, message: 'User deleted successfully', data: deletedUser });
    } catch (err) {
        next(err);
    }
});

// 3. Movie Management
router.post('/movies', async (req, res, next) => {
    try {
        const movieData = req.body;
        const newId = Date.now();
        const newMovie = new Movie({
            id: newId,
            ...movieData,
            type: 'movie'
        });
        await newMovie.save();
        await logAdminAction(req, 'Add Movie', `Added movie titled "${newMovie.title}"`);
        res.status(201).json({ success: true, data: newMovie });
    } catch (err) {
        next(err);
    }
});

router.put('/movies/:id', async (req, res, next) => {
    try {
        const mId = Number(req.params.id);
        const updated = await Movie.findOneAndUpdate({ id: mId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Movie not found' });
        await logAdminAction(req, 'Update Movie', `Updated movie titled "${updated.title}"`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

router.delete('/movies/:id', async (req, res, next) => {
    try {
        const mId = Number(req.params.id);
        const deleted = await Movie.findOneAndDelete({ id: mId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Movie not found' });
        await logAdminAction(req, 'Delete Movie', `Deleted movie titled "${deleted.title}"`);
        res.json({ success: true, data: deleted });
    } catch (err) {
        next(err);
    }
});

// 4. Anime Management
router.post('/anime', async (req, res, next) => {
    try {
        const animeData = req.body;
        const newId = Date.now();
        const newAnime = new Anime({
            id: newId,
            ...animeData,
            type: 'anime'
        });
        await newAnime.save();
        await logAdminAction(req, 'Add Anime', `Added anime titled "${newAnime.title}"`);
        res.status(201).json({ success: true, data: newAnime });
    } catch (err) {
        next(err);
    }
});

router.put('/anime/:id', async (req, res, next) => {
    try {
        const aId = Number(req.params.id);
        const updated = await Anime.findOneAndUpdate({ id: aId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Anime not found' });
        await logAdminAction(req, 'Update Anime', `Updated anime titled "${updated.title}"`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

router.delete('/anime/:id', async (req, res, next) => {
    try {
        const aId = Number(req.params.id);
        const deleted = await Anime.findOneAndDelete({ id: aId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Anime not found' });
        await logAdminAction(req, 'Delete Anime', `Deleted anime titled "${deleted.title}"`);
        res.json({ success: true, data: deleted });
    } catch (err) {
        next(err);
    }
});

// 5. Review Management
router.get('/reviews', async (req, res, next) => {
    try {
        const reviews = await Review.find({}).sort({ id: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        next(err);
    }
});

router.put('/reviews/:id', async (req, res, next) => {
    try {
        const rId = Number(req.params.id);
        const updated = await Review.findOneAndUpdate({ id: rId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Review not found' });
        await logAdminAction(req, 'Moderate Review', `Moderated review ID ${rId} by ${updated.user}`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

router.delete('/reviews/:id', async (req, res, next) => {
    try {
        const rId = Number(req.params.id);
        const deleted = await Review.findOneAndDelete({ id: rId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Review not found' });
        await logAdminAction(req, 'Delete Review', `Deleted review ID ${rId} by ${deleted.user}`);
        res.json({ success: true, data: deleted });
    } catch (err) {
        next(err);
    }
});

// 6. Comment Management
router.get('/comments', async (req, res, next) => {
    try {
        const reviews = await Review.find({});
        let comments = [];
        reviews.forEach(r => {
            if (r.comments) {
                r.comments.forEach(c => {
                    comments.push({
                        ...c,
                        reviewId: r.id,
                        reviewTitle: r.title
                    });
                });
            }
        });
        res.json({ success: true, data: comments });
    } catch (err) {
        next(err);
    }
});

router.put('/comments/:id', async (req, res, next) => {
    try {
        const cId = Number(req.params.id);
        const review = await Review.findOne({ 'comments.id': cId });
        if (!review) return res.status(404).json({ success: false, message: 'Comment not found' });

        review.comments = review.comments.map(c => {
            if (c.id === cId) {
                return { ...c, ...req.body };
            }
            return c;
        });

        await review.save();
        await logAdminAction(req, 'Moderate Comment', `Moderated comment ID ${cId} on Review "${review.title}"`);
        res.json({ success: true, message: 'Comment updated successfully' });
    } catch (err) {
        next(err);
    }
});

router.delete('/comments/:id', async (req, res, next) => {
    try {
        const cId = Number(req.params.id);
        const review = await Review.findOne({ 'comments.id': cId });
        if (!review) return res.status(404).json({ success: false, message: 'Comment not found' });

        review.comments = review.comments.filter(c => c.id !== cId);
        await review.save();
        await logAdminAction(req, 'Delete Comment', `Deleted comment ID ${cId} from Review "${review.title}"`);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// 7. Reports & Moderation
router.get('/reports', async (req, res, next) => {
    try {
        const reports = await Report.find({}).sort({ date: -1 });
        res.json({ success: true, data: reports });
    } catch (err) {
        next(err);
    }
});

router.put('/reports/:id', async (req, res, next) => {
    try {
        const rId = Number(req.params.id);
        const updated = await Report.findOneAndUpdate({ id: rId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
        await logAdminAction(req, 'Update Report', `Resolved report ID ${rId} as ${updated.status}`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

// 8. Categories & Genres Management
router.get('/genres', async (req, res, next) => {
    try {
        const genresSetting = await SystemSettings.findOne({ key: 'genres' });
        const genres = genresSetting ? genresSetting.value : [];
        res.json({ success: true, data: genres });
    } catch (err) {
        next(err);
    }
});

router.post('/genres', async (req, res, next) => {
    try {
        const { genre } = req.body;
        if (!genre) return res.status(400).json({ success: false, message: 'Genre name is required.' });

        let genresSetting = await SystemSettings.findOne({ key: 'genres' });
        if (!genresSetting) {
            genresSetting = new SystemSettings({ key: 'genres', value: [] });
        }

        if (genresSetting.value.includes(genre)) {
            return res.status(400).json({ success: false, message: 'Genre already exists.' });
        }

        genresSetting.value.push(genre);
        await genresSetting.save();

        await logAdminAction(req, 'Add Genre', `Added genre: ${genre}`);
        res.json({ success: true, data: genresSetting.value });
    } catch (err) {
        next(err);
    }
});

router.delete('/genres/:name', async (req, res, next) => {
    try {
        const genreName = req.params.name;
        let genresSetting = await SystemSettings.findOne({ key: 'genres' });
        if (!genresSetting) return res.status(404).json({ success: false, message: 'Genres list not found.' });

        genresSetting.value = genresSetting.value.filter(g => g !== genreName);
        await genresSetting.save();

        await logAdminAction(req, 'Delete Genre', `Removed genre: ${genreName}`);
        res.json({ success: true, data: genresSetting.value });
    } catch (err) {
        next(err);
    }
});

// 9. Homepage Content Management
router.get('/homepage', async (req, res, next) => {
    try {
        const configSetting = await SystemSettings.findOne({ key: 'homepageConfig' });
        const config = configSetting ? configSetting.value : {
            heroSlides: [
                { id: 101, type: 'anime', title: 'Attack on Titan', subtitle: 'The epic conclusion.' },
                { id: 1, type: 'movie', title: 'Dune: Part Two', subtitle: 'Paul Atreides unites.' }
            ]
        };
        res.json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
});

router.put('/homepage', async (req, res, next) => {
    try {
        let configSetting = await SystemSettings.findOne({ key: 'homepageConfig' });
        if (!configSetting) {
            configSetting = new SystemSettings({ key: 'homepageConfig', value: {} });
        }
        configSetting.value = req.body;
        await configSetting.save();
        await logAdminAction(req, 'Update Homepage Config', 'Updated homepage banner and featured layouts');
        res.json({ success: true, data: configSetting.value });
    } catch (err) {
        next(err);
    }
});

// 10. Search Management (Search analytics)
router.get('/search-logs', async (req, res, next) => {
    try {
        // Return simulated search data logs
        const simulatedLogs = [
            { query: 'Dune', category: 'movie', count: 184, date: new Date(Date.now() - 3600000) },
            { query: 'Attack on Titan', category: 'anime', count: 145, date: new Date(Date.now() - 7200000) },
            { query: 'Sci-Fi', category: 'genre', count: 95, date: new Date(Date.now() - 12000000) },
            { query: 'Spider-Man', category: 'movie', count: 82, date: new Date(Date.now() - 18000000) },
            { query: 'Demon Slayer', category: 'anime', count: 77, date: new Date(Date.now() - 25000000) }
        ];
        res.json({ success: true, data: simulatedLogs });
    } catch (err) {
        next(err);
    }
});

// 11. Notifications Alert
router.get('/notifications', async (req, res, next) => {
    try {
        const notifs = await Notification.find({}).sort({ date: -1 });
        res.json({ success: true, data: notifs });
    } catch (err) {
        next(err);
    }
});

router.post('/notifications', async (req, res, next) => {
    try {
        const { title, message, type, userId } = req.body;
        const newNotif = new Notification({
            id: Date.now(),
            userId: Number(userId) || 0,
            title,
            message,
            type: type || 'info',
            read: false,
            date: new Date()
        });
        await newNotif.save();
        await logAdminAction(req, 'Send Notification', `Sent system notice "${title}" to all users`);
        res.status(201).json({ success: true, data: newNotif });
    } catch (err) {
        next(err);
    }
});

router.delete('/notifications/:id', async (req, res, next) => {
    try {
        const nId = Number(req.params.id);
        const deleted = await Notification.findOneAndDelete({ id: nId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
        await logAdminAction(req, 'Delete Notification', `Deleted system notice "${deleted.title}"`);
        res.json({ success: true, data: deleted });
    } catch (err) {
        next(err);
    }
});

// 12. Content Requests
router.get('/content-requests', async (req, res, next) => {
    try {
        const requests = await ContentRequest.find({}).sort({ date: -1 });
        res.json({ success: true, data: requests });
    } catch (err) {
        next(err);
    }
});

router.put('/content-requests/:id', async (req, res, next) => {
    try {
        const rId = Number(req.params.id);
        const updated = await ContentRequest.findOneAndUpdate({ id: rId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Request not found' });
        await logAdminAction(req, 'Update Content Request', `Updated request ID ${rId} status to ${updated.status}`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

// 13. Website Settings
router.get('/settings', async (req, res, next) => {
    try {
        const settings = await SystemSettings.find({});
        res.json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
});

router.put('/settings', async (req, res, next) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await SystemSettings.findOneAndUpdate(
                { key },
                { $set: { value } },
                { upsert: true }
            );
        }
        await logAdminAction(req, 'Update Settings', 'Modified core website metadata and preferences');
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        next(err);
    }
});

// 14. Security Module
router.get('/security/sessions', async (req, res, next) => {
    try {
        // Return simulated active sessions list
        const activeSessions = [
            { userId: req.adminUser.id, username: req.adminUser.username, role: 'admin', ip: req.ip || '127.0.0.1', device: 'Chrome on Windows 11 (Current)', loginTime: new Date(Date.now() - 100000) },
            { userId: 999999, username: 'demo_user', role: 'user', ip: '192.168.1.15', device: 'Safari on iPhone', loginTime: new Date(Date.now() - 3600000) }
        ];
        res.json({ success: true, data: activeSessions });
    } catch (err) {
        next(err);
    }
});

router.get('/security/login-logs', async (req, res, next) => {
    try {
        // Simulated audit log of logins
        const loginLogs = [
            { username: 'admin', email: 'admin@movani.com', status: 'Success', ip: '127.0.0.1', date: new Date(Date.now() - 100000) },
            { username: 'demo_user', email: 'demo@movani.com', status: 'Success', ip: '192.168.1.15', date: new Date(Date.now() - 3600000) },
            { username: 'unknown_hacker', email: 'hack@badguy.com', status: 'Failed', ip: '203.0.113.50', date: new Date(Date.now() - 7200000) }
        ];
        res.json({ success: true, data: loginLogs });
    } catch (err) {
        next(err);
    }
});

router.post('/security/ip-block', async (req, res, next) => {
    try {
        const { ip } = req.body;
        if (!ip) return res.status(400).json({ success: false, message: 'IP address is required.' });

        let ipSetting = await SystemSettings.findOne({ key: 'blockedIPs' });
        if (!ipSetting) {
            ipSetting = new SystemSettings({ key: 'blockedIPs', value: [] });
        }

        if (ipSetting.value.includes(ip)) {
            return res.status(400).json({ success: false, message: 'IP is already blocked.' });
        }

        ipSetting.value.push(ip);
        await ipSetting.save();

        await logAdminAction(req, 'Block IP', `Banned incoming IP traffic from: ${ip}`);
        res.json({ success: true, data: ipSetting.value });
    } catch (err) {
        next(err);
    }
});

router.delete('/security/ip-block/:ip', async (req, res, next) => {
    try {
        const ip = req.params.ip;
        let ipSetting = await SystemSettings.findOne({ key: 'blockedIPs' });
        if (!ipSetting) return res.status(404).json({ success: false, message: 'Blocked IP list not found.' });

        ipSetting.value = ipSetting.value.filter(item => item !== ip);
        await ipSetting.save();

        await logAdminAction(req, 'Unblock IP', `Restored network permissions for IP: ${ip}`);
        res.json({ success: true, data: ipSetting.value });
    } catch (err) {
        next(err);
    }
});

// 15. API Management
router.get('/api-management', async (req, res, next) => {
    try {
        // Return active system endpoints list and mock usage rates
        const endpoints = [
            { method: 'GET', path: '/api/auth/me', description: 'Fetch session details', callsToday: 420 },
            { method: 'POST', path: '/api/auth/login', description: 'Authenticate users', callsToday: 15 },
            { method: 'GET', path: '/api/movies', description: 'List available movies', callsToday: 1540 },
            { method: 'GET', path: '/api/anime', description: 'List available anime', callsToday: 1210 },
            { method: 'POST', path: '/api/reviews', description: 'Submit content review', callsToday: 8 }
        ];
        const apiKeys = [
            { key: 'movani_pub_9a12c4b2', description: 'Public Static Assets Fetcher', active: true },
            { key: 'movani_dev_f28db0c7', description: 'Local Development Sandbox Integration', active: true }
        ];
        res.json({ success: true, endpoints, apiKeys });
    } catch (err) {
        next(err);
    }
});

// 16. Advertisement Management
router.get('/ads', async (req, res, next) => {
    try {
        const ads = await Ad.find({});
        res.json({ success: true, data: ads });
    } catch (err) {
        next(err);
    }
});

router.post('/ads', async (req, res, next) => {
    try {
        const newAd = new Ad({
            id: Date.now(),
            ...req.body
        });
        await newAd.save();
        await logAdminAction(req, 'Create Ad', `Created advertisement banner: "${newAd.title}"`);
        res.status(201).json({ success: true, data: newAd });
    } catch (err) {
        next(err);
    }
});

router.put('/ads/:id', async (req, res, next) => {
    try {
        const adId = Number(req.params.id);
        const updated = await Ad.findOneAndUpdate({ id: adId }, { $set: req.body }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Ad banner not found' });
        await logAdminAction(req, 'Update Ad', `Updated advertisement banner details: "${updated.title}"`);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
});

router.delete('/ads/:id', async (req, res, next) => {
    try {
        const adId = Number(req.params.id);
        const deleted = await Ad.findOneAndDelete({ id: adId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Ad banner not found' });
        await logAdminAction(req, 'Delete Ad', `Removed advertisement banner slot: "${deleted.title}"`);
        res.json({ success: true, data: deleted });
    } catch (err) {
        next(err);
    }
});

// 17. Email Management
router.get('/emails', async (req, res, next) => {
    try {
        // Return simulated templates and sent emails log
        const templates = [
            { id: 1, name: 'Welcome Email', subject: 'Welcome to MovAni Reviews Hub!', body: '<h1>Hi {username},</h1><p>Welcome to MovAni...</p>' },
            { id: 2, name: 'Password Reset Notification', subject: 'Reset Your Account Password', body: '<p>Click here to reset...</p>' }
        ];
        const log = [
            { recipient: 'demo@movani.com', subject: 'Welcome to MovAni Reviews Hub!', status: 'Delivered (Simulated)', date: new Date(Date.now() - 3600000) }
        ];
        res.json({ success: true, templates, log });
    } catch (err) {
        next(err);
    }
});

router.post('/emails/send', async (req, res, next) => {
    try {
        const { recipient, subject, body } = req.body;
        if (!recipient || !subject || !body) {
            return res.status(400).json({ success: false, message: 'Recipient, subject, and body are required.' });
        }
        await logAdminAction(req, 'Send Email Log', `Dispatched simulated message to ${recipient} with topic: "${subject}"`);
        res.json({ success: true, message: 'Email sent successfully (simulated).' });
    } catch (err) {
        next(err);
    }
});

// 18. Activity Logs Audit
router.get('/activity-logs', async (req, res, next) => {
    try {
        const logs = await ActivityLog.find({}).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
});

// 19. Backup & Restore
const BACKUP_DIR = path.join(__dirname, '../../backups');

router.get('/backups', async (req, res, next) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR);
        }
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files.filter(f => f.endsWith('.json')).map(f => {
            const stat = fs.statSync(path.join(BACKUP_DIR, f));
            return {
                filename: f,
                size: stat.size,
                created: stat.birthtime
            };
        });
        res.json({ success: true, data: backups });
    } catch (err) {
        next(err);
    }
});

router.post('/backups', async (req, res, next) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR);
        }

        // Aggregate database records
        const movies = await Movie.find({});
        const anime = await Anime.find({});
        const reviews = await Review.find({});
        const users = await User.find({});
        const watchlist = await Watchlist.find({});
        const reports = await Report.find({});
        const settings = await SystemSettings.find({});
        const notifications = await Notification.find({});
        const activityLogs = await ActivityLog.find({});
        const ads = await Ad.find({});

        const dumpData = {
            movies, anime, reviews, users, watchlist, reports, settings, notifications, activityLogs, ads
        };

        const filename = `backup_${Date.now()}.json`;
        fs.writeFileSync(path.join(BACKUP_DIR, filename), JSON.stringify(dumpData, null, 2), 'utf8');

        await logAdminAction(req, 'Create Backup', `Created JSON backup archive: ${filename}`);
        res.json({ success: true, filename });
    } catch (err) {
        next(err);
    }
});

router.post('/backups/restore', async (req, res, next) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ success: false, message: 'Filename is required.' });

        const filepath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found.' });
        }

        const dataStr = fs.readFileSync(filepath, 'utf8');
        const dump = JSON.parse(dataStr);

        // Wipe and restore collections if present in dump
        if (dump.movies) { await Movie.deleteMany({}); await Movie.insertMany(dump.movies); }
        if (dump.anime) { await Anime.deleteMany({}); await Anime.insertMany(dump.anime); }
        if (dump.reviews) { await Review.deleteMany({}); await Review.insertMany(dump.reviews); }
        if (dump.users) { await User.deleteMany({}); await User.insertMany(dump.users); }
        if (dump.watchlist) { await Watchlist.deleteMany({}); await Watchlist.insertMany(dump.watchlist); }
        if (dump.reports) { await Report.deleteMany({}); await Report.insertMany(dump.reports); }
        if (dump.settings) { await SystemSettings.deleteMany({}); await SystemSettings.insertMany(dump.settings); }
        if (dump.notifications) { await Notification.deleteMany({}); await Notification.insertMany(dump.notifications); }
        if (dump.activityLogs) { await ActivityLog.deleteMany({}); await ActivityLog.insertMany(dump.activityLogs); }
        if (dump.ads) { await Ad.deleteMany({}); await Ad.insertMany(dump.ads); }

        await logAdminAction(req, 'Restore Database', `Restored system collections using archive: ${filename}`);
        res.json({ success: true, message: 'System restoration completed successfully.' });
    } catch (err) {
        next(err);
    }
});

router.delete('/backups/:filename', async (req, res, next) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(BACKUP_DIR, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            await logAdminAction(req, 'Delete Backup', `Removed backup archive: ${filename}`);
            res.json({ success: true, message: 'Backup deleted.' });
        } else {
            res.status(404).json({ success: false, message: 'File not found.' });
        }
    } catch (err) {
        next(err);
    }
});

// 20. Toggle Maintenance Mode
router.put('/maintenance', async (req, res, next) => {
    try {
        const { enabled } = req.body;
        if (enabled === undefined) return res.status(400).json({ success: false, message: 'Maintenance flag is required.' });

        await SystemSettings.findOneAndUpdate(
            { key: 'maintenanceMode' },
            { $set: { value: !!enabled } },
            { upsert: true }
        );

        await logAdminAction(req, 'Toggle Maintenance', `Set Maintenance Mode to ${enabled}`);
        res.json({ success: true, maintenanceMode: !!enabled });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
