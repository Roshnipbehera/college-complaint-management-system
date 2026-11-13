const mysql = require("mysql2/promise");

// Support both individual environment variables and connection URIs (e.g. DATABASE_URL / MYSQL_URL)
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

const poolConfig = connectionUri ? {
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === "true" || (connectionUri && !connectionUri.includes("localhost") && process.env.DB_SSL !== "false")
        ? { rejectUnauthorized: false }
        : undefined
} : {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "college_complaint_management",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
};

const pool = mysql.createPool(poolConfig);

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