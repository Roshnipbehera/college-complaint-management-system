const Logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || "Internal server error";

    // Handle MySQL Errors
    if (err.code === "ER_DUP_ENTRY") {
        statusCode = 409;
        message = "A record with this information already exists.";
    } else if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
        statusCode = 400;
        message = "Invalid reference: The specified category or user does not exist.";
    } else if (err.code === "ECONNREFUSED") {
        statusCode = 503;
        message = "Database service is currently unavailable. Please try again shortly.";
    }

    // Handle JWT Errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid authentication token.";
    } else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Authentication token expired. Please log in again.";
    }

    // Handle JSON body syntax errors
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        message = "Malformed JSON payload in request body.";
    }

    // Log the error
    Logger.error(message, err, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });

    const response = {
        success: false,
        message
    };

    if (process.env.NODE_ENV === "development" && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports = errorHandler;
