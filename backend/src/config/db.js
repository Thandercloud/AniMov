const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolver for Atlas compatibility if running in environments with DNS issues
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn('DNS resolver configuration failed:', e.message);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected Successfully');
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
    }
};

module.exports = { connectDB };
