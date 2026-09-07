const express = require("express");

const router = express.Router();

const Complaint = require("../models/complaintModel");
const validateComplaint = require("../middleware/validatecomplaint");
const { validateComplaintUpdate } = require("../middleware/validatecomplaint");


// ==========================================
// GET ALL COMPLAINTS (supports filtering + pagination)
// /api/complaints?status=Pending&category_id=1&student_id=1&search=wifi&limit=10&offset=0
// ==========================================

router.get("/", async (req, res, next) => {

    try {

        const filters = {
            status: req.query.status,
            category_id: req.query.category_id,
            student_id: req.query.student_id,
            search: req.query.search,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const complaints = await Complaint.findAll(filters);
        const total = await Complaint.count(filters);

        res.json({

            success: true,

            count: complaints.length,

            total,

            data: complaints

        });

    } catch (error) {

        next(error);

    }

});


// ==========================================
// GET COMPLAINT BY ID
// ==========================================

router.get("/:id", async (req, res, next) => {

    try {

        const complaint =
            await Complaint.findById(req.params.id);


        if (!complaint) {

            const error =
                new Error("Complaint not found");

            error.status = 404;

            return next(error);

        }


        res.json({

            success: true,

            data: complaint

        });

    } catch (error) {

        next(error);

    }

});


// ==========================================
// CREATE COMPLAINT
// ==========================================

router.post("/", validateComplaint, async (req, res, next) => {

    try {

        const {
            student_id,
            category_id,
            title,
            description,
            status
        } = req.body;

        const complaint = await Complaint.create({
            student_id,
            category_id,
            title,
            description,
            status
        });

        res.status(201).json({

            success: true,

            message: "Complaint created successfully",

            data: complaint

        });

    } catch (error) {

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            error.status = 400;
            error.message = "Invalid student_id or category_id.";
        }

        next(error);

    }

});


// ==========================================
// UPDATE COMPLAINT (partial update — title, description,
// status, category_id, assigned_to)
// ==========================================

router.put("/:id", validateComplaintUpdate, async (req, res, next) => {

    try {

        const updated = await Complaint.update(req.params.id, req.body);

        if (!updated) {

            const error = new Error("Complaint not found");
            error.status = 404;
            return next(error);

        }

        res.json({

            success: true,

            message: "Complaint updated successfully",

            data: updated

        });

    } catch (error) {

        next(error);

    }

});

router.patch("/:id", validateComplaintUpdate, async (req, res, next) => {

    try {

        const updated = await Complaint.update(req.params.id, req.body);

        if (!updated) {

            const error = new Error("Complaint not found");
            error.status = 404;
            return next(error);

        }

        res.json({

            success: true,

            message: "Complaint updated successfully",

            data: updated

        });

    } catch (error) {

        next(error);

    }

});


// ==========================================
// DELETE COMPLAINT
// ==========================================

router.delete("/:id", async (req, res, next) => {

    try {

        const deleted = await Complaint.remove(req.params.id);

        if (!deleted) {

            const error = new Error("Complaint not found");
            error.status = 404;
            return next(error);

        }

        res.json({

            success: true,

            message: "Complaint deleted successfully"

        });

    } catch (error) {

        next(error);

    }

});


module.exports = router;