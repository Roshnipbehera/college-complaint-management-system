const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "college_complaint_jwt_secret_key_super_secure_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Generate signed JWT token
function generateToken(user) {
    const payload = {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}

// Verify JWT token
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

// Set HTTP-only cookie and send JSON response
function sendTokenResponse(res, statusCode, user, message = "Success") {
    const token = generateToken(user);

    // Cookie configuration
    const cookieOptions = {
        httpOnly: true, // Prevents client-side script access (mitigates XSS)
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // Protects against CSRF
        maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    };

    res.cookie("token", token, cookieOptions);

    res.status(statusCode).json({
        success: true,
        message,
        token,
        user: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role_name: user.role_name,
            phone: user.phone || null
        }
    });
}

// Clear auth cookie on logout
function clearTokenResponse(res, message = "Logged out successfully") {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(200).json({
        success: true,
        message
    });
}

module.exports = {
    generateToken,
    verifyToken,
    sendTokenResponse,
    clearTokenResponse
};
