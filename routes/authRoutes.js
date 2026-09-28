const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const { sendTokenResponse, clearTokenResponse } = require("../utils/jwt");
const { authenticate, authorize } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validators");

// ==========================================
// POST /api/auth/register (or /signup)
// ==========================================
async function handleRegister(req, res, next) {
    try {
        const { full_name, email, password, phone, role_name } = req.body;

        // Check if user already exists
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists."
            });
        }

        // Resolve role (default to STUDENT unless specified by admin)
        let role_id = 1; // Default: STUDENT
        if (role_name) {
            const role = await User.findRoleByName(role_name);
            if (role) {
                role_id = role.role_id;
            }
        }

        // Create new user (password is securely hashed with bcrypt in the model)
        const newUser = await User.create({
            full_name,
            email,
            password,
            role_id,
            phone
        });

        // Return token and set HTTP-only cookie
        sendTokenResponse(res, 201, newUser, "User registered successfully");
    } catch (error) {
        next(error);
    }
}

router.post("/register", validateRegister, handleRegister);
router.post("/signup", validateRegister, handleRegister);


// ==========================================
// POST /api/auth/login
// ==========================================
router.post("/login", validateLogin, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password."
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Verify password with bcrypt
        const isMatch = await User.validatePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact an administrator."
            });
        }

        // Send token + HTTP-only cookie
        sendTokenResponse(res, 200, user, "Login successful");
    } catch (error) {
        next(error);
    }
});


// ==========================================
// POST /api/auth/logout
// ==========================================
router.post("/logout", (req, res) => {
    clearTokenResponse(res, "Logged out successfully");
});


// ==========================================
// GET /api/auth/me (Current user profile)
// ==========================================
router.get("/me", authenticate, (req, res) => {
    res.json({
        success: true,
        data: req.user
    });
});


// ==========================================
// GET /api/auth/staff (List staff for assignment)
// ==========================================
router.get("/staff", authenticate, authorize("STAFF", "ADMIN"), async (req, res, next) => {
    try {
        const staff = await User.getStaffMembers();
        res.json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
