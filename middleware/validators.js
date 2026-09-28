const { body, query, param, validationResult } = require("express-validator");

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

// Middleware to extract and format validation results
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed: please check your input fields.",
            errors: formattedErrors
        });
    }
    next();
}

// Validation rules for User Registration
const validateRegister = [
    body("full_name")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Full name must be between 2 and 100 characters")
        .escape(),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
        .matches(/\d/).withMessage("Password must contain at least one number")
        .matches(/[a-zA-Z]/).withMessage("Password must contain at least one letter"),

    body("phone")
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9+()-\s]{7,20}$/).withMessage("Please provide a valid phone number"),

    body("role_name")
        .optional()
        .trim()
        .isIn(["STUDENT", "STAFF", "ADMIN"]).withMessage("role_name must be one of: STUDENT, STAFF, ADMIN"),

    handleValidationErrors
];

// Validation rules for User Login
const validateLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("Password is required"),

    handleValidationErrors
];

// Validation rules for Complaint Creation
const validateComplaintCreate = [
    body("title")
        .trim()
        .notEmpty().withMessage("Complaint title is required")
        .isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters")
        .escape(),

    body("description")
        .trim()
        .notEmpty().withMessage("Complaint description is required")
        .isLength({ min: 10, max: 3000 }).withMessage("Description must be between 10 and 3000 characters")
        .escape(),

    body("category_id")
        .notEmpty().withMessage("category_id is required")
        .isInt({ min: 1 }).withMessage("category_id must be a positive integer"),

    body("priority")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(VALID_PRIORITIES).withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`),

    body("student_id")
        .optional()
        .isInt({ min: 1 }).withMessage("student_id must be a positive integer"),

    handleValidationErrors
];

// Validation rules for Complaint Update
const validateComplaintUpdate = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters")
        .escape(),

    body("description")
        .optional()
        .trim()
        .isLength({ min: 10, max: 3000 }).withMessage("Description must be between 10 and 3000 characters")
        .escape(),

    body("category_id")
        .optional()
        .isInt({ min: 1 }).withMessage("category_id must be a positive integer"),

    body("priority")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(VALID_PRIORITIES).withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`),

    body("status")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),

    (req, res, next) => {
        const allowed = ["title", "description", "category_id", "priority", "status"];
        const hasField = allowed.some(key => req.body[key] !== undefined);
        if (!hasField) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update (title, description, category_id, priority, status)."
            });
        }
        next();
    },

    handleValidationErrors
];

// Validation rules for Assigning Complaint
const validateAssignStaff = [
    body("staff_id")
        .notEmpty().withMessage("staff_id is required")
        .isInt({ min: 1 }).withMessage("staff_id must be a positive integer"),

    handleValidationErrors
];

// Validation rules for Adding Comment
const validateComment = [
    body("comment_text")
        .trim()
        .notEmpty().withMessage("Comment text cannot be empty")
        .isLength({ min: 1, max: 1000 }).withMessage("Comment must be between 1 and 1000 characters")
        .escape(),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateComplaintCreate,
    validateComplaintUpdate,
    validateAssignStaff,
    validateComment,
    VALID_STATUSES,
    VALID_PRIORITIES
};
