const express = require("express");

const router = express.Router();

const complaintRoutes = require("./complaintRoutes");
const dbRoutes = require("./dbRoutes");

// Main API
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "College Complaint Management System API",
        version: "1.0.0"
    });
});

// Health check
router.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "UP",
        message: "Server is working"
    });
});

// Complaint routes
router.use("/complaints", complaintRoutes);

// Database routes
router.use("/database", dbRoutes);

module.exports = router;