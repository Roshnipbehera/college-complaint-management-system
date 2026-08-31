const db = require("../config/db");

const Complaint = {

    // Get all complaints
    async findAll() {

        const [rows] = await db.query(`

            SELECT
                c.complaint_id,
                c.complaint_code,
                c.title,
                c.description,
                c.priority,
                c.status,
                c.created_at,
                c.updated_at,

                u.full_name AS student_name,
                u.email AS student_email,

                cat.category_name

            FROM complaints c

            INNER JOIN users u
                ON c.student_id = u.user_id

            INNER JOIN categories cat
                ON c.category_id = cat.category_id

            ORDER BY c.created_at DESC

        `);

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
    }

};

module.exports = Complaint;