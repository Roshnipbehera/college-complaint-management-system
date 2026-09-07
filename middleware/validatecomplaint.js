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

function validateComplaint(req, res, next) {

    const {
        student_id,
        category_id,
        title,
        description
    } = req.body;

    const missing = [];

    if (!student_id) missing.push("student_id");
    if (!category_id) missing.push("category_id");
    if (!title) missing.push("title");
    if (!description) missing.push("description");

    if (missing.length) {
        return res.status(400).json({
            success: false,
            message: `Missing required field(s): ${missing.join(", ")}`
        });
    }

    if (isNaN(Number(student_id))) {
        return res.status(400).json({
            success: false,
            message: "student_id must be a number"
        });
    }

    if (isNaN(Number(category_id))) {
        return res.status(400).json({
            success: false,
            message: "category_id must be a number"
        });
    }

    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
            success: false,
            message: `status must be one of: ${VALID_STATUSES.join(", ")}`
        });
    }

    if (req.body.priority && !VALID_PRIORITIES.includes(req.body.priority)) {
        return res.status(400).json({
            success: false,
            message: `priority must be one of: ${VALID_PRIORITIES.join(", ")}`
        });
    }

    next();
}

function validateComplaintUpdate(req, res, next) {

    const {
        title,
        description,
        status,
        priority,
        category_id
    } = req.body;

    if (
        title === undefined &&
        description === undefined &&
        status === undefined &&
        priority === undefined &&
        category_id === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one field to update."
        });
    }

    if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `status must be one of: ${VALID_STATUSES.join(", ")}`
        });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
            success: false,
            message: `priority must be one of: ${VALID_PRIORITIES.join(", ")}`
        });
    }

    if (category_id !== undefined && isNaN(Number(category_id))) {
        return res.status(400).json({
            success: false,
            message: "category_id must be a number"
        });
    }

    next();
}

module.exports = validateComplaint;
module.exports.validateComplaintUpdate = validateComplaintUpdate;