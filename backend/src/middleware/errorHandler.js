// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error details:', err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map(el => el.message);
    }

    // Mongoose Duplicate Key (11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value entered: ${field}`;
        errors = [`The value for '${field}' is already in use.`];
    }

    // Mongoose Cast Error (e.g. invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid format for field ${err.path}`;
        errors = [`Resource with given ${err.path} does not exist.`];
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

module.exports = errorHandler;
