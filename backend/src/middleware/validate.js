// Validation middleware to check for required body fields
const validateFields = (requiredFields) => {
    return (req, res, next) => {
        const missing = [];
        requiredFields.forEach(field => {
            if (
                req.body[field] === undefined || 
                req.body[field] === null || 
                (typeof req.body[field] === 'string' && req.body[field].trim() === '')
            ) {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { validateFields };
