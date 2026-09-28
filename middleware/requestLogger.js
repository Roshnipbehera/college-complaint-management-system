const Logger = require("../utils/logger");

function requestLogger(req, res, next) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10).toUpperCase();
    req.requestId = requestId;

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const meta = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            user: req.user ? `${req.user.role_name}:${req.user.user_id}` : "guest"
        };

        const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;

        if (res.statusCode >= 500) {
            Logger.error(message, null, meta);
        } else if (res.statusCode >= 400) {
            Logger.warn(message, meta);
        } else {
            Logger.info(message, meta);
        }
    });

    next();
}

module.exports = requestLogger;
