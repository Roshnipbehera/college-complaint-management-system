const express = require("express");

const router = express.Router();

const Complaint = require("../models/complaintModel");


// ==========================================
// GET ALL COMPLAINTS
// ==========================================

router.get("/", async (req, res, next) => {

    try {

        const complaints = await Complaint.findAll();

        res.json({

            success: true,

            count: complaints.length,

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


module.exports = router;