const db = require("../config/db");

const VALID_STATUSES = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "AWAITING_RESPONSE",
    "RESOLVED",
    "CLOSED",
    "REJECTED"
];

function generateComplaintCode() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CMP-${stamp}-${rand}`;
}

const Complaint = {

    // Get all complaints, with optional filtering + pagination
    // filters: { status, category_id, student_id, search, limit, offset }
    async findAll(filters = {}) {

        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push("c.status = ?");
            params.push(filters.status);
        }

        if (filters.category_id) {
            conditions.push("c.category_id = ?");
            params.push(filters.category_id);
        }

        if (filters.student_id) {
            conditions.push("c.student_id = ?");
            params.push(filters.student_id);
        }

        if (filters.search) {
            conditions.push("(c.title LIKE ? OR c.description LIKE ?)");
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const limit = Number(filters.limit) || 50;
        const offset = Number(filters.offset) || 0;

        const [rows] = await db.query(`

            SELECT
                c.complaint_id,
                c.complaint_code,
                c.title,
                c.description,
                c.priority,
                c.status,
                c.student_id,
                c.category_id,
                c.created_at,
                c.updated_at,
                c.resolved_at,
                c.closed_at,

                u.full_name AS student_name,
                u.email AS student_email,

                cat.category_name

            FROM complaints c

            INNER JOIN users u
                ON c.student_id = u.user_id

            INNER JOIN categories cat
                ON c.category_id = cat.category_id

            ${whereClause}

            ORDER BY c.created_at DESC

            LIMIT ? OFFSET ?

        `, [...params, limit, offset]);

        return rows;
    },


    // Get one complaint
    async findById(id) {

        const [rows] = await db.query(`

            SELECT
                c.complaint_id,
                c.complaint_code,
                c.title,
                c.description,
                c.priority,
                c.status,
                c.student_id,
                c.category_id,
                c.created_at,
                c.updated_at,
                c.resolved_at,
                c.closed_at,

                u.full_name AS student_name,
                u.email AS student_email,

                cat.category_name

            FROM complaints c

            INNER JOIN users u
                ON c.student_id = u.user_id

            INNER JOIN categories cat
                ON c.category_id = cat.category_id

            WHERE c.complaint_id = ?

        `, [id]);

        return rows[0];
    },


    // Create a complaint
    async create({ student_id, category_id, title, description, priority, status }) {

        const complaint_code = generateComplaintCode();

        const [result] = await db.query(`

            INSERT INTO complaints
                (complaint_code, student_id, category_id, title, description, priority, status)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)

        `, [
            complaint_code,
            student_id,
            category_id,
            title,
            description,
            priority || "MEDIUM",
            status && VALID_STATUSES.includes(status) ? status : "SUBMITTED"
        ]);

        return this.findById(result.insertId);
    },


    // Update a complaint (partial update)
    async update(id, fields) {

        const allowed = [
            "title",
            "description",
            "status",
            "priority",
            "category_id"
        ];

        const setClauses = [];
        const params = [];

        for (const key of allowed) {
            if (fields[key] !== undefined) {
                setClauses.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        // Auto-stamp resolved_at / closed_at when status moves into those states
        if (fields.status === "RESOLVED") {
            setClauses.push("resolved_at = NOW()");
        }

        if (fields.status === "CLOSED") {
            setClauses.push("closed_at = NOW()");
        }

        if (setClauses.length === 0) {
            return this.findById(id);
        }

        params.push(id);

        const [result] = await db.query(`
            UPDATE complaints
            SET ${setClauses.join(", ")}
            WHERE complaint_id = ?
        `, params);

        if (result.affectedRows === 0) {
            return null;
        }

        return this.findById(id);
    },


    // Delete a complaint
    async remove(id) {

        const [result] = await db.query(`
            DELETE FROM complaints WHERE complaint_id = ?
        `, [id]);

        return result.affectedRows > 0;
    },


    // Count complaints matching the same filters as findAll (for pagination)
    async count(filters = {}) {

        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push("status = ?");
            params.push(filters.status);
        }

        if (filters.category_id) {
            conditions.push("category_id = ?");
            params.push(filters.category_id);
        }

        if (filters.student_id) {
            conditions.push("student_id = ?");
            params.push(filters.student_id);
        }

        if (filters.search) {
            conditions.push("(title LIKE ? OR description LIKE ?)");
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const [rows] = await db.query(`
            SELECT COUNT(*) AS total FROM complaints ${whereClause}
        `, params);

        return rows[0].total;
    }

};

module.exports = Complaint;