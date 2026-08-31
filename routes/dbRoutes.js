const express = require("express");

const router = express.Router();

const db = require("../config/db");


// ==========================================
// TEST DATABASE CONNECTION
// ==========================================

router.get("/test", async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT 1 AS database_connected"
        );

        res.status(200).json({

            success: true,

            message: "MySQL connection successful",

            database: "college_complaint_management",

            data: rows[0]

        });

    } catch (error) {

        console.error("Database test failed:", error.message);

        next(error);

    }

});


// ==========================================
// GET DATABASE INFORMATION
// ==========================================

router.get("/info", async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT DATABASE() AS database_name"
        );

        res.status(200).json({

            success: true,

            message: "Database information retrieved successfully",

            data: rows[0]

        });

    } catch (error) {

        console.error("Database information error:", error.message);

        next(error);

    }

});


// ==========================================
// GET ALL TABLES
// ==========================================

router.get("/tables", async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SHOW TABLES"
        );

        res.status(200).json({

            success: true,

            message: "Database tables retrieved successfully",

            count: rows.length,

            data: rows

        });

    } catch (error) {

        console.error("Unable to retrieve tables:", error.message);

        next(error);

    }

});


// ==========================================
// DATABASE STATUS
// ==========================================

router.get("/status", async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT NOW() AS server_time"
        );

        res.status(200).json({

            success: true,

            status: "CONNECTED",

            database: "college_complaint_management",

            server_time: rows[0].server_time

        });

    } catch (error) {

        console.error("Database status error:", error.message);

        next(error);

    }

});


module.exports = router;