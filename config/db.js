const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "college_complaint_management",
    port: Number(process.env.DB_PORT || 3306),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("========================================");
        console.log("MySQL Database Connected Successfully");
        console.log("Database: college_complaint_management");
        console.log("========================================");

        connection.release();

    } catch (error) {

        console.error("MySQL Connection Failed!");
        console.error(error.message);

    }
}

testConnection();

module.exports = pool;