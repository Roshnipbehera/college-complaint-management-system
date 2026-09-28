const { verifyToken } = require("../utils/jwt");
const User = require("../models/userModel");

// Middleware to verify JWT from HTTP-only cookie OR Authorization Bearer header
async function authenticate(req, res, next) {
    try {
        let token = null;

        // 1. Check HTTP-only cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // 2. Check Authorization header (Bearer <token>)
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in or provide a Bearer token."
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (jwtErr) {
            if (jwtErr.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Authentication token expired. Please log in again."
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // Verify user exists and is active
        const user = await User.findById(decoded.user_id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists."
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "User account has been deactivated."
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

// Optional authentication - populates req.user if token is present, does not fail if not
async function optionalAuthenticate(req, res, next) {
    try {
        let token = null;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = verifyToken(token);
                const user = await User.findById(decoded.user_id);
                if (user && user.is_active) {
                    req.user = user;
                }
            } catch (err) {
                // Ignore invalid token in optional mode
            }
        }
        next();
    } catch (error) {
        next(error);
    }
}

// Role-based authorization middleware
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const normalizedRoles = allowedRoles.map(r => r.toUpperCase());
        const userRole = (req.user.role_name || "").toUpperCase();

        if (!normalizedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]. Your role is ${userRole}.`
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    optionalAuthenticate,
    authorize
};
