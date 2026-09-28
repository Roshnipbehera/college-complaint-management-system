const db = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
    // Find user by email (includes password_hash for authentication)
    async findByEmail(email) {
        const [rows] = await db.query(`
            SELECT 
                u.user_id,
                u.role_id,
                u.full_name,
                u.email,
                u.password_hash,
                u.phone,
                u.is_active,
                u.created_at,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.role_id
            WHERE LOWER(u.email) = LOWER(?)
        `, [email]);

        return rows[0] || null;
    },

    // Find user by ID (excludes password_hash for safety)
    async findById(user_id) {
        const [rows] = await db.query(`
            SELECT 
                u.user_id,
                u.role_id,
                u.full_name,
                u.email,
                u.phone,
                u.is_active,
                u.created_at,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = ?
        `, [user_id]);

        return rows[0] || null;
    },

    // Create a new user with bcrypt hashed password
    async create({ full_name, email, password, role_id = 1, phone = null }) {
        // Hash password with salt rounds = 10
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await db.query(`
            INSERT INTO users 
                (role_id, full_name, email, password_hash, phone, is_active)
            VALUES 
                (?, ?, ?, ?, ?, 1)
        `, [
            role_id,
            full_name.trim(),
            email.trim().toLowerCase(),
            password_hash,
            phone ? phone.trim() : null
        ]);

        return this.findById(result.insertId);
    },

    // Compare plain password with stored bcrypt hash
    async validatePassword(plainPassword, password_hash) {
        if (!plainPassword || !password_hash) return false;
        return bcrypt.compare(plainPassword, password_hash);
    },

    // Get all users (with optional role filtering)
    async findAll(filters = {}) {
        const conditions = [];
        const params = [];

        if (filters.role_id) {
            conditions.push("u.role_id = ?");
            params.push(filters.role_id);
        }

        if (filters.is_active !== undefined) {
            conditions.push("u.is_active = ?");
            params.push(filters.is_active ? 1 : 0);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await db.query(`
            SELECT 
                u.user_id,
                u.role_id,
                u.full_name,
                u.email,
                u.phone,
                u.is_active,
                u.created_at,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.role_id
            ${whereClause}
            ORDER BY u.created_at DESC
        `, params);

        return rows;
    },

    // Get staff members for assignment
    async getStaffMembers() {
        const [rows] = await db.query(`
            SELECT 
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                r.role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'STAFF' AND u.is_active = 1
            ORDER BY u.full_name ASC
        `);
        return rows;
    },

    // Find role by name
    async findRoleByName(role_name) {
        const [rows] = await db.query(`
            SELECT role_id, role_name FROM roles WHERE UPPER(role_name) = UPPER(?)
        `, [role_name]);
        return rows[0] || null;
    }
};

module.exports = User;
