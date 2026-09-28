const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" });
const errorLogStream = fs.createWriteStream(path.join(logsDir, "error.log"), { flags: "a" });

// Sanitize sensitive fields from log objects
function sanitize(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const clone = Array.isArray(obj) ? [...obj] : { ...obj };
    const sensitive = ["password", "password_hash", "token", "jwt", "cookie", "authorization"];

    for (const key of Object.keys(clone)) {
        if (sensitive.includes(key.toLowerCase())) {
            clone[key] = "[REDACTED]";
        } else if (typeof clone[key] === "object") {
            clone[key] = sanitize(clone[key]);
        }
    }
    return clone;
}

const Logger = {
    info(message, meta = {}) {
        const entry = `[${new Date().toISOString()}] [INFO] ${message} ${Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : ""}\n`;
        accessLogStream.write(entry);
        console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, Object.keys(meta).length ? sanitize(meta) : "");
    },

    warn(message, meta = {}) {
        const entry = `[${new Date().toISOString()}] [WARN] ${message} ${Object.keys(meta).length ? JSON.stringify(sanitize(meta)) : ""}\n`;
        accessLogStream.write(entry);
        console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, Object.keys(meta).length ? sanitize(meta) : "");
    },

    error(message, error = null, meta = {}) {
        const errorDetails = error ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status
        } : null;

        const payload = { ...sanitize(meta), ...(errorDetails ? { error: errorDetails } : {}) };
        const entry = `[${new Date().toISOString()}] [ERROR] ${message} ${JSON.stringify(payload)}\n`;
        
        errorLogStream.write(entry);
        accessLogStream.write(entry);
        console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, errorDetails || meta);
    },

    debug(message, meta = {}) {
        if (process.env.NODE_ENV !== "production") {
            const entry = `[${new Date().toISOString()}] [DEBUG] ${message} ${JSON.stringify(sanitize(meta))}\n`;
            accessLogStream.write(entry);
            console.log(`\x1b[35m[DEBUG]\x1b[0m ${message}`, sanitize(meta));
        }
    }
};

module.exports = Logger;
