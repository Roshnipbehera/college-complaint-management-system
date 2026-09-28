const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// GET /api/categories - list all active categories
router.get("/", async (req, res, next) => {
    try {
        const categories = await Category.findAll();
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/categories/:id - get category by ID
router.get("/:id", async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/categories - create category
router.post("/", async (req, res, next) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name || typeof category_name !== "string" || !category_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "category_name is required"
            });
        }

        const category = await Category.create({
            category_name: category_name.trim(),
            description: description ? description.trim() : null
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists"
            });
        }
        next(error);
    }
});

module.exports = router;
