const path = require('path');
// Explicit path resolution to find the .env file in the backend root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./services/seedService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to MongoDB Atlas
        await connectDB();

        // 2. Initialize and Seed database collections if empty
        await seedDatabase();

        // 3. Start Express server
        app.listen(PORT, () => {
            console.log(`✓ MovAni Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start the server due to connection error:', err.message);
        process.exit(1);
    }
};

startServer();
