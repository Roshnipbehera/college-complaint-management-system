const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const complaintRoutes = require("./complaintRoutes");
const categoryRoutes = require("./categoryRoutes");
const dbRoutes = require("./dbRoutes");

// Root API Information & Documentation
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "College Complaint Management System API",
        version: "2.0.0",
        milestones: {
            week6: "Complete CRUD APIs with filtering and pagination",
            week7: "Authentication module with bcrypt, JWT & HTTP-only cookies",
            week8: "Security hardening (Helmet, rate limiting, CORS), robust validation & structured logging"
        },
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                logout: "POST /api/auth/logout",
                me: "GET /api/auth/me",
                staff: "GET /api/auth/staff"
            },
            complaints: {
                list: "GET /api/complaints (query: status, category_id, student_id, priority, search, page, limit)",
                getById: "GET /api/complaints/:id",
                create: "POST /api/complaints",
                update: "PUT/PATCH /api/complaints/:id",
                delete: "DELETE /api/complaints/:id",
                assign: "POST /api/complaints/:id/assign",
                status: "POST /api/complaints/:id/status",
                comment: "POST /api/complaints/:id/comments"
            },
            categories: {
                list: "GET /api/categories",
                getById: "GET /api/categories/:id",
                create: "POST /api/categories"
            },
            database: {
                test: "GET /api/database/test",
                status: "GET /api/database/status",
                tables: "GET /api/database/tables",
                info: "GET /api/database/info"
            }
        }
    });
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Mount modular sub-routers
router.use("/auth", authRoutes);
router.use("/complaints", complaintRoutes);
router.use("/categories", categoryRoutes);
router.use("/database", dbRoutes);

module.exports = router;