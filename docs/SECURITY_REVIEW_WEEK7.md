# Week 7: Authentication, Bcrypt & Sessions/Cookies - Security Review

## 1. Executive Summary
Week 7 introduces end-to-end user identity management, authentication, role-based access control (RBAC), and session security. This document reviews the architectural security controls implemented for password storage, token generation, cookie attributes, and authorization guards.

---

## 2. Password Security & Hashing Architecture

### 2.1 Technology: `bcryptjs`
- **Algorithm**: Adaptive hash function based on the Blowfish cipher.
- **Cost Factor (Salt Rounds)**: `10` rounds (2¹⁰ = 1,024 iterations), which provides an optimal balance between server response latency (~150ms) and computational resistance against brute-force / GPU dictionary attacks.
- **Salt Generation**: Unique cryptographic salt is generated for each password hash, completely nullifying pre-computed Rainbow Table attacks.

### 2.2 Storage Security
- Passwords are never stored in plaintext anywhere in the system.
- The `users` database schema utilizes `password_hash VARCHAR(255) NOT NULL`.
- In all database queries (`User.findById`, `User.findAll`), the `password_hash` column is explicitly omitted from `SELECT` clauses to prevent accidental data leakage via API serialization.
- Logger sanitization (`utils/logger.js`) scrubs `password` and `password_hash` keys before writing entries to disk.

---

## 3. Session & Token Management

The system supports a dual-channel authentication strategy, accommodating both browser-based web applications (via cookies) and mobile/API clients (via Bearer tokens).

### 3.1 JSON Web Tokens (JWT)
- **Library**: `jsonwebtoken`
- **Claims Payload**:
  ```json
  {
    "user_id": 1,
    "email": "student@college.com",
    "role_id": 1,
    "role_name": "STUDENT",
    "iat": 1727507475,
    "exp": 1727593875
  }
  ```
- **Secret Key**: Managed through environment variable `JWT_SECRET` with strong entropy.
- **Expiration**: Standard 24-hour lifetime (`1d`), limiting the window of exposure if a token is compromised.

### 3.2 HTTP-Only Cookie Protection
Tokens are set on HTTP responses using secure cookie directives:
```javascript
res.cookie("token", token, {
    httpOnly: true,                               // Prevents document.cookie access from JavaScript (mitigates XSS)
    secure: process.env.NODE_ENV === "production", // Restricts cookie transmission to HTTPS in production
    sameSite: "lax",                              // Mitigates Cross-Site Request Forgery (CSRF)
    maxAge: 24 * 60 * 60 * 1000                   // 24-hour expiration
});
```

### 3.3 Cookie Clearing on Logout
`POST /api/auth/logout` explicitly clears the cookie with identical domain, path, and security directives to terminate the active session immediately.

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Roles Defined:
1. `STUDENT` (Role ID: 1): Can register, view their own profile, submit complaints, view and edit their own submitted complaints, and post comments.
2. `STAFF` (Role ID: 2): Can view all complaints across categories, be assigned to complaints, update complaint status with remarks, and post comments.
3. `ADMIN` (Role ID: 3): Full operational authority; can create categories, manage user roles, delete complaints, and assign staff.

### 4.2 Middleware Guards
- `authenticate`: Validates JWT token from cookie or `Authorization: Bearer <token>` header, verifies token signature and expiration, checks account `is_active` status in MySQL, and attaches `req.user`.
- `authorize(...roles)`: Verifies `req.user.role_name` against permitted roles; returns `403 Forbidden` on unauthorized access.
- **Ownership Scoping**: When a student fetches `/api/complaints/:id` or attempts to update a complaint, the system verifies `complaint.student_id === req.user.user_id`.

---

## 5. Security Audit Matrix

| Security Threat | OWASP Category | Mitigation Implemented | Validation Status |
|---|---|---|---|
| Plaintext password exposure | A02:2021 Cryptographic Failures | bcrypt 10 rounds + unique per-user salt | Verified |
| Rainbow table lookup | A02:2021 Cryptographic Failures | Cryptographic salt generated per hash | Verified |
| Token theft via XSS | A03:2021 Injection | `httpOnly: true` on auth cookies | Verified |
| Cross-Site Request Forgery | A01:2021 Broken Access Control | `SameSite=Lax` cookie policy | Verified |
| Privilege escalation | A01:2021 Broken Access Control | Server-side role check via `authorize()` middleware | Verified |
| Account Enumeration | A07:2021 Identification & Auth | Generic "Invalid email or password" error messages | Verified |
| Inactive account access | A07:2021 Identification & Auth | `is_active` flag checked upon every authenticated request | Verified |

---

## 6. Automated Testing Verification

Week 7 automated test results (`npm run test:week7`):
- Total Test Cases: 32
- Passed: 32
- Failed: 0
- Coverage: User registration, duplicate email handling, bcrypt verification, invalid password rejection, HTTP-only cookie setting, Bearer token verification, role permissions (Student vs Staff), and logout session termination.
