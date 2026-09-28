const db = require("../config/db");

const Category = {
    // Get all active categories
    async findAll() {
        const [rows] = await db.query(`
            SELECT 
                category_id, 
                category_name, 
                description, 
                is_active, 
                created_at 
            FROM categories 
            WHERE is_active = 1 
            ORDER BY category_name ASC
        `);
        return rows;
    },

    // Get single category by ID
    async findById(id) {
        const [rows] = await db.query(`
            SELECT 
                category_id, 
                category_name, 
                description, 
                is_active, 
                created_at 
            FROM categories 
            WHERE category_id = ?
        `, [id]);
        return rows[0] || null;
    },

    // Create a new category (admin)
    async create({ category_name, description }) {
        const [result] = await db.query(`
            INSERT INTO categories (category_name, description)
            VALUES (?, ?)
        `, [category_name, description || null]);
        return this.findById(result.insertId);
    },

    // Update category
    async update(id, { category_name, description, is_active }) {
        const updates = [];
        const params = [];

        if (category_name !== undefined) {
            updates.push("category_name = ?");
            params.push(category_name);
        }
        if (description !== undefined) {
            updates.push("description = ?");
            params.push(description);
        }
        if (is_active !== undefined) {
            updates.push("is_active = ?");
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);
        const [result] = await db.query(`
            UPDATE categories
            SET ${updates.join(", ")}
            WHERE category_id = ?
        `, params);

        if (result.affectedRows === 0) return null;
        return this.findById(id);
    },

    // Soft delete / toggle active
    async remove(id) {
        const [result] = await db.query(`
            UPDATE categories
            SET is_active = 0
            WHERE category_id = ?
        `, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Category;
