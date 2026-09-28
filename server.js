require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const corsOptions = require("./config/corsOptions");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const Logger = require("./utils/logger");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================================================================
// 1. SECURITY & UTILITY MIDDLEWARES (Week 8)
// ==============================================================================

// Helmet: Sets critical HTTP response headers to protect against common web vulnerabilities
app.use(helmet({
    contentSecurityPolicy: false, // Allows inline scripts for testing and public demo pages
    crossOriginEmbedderPolicy: false
}));

// CORS: Configures Cross-Origin Resource Sharing with allowed origins and credentials
app.use(cors(corsOptions));

// Cookie Parser: Parses cookies attached to client requests (for session/JWT auth in Week 7)
app.use(cookieParser(process.env.COOKIE_SECRET));

// Body Parsing: Protects against large payloads with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request Logging: Structured HTTP request logger with file & console outputs
app.use(requestLogger);

// Rate Limiting: Global limiter for all /api endpoints, plus strict limiter for /api/auth
app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ==============================================================================
// 2. STATIC FILES & API ROUTES
// ==============================================================================

// Static files for frontend preview
app.use(express.static("public"));

// Mount main API router
app.use("/api", routes);

// Root path fallback
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to College Complaint Management System API",
        docs: "/api",
        status: "ACTIVE"
    });
});

// ==============================================================================
// 3. ERROR HANDLING & 404 (Week 4, 8)
// ==============================================================================

// 404 Route Not Found Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// ==============================================================================
// 4. SERVER INITIALIZATION
// ==============================================================================
if (require.main === module) {
    app.listen(PORT, () => {
        Logger.info("--------------------------------------------------");
        Logger.info("College Complaint Management System Server Started");
        Logger.info(`Local URL: http://localhost:${PORT}`);
        Logger.info(`API Base:  http://localhost:${PORT}/api`);
        Logger.info("Milestones active: Week 1 to Week 8");
        Logger.info("--------------------------------------------------");
    });
}

module.exports = app;