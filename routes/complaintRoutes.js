const express = require("express");
const router = express.Router();

const Complaint = require("../models/complaintModel");
const { optionalAuthenticate, authenticate, authorize } = require("../middleware/auth");
const {
    validateComplaintCreate,
    validateComplaintUpdate,
    validateAssignStaff,
    validateComment
} = require("../middleware/validators");

// ==============================================================================
// GET /api/complaints
// List complaints with filtering, search, and pagination
// Query params: status, category_id, student_id, priority, search, limit, page/offset
// ==============================================================================
router.get("/", optionalAuthenticate, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
        const offset = req.query.offset !== undefined ? Number(req.query.offset) : (page - 1) * limit;

        const filters = {
            status: req.query.status,
            category_id: req.query.category_id,
            student_id: req.query.student_id,
            priority: req.query.priority,
            search: req.query.search,
            limit,
            offset
        };

        // If authenticated as student and explicitly requested my complaints or role-scoped
        if (req.user && req.user.role_name === "STUDENT" && req.query.my_complaints === "true") {
            filters.student_id = req.user.user_id;
        }

        const complaints = await Complaint.findAll(filters);
        const total = await Complaint.count(filters);

        res.json({
            success: true,
            count: complaints.length,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            data: complaints
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// GET /api/complaints/:id
// Get single complaint with assignment, history, and comments
// ==============================================================================
router.get("/:id", optionalAuthenticate, async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${req.params.id} not found`
            });
        }

        // If authenticated student, only allow viewing own complaint
        if (req.user && req.user.role_name === "STUDENT" && complaint.student_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are only permitted to view your own complaints."
            });
        }

        res.json({
            success: true,
            data: complaint
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// POST /api/complaints
// Create a new complaint (student)
// ==============================================================================
router.post("/", optionalAuthenticate, validateComplaintCreate, async (req, res, next) => {
    try {
        const {
            category_id,
            title,
            description,
            priority,
            status
        } = req.body;

        // Auto-assign student_id from logged-in user if available, else from body
        let student_id = req.user ? req.user.user_id : req.body.student_id;

        if (!student_id) {
            return res.status(400).json({
                success: false,
                message: "student_id is required. Please log in or provide student_id in request body."
            });
        }

        const complaint = await Complaint.create({
            student_id: Number(student_id),
            category_id: Number(category_id),
            title,
            description,
            priority,
            status
        });

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            data: complaint
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// PUT / PATCH /api/complaints/:id
// Update complaint fields (partial or full update)
// ==============================================================================
async function handleComplaintUpdate(req, res, next) {
    try {
        const id = req.params.id;
        const current = await Complaint.findById(id);

        if (!current) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${id} not found`
            });
        }

        // Ownership & Role checks if user is authenticated
        if (req.user) {
            if (req.user.role_name === "STUDENT") {
                if (current.student_id !== req.user.user_id) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden: You can only edit your own complaints."
                    });
                }
                // Students can only edit while still SUBMITTED
                if (current.status !== "SUBMITTED") {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot edit complaint once it has moved to status '${current.status}'.`
                    });
                }
                // Students cannot change the status or priority themselves
                delete req.body.status;
                delete req.body.priority;
            }
        }

        const changedBy = req.user ? req.user.user_id : current.student_id;
        const remarks = req.body.remarks || null;

        const updated = await Complaint.update(id, req.body, changedBy, remarks);

        res.json({
            success: true,
            message: "Complaint updated successfully",
            data: updated
        });
    } catch (error) {
        next(error);
    }
}

router.put("/:id", optionalAuthenticate, validateComplaintUpdate, handleComplaintUpdate);
router.patch("/:id", optionalAuthenticate, validateComplaintUpdate, handleComplaintUpdate);


// ==============================================================================
// DELETE /api/complaints/:id
// Delete a complaint
// ==============================================================================
router.delete("/:id", optionalAuthenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const current = await Complaint.findById(id);

        if (!current) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${id} not found`
            });
        }

        // Authorization checks if user is authenticated
        if (req.user) {
            if (req.user.role_name === "STUDENT") {
                if (current.student_id !== req.user.user_id) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden: You can only delete your own complaints."
                    });
                }
                if (current.status !== "SUBMITTED") {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot delete complaint with status '${current.status}'.`
                    });
                }
            }
        }

        await Complaint.remove(id);

        res.json({
            success: true,
            message: `Complaint #${id} deleted successfully`
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// POST /api/complaints/:id/assign
// Assign complaint to staff member (Staff or Admin only)
// ==============================================================================
router.post("/:id/assign", authenticate, authorize("STAFF", "ADMIN"), validateAssignStaff, async (req, res, next) => {
    try {
        const complaint_id = req.params.id;
        const { staff_id } = req.body;

        const complaint = await Complaint.findById(complaint_id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${complaint_id} not found`
            });
        }

        const assigned = await Complaint.assign(complaint_id, staff_id, req.user.user_id);

        res.json({
            success: true,
            message: "Complaint assigned successfully",
            data: assigned
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// POST /api/complaints/:id/status
// Update status with remarks (Staff or Admin only)
// ==============================================================================
router.post("/:id/status", authenticate, authorize("STAFF", "ADMIN"), async (req, res, next) => {
    try {
        const complaint_id = req.params.id;
        const { status, remarks } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "status is required"
            });
        }

        const updated = await Complaint.update(complaint_id, { status }, req.user.user_id, remarks);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${complaint_id} not found`
            });
        }

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});


// ==============================================================================
// POST /api/complaints/:id/comments
// Add comment/reply to a complaint (Authenticated users)
// ==============================================================================
router.post("/:id/comments", authenticate, validateComment, async (req, res, next) => {
    try {
        const complaint_id = req.params.id;
        const { comment_text } = req.body;

        const complaint = await Complaint.findById(complaint_id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: `Complaint with ID ${complaint_id} not found`
            });
        }

        // Students can only comment on their own complaints
        if (req.user.role_name === "STUDENT" && complaint.student_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You can only comment on your own complaints."
            });
        }

        await Complaint.addComment(complaint_id, req.user.user_id, comment_text);
        const updatedComplaint = await Complaint.findById(complaint_id);

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: updatedComplaint
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;