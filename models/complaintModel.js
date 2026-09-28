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

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function generateComplaintCode() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CMP-${stamp}-${rand}`;
}

const Complaint = {
    // Get all complaints with filtering, search & pagination
    // filters: { status, category_id, student_id, priority, search, limit, offset }
    async findAll(filters = {}) {
        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push("c.status = ?");
            params.push(filters.status);
        }

        if (filters.category_id) {
            conditions.push("c.category_id = ?");
            params.push(Number(filters.category_id));
        }

        if (filters.student_id) {
            conditions.push("c.student_id = ?");
            params.push(Number(filters.student_id));
        }

        if (filters.priority) {
            conditions.push("c.priority = ?");
            params.push(filters.priority);
        }

        if (filters.search) {
            conditions.push("(c.title LIKE ? OR c.description LIKE ? OR c.complaint_code LIKE ?)");
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
        const offset = Math.max(0, Number(filters.offset) || 0);

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

                cat.category_name,

                staff_u.full_name AS assigned_staff_name,
                staff_u.email AS assigned_staff_email

            FROM complaints c
            INNER JOIN users u
                ON c.student_id = u.user_id
            INNER JOIN categories cat
                ON c.category_id = cat.category_id
            LEFT JOIN complaint_assignments ca
                ON c.complaint_id = ca.complaint_id AND ca.is_current = 1
            LEFT JOIN users staff_u
                ON ca.staff_id = staff_u.user_id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        return rows;
    },

    // Count complaints matching filters for pagination
    async count(filters = {}) {
        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push("c.status = ?");
            params.push(filters.status);
        }

        if (filters.category_id) {
            conditions.push("c.category_id = ?");
            params.push(Number(filters.category_id));
        }

        if (filters.student_id) {
            conditions.push("c.student_id = ?");
            params.push(Number(filters.student_id));
        }

        if (filters.priority) {
            conditions.push("c.priority = ?");
            params.push(filters.priority);
        }

        if (filters.search) {
            conditions.push("(c.title LIKE ? OR c.description LIKE ? OR c.complaint_code LIKE ?)");
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const [rows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM complaints c
            ${whereClause}
        `, params);

        return rows[0].total;
    },

    // Get single complaint with details, assignments, status history, and comments
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
                u.phone AS student_phone,

                cat.category_name,

                staff_u.user_id AS assigned_staff_id,
                staff_u.full_name AS assigned_staff_name,
                staff_u.email AS assigned_staff_email

            FROM complaints c
            INNER JOIN users u
                ON c.student_id = u.user_id
            INNER JOIN categories cat
                ON c.category_id = cat.category_id
            LEFT JOIN complaint_assignments ca
                ON c.complaint_id = ca.complaint_id AND ca.is_current = 1
            LEFT JOIN users staff_u
                ON ca.staff_id = staff_u.user_id
            WHERE c.complaint_id = ?
        `, [id]);

        if (!rows.length) return null;

        const complaint = rows[0];

        // Fetch status history
        const [history] = await db.query(`
            SELECT 
                h.history_id,
                h.old_status,
                h.new_status,
                h.remarks,
                h.changed_at,
                u.full_name AS changed_by_name,
                r.role_name AS changed_by_role
            FROM complaint_status_history h
            LEFT JOIN users u ON h.changed_by = u.user_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE h.complaint_id = ?
            ORDER BY h.changed_at ASC
        `, [id]);
        complaint.status_history = history;

        // Fetch comments
        const [comments] = await db.query(`
            SELECT
                com.comment_id,
                com.comment_text,
                com.created_at,
                u.user_id,
                u.full_name,
                r.role_name
            FROM comments com
            INNER JOIN users u ON com.user_id = u.user_id
            INNER JOIN roles r ON u.role_id = r.role_id
            WHERE com.complaint_id = ?
            ORDER BY com.created_at ASC
        `, [id]);
        complaint.comments = comments;

        return complaint;
    },

    // Create a new complaint
    async create({ student_id, category_id, title, description, priority, status }) {
        const complaint_code = generateComplaintCode();
        const initialStatus = status && VALID_STATUSES.includes(status) ? status : "SUBMITTED";
        const initialPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM";

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
            initialPriority,
            initialStatus
        ]);

        // Record initial status in history
        await db.query(`
            INSERT INTO complaint_status_history
                (complaint_id, old_status, new_status, changed_by, remarks)
            VALUES
                (?, NULL, ?, ?, ?)
        `, [
            result.insertId,
            initialStatus,
            student_id,
            "Complaint submitted by student"
        ]);

        return this.findById(result.insertId);
    },

    // Partial update complaint (title, description, status, priority, category_id)
    async update(id, fields, changed_by = null, remarks = null) {
        const current = await this.findById(id);
        if (!current) return null;

        const allowed = ["title", "description", "status", "priority", "category_id"];
        const setClauses = [];
        const params = [];

        for (const key of allowed) {
            if (fields[key] !== undefined) {
                setClauses.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        // Handle status timestamps
        if (fields.status === "RESOLVED") {
            setClauses.push("resolved_at = NOW()");
        } else if (fields.status && fields.status !== "RESOLVED") {
            setClauses.push("resolved_at = NULL");
        }

        if (fields.status === "CLOSED") {
            setClauses.push("closed_at = NOW()");
        } else if (fields.status && fields.status !== "CLOSED") {
            setClauses.push("closed_at = NULL");
        }

        if (setClauses.length > 0) {
            params.push(id);
            await db.query(`
                UPDATE complaints
                SET ${setClauses.join(", ")}
                WHERE complaint_id = ?
            `, params);
        }

        // If status changed, record history
        if (fields.status && fields.status !== current.status) {
            await db.query(`
                INSERT INTO complaint_status_history
                    (complaint_id, old_status, new_status, changed_by, remarks)
                VALUES
                    (?, ?, ?, ?, ?)
            `, [
                id,
                current.status,
                fields.status,
                changed_by || current.student_id,
                remarks || `Status changed from ${current.status} to ${fields.status}`
            ]);
        }

        return this.findById(id);
    },

    // Assign complaint to staff member
    async assign(complaint_id, staff_id, assigned_by) {
        // Mark previous assignments as not current
        await db.query(`
            UPDATE complaint_assignments
            SET is_current = 0, unassigned_at = NOW()
            WHERE complaint_id = ? AND is_current = 1
        `, [complaint_id]);

        // Insert new assignment
        await db.query(`
            INSERT INTO complaint_assignments
                (complaint_id, staff_id, assigned_by, is_current)
            VALUES
                (?, ?, ?, 1)
        `, [complaint_id, staff_id, assigned_by]);

        // Update status to ASSIGNED if currently SUBMITTED or UNDER_REVIEW
        const current = await this.findById(complaint_id);
        if (current && (current.status === "SUBMITTED" || current.status === "UNDER_REVIEW")) {
            await this.update(complaint_id, { status: "ASSIGNED" }, assigned_by, "Complaint assigned to staff");
        }

        return this.findById(complaint_id);
    },

    // Add comment to a complaint
    async addComment(complaint_id, user_id, comment_text) {
        const [result] = await db.query(`
            INSERT INTO comments (complaint_id, user_id, comment_text)
            VALUES (?, ?, ?)
        `, [complaint_id, user_id, comment_text]);

        return result.insertId;
    },

    // Delete a complaint
    async remove(id) {
        const [result] = await db.query(`
            DELETE FROM complaints WHERE complaint_id = ?
        `, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Complaint;