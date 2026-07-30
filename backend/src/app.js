const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mainRouter = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const maintenance = require('./middleware/maintenance');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Maintenance Mode Interceptor
app.use(maintenance);

// API & Aggregation routes
app.use('/', mainRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// SPA fallback for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
