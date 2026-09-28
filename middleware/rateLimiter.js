const rateLimit = require("express-rate-limit");

// General API rate limiter (protects against denial of service and API abuse)
const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX || 100), // 100 requests per window
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many requests from this IP address. Please try again after 15 minutes."
    }
});

// Strict rate limiter for authentication routes (login / register) to prevent brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 15), // 15 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again in 15 minutes to protect account security."
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
