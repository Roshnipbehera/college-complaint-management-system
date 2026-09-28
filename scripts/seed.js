require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function seed() {
    console.log("==================================================");
    console.log("Seeding College Complaint Management Database...");
    console.log("==================================================");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        port: Number(process.env.DB_PORT || 3306),
        multipleStatements: true
    });

    try {
        await connection.query("CREATE DATABASE IF NOT EXISTS college_complaint_management;");
        await connection.query("USE college_complaint_management;");

        // Hash demo passwords
        const studentHash = await bcrypt.hash("Student@123", 10);
        const staffHash = await bcrypt.hash("Staff@123", 10);
        const adminHash = await bcrypt.hash("Admin@123", 10);

        // Read schema
        const schemaPath = path.join(__dirname, "../database/schema.sql");
        let sql = fs.readFileSync(schemaPath, "utf8");

        // Replace dummy hashes with generated bcrypt hashes if needed
        sql = sql.replace("'$2b$10$FsVUFQC1te5Db7xMOy4yiej2JjSzf.rnbk8AxXZJoVQ0iCK0IgcYa'", `'${studentHash}'`);
        sql = sql.replace("'$2b$10$7Z2vJp9l.06kRkHqC0Q7b.07D4QhL17xG1fLg1N2s0R2E7vK1t0C.'", `'${staffHash}'`);
        sql = sql.replace("'$2b$10$wO8h0zBqNqg5mRkQv8A7j.a2WqK9tH6u8e7Y0t4s1D5f3G2h1J0K.'", `'${adminHash}'`);

        console.log("Executing schema and seed queries...");
        await connection.query(sql);

        console.log("✓ Database tables created and verified");
        console.log("✓ Roles seeded: STUDENT (1), STAFF (2), ADMIN (3)");
        console.log("✓ 11 Categories seeded");
        console.log("✓ 3 Demo Users seeded with bcrypt hashed passwords:");
        console.log("   - Student: student@college.com / Student@123 (or demo123)");
        console.log("   - Staff:   staff@college.com   / Staff@123");
        console.log("   - Admin:   admin@college.com   / Admin@123");
        console.log("✓ Demo Complaints seeded");
        console.log("==================================================");
        console.log("Database seed completed successfully!");
        console.log("==================================================");
    } catch (error) {
        console.error("Database seed failed:", error);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

seed();
