require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        console.log(
            `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
        );
    });

    next();
});

// Import routes
const routes = require("./routes");

// Use routes
app.use("/api", routes);

// Serve frontend files
app.use(express.static("public"));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("ERROR:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// Start server
app.listen(PORT, () => {
    console.log("----------------------------------------");
    console.log("College Complaint Management System");
    console.log("----------------------------------------");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Week 1-5 backend is ready.");
});