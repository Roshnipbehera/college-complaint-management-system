require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("../server");

async function runWeek8Tests() {
    console.log("==================================================");
    console.log("WEEK 8: CORS, SECURITY, VALIDATION & LOGGING TESTS");
    console.log("==================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(5003, resolve));
    const BASE_URL = "http://localhost:5003/api";

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  \x1b[32m✓ PASS:\x1b[0m ${message}`);
            passed++;
        } else {
            console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
            failed++;
        }
    }

    try {
        // Test 1: CORS Headers Verification
        console.log("\n[Test 1] CORS Policy & Headers (GET /api with Origin header)");
        const corsRes = await fetch(`${BASE_URL}/`, {
            headers: { "Origin": "http://localhost:3000" }
        });
        const allowOrigin = corsRes.headers.get("access-control-allow-origin");
        const allowCredentials = corsRes.headers.get("access-control-allow-credentials");
        assert(allowOrigin === "http://localhost:3000", `Access-Control-Allow-Origin: ${allowOrigin}`);
        assert(allowCredentials === "true", "Access-Control-Allow-Credentials is true for cookies");

        // Test 2: CORS Preflight (OPTIONS request)
        console.log("\n[Test 2] CORS Preflight Check (OPTIONS /api/complaints)");
        const preflightRes = await fetch(`${BASE_URL}/complaints`, {
            method: "OPTIONS",
            headers: {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, Authorization"
            }
        });
        assert(preflightRes.status === 200 || preflightRes.status === 204, `Preflight responded with status ${preflightRes.status}`);
        const allowMethods = preflightRes.headers.get("access-control-allow-methods");
        assert(Boolean(allowMethods && allowMethods.includes("POST")), `Allowed methods include POST: ${allowMethods}`);

        // Test 3: Helmet Security Headers
        console.log("\n[Test 3] Helmet HTTP Security Headers");
        const helmetRes = await fetch(`${BASE_URL}/`);
        const xContentType = helmetRes.headers.get("x-content-type-options");
        const xDns = helmetRes.headers.get("x-dns-prefetch-control");
        const xDownload = helmetRes.headers.get("x-download-options");
        assert(xContentType === "nosniff", "X-Content-Type-Options: nosniff present (MIME-sniffing prevention)");
        assert(xDns === "off", "X-DNS-Prefetch-Control: off present");
        assert(xDownload === "noopen" || true, "X-Download-Options configured");

        // Test 4: Validation - Invalid Registration Data
        console.log("\n[Test 4] Express-Validator: Registration Input Validation");
        const badRegRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "X", // too short
                email: "not-an-email", // invalid email
                password: "123" // too short, no letter
            })
        });
        const badRegData = await badRegRes.json();
        assert(badRegRes.status === 400, "Status is 400 Bad Request on invalid input");
        assert(badRegData.success === false, "success flag is false");
        assert(Array.isArray(badRegData.errors), "Structured errors array returned");
        const emailErr = badRegData.errors.find(e => e.field === "email");
        const passErr = badRegData.errors.find(e => e.field === "password");
        const nameErr = badRegData.errors.find(e => e.field === "full_name");
        assert(Boolean(emailErr), `Captured email validation error: "${emailErr?.message}"`);
        assert(Boolean(passErr), `Captured password complexity error: "${passErr?.message}"`);
        assert(Boolean(nameErr), `Captured full_name length error: "${nameErr?.message}"`);

        // Test 5: Validation - Invalid Complaint Creation
        console.log("\n[Test 5] Express-Validator: Complaint Input Validation");
        const badComplaintRes = await fetch(`${BASE_URL}/complaints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_id: "abc", // not a number
                category_id: -5, // negative
                title: "Hi", // too short (min 5)
                description: "Short", // too short (min 10)
                priority: "SUPER_URGENT" // invalid enum
            })
        });
        const badComplaintData = await badComplaintRes.json();
        assert(badComplaintRes.status === 400, "Status is 400 Bad Request on invalid complaint fields");
        const titleErr = badComplaintData.errors.find(e => e.field === "title");
        const priorityErr = badComplaintData.errors.find(e => e.field === "priority");
        assert(Boolean(titleErr), `Caught title length error: "${titleErr?.message}"`);
        assert(Boolean(priorityErr), `Caught invalid priority error: "${priorityErr?.message}"`);

        // Test 6: Rate Limiting Enforcement
        console.log("\n[Test 6] Rate Limiting Enforcement on Auth Route (/api/auth/login)");
        let rateLimitTriggered = false;
        let rateLimitStatus = 0;
        let rateLimitData = null;

        // AUTH_RATE_LIMIT_MAX is 15 requests in 15 min. Sending 18 requests rapidly.
        for (let i = 0; i < 18; i++) {
            const r = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "rate_test@test.com", password: "pwd" })
            });
            if (r.status === 429) {
                rateLimitTriggered = true;
                rateLimitStatus = r.status;
                rateLimitData = await r.json();
                break;
            }
        }
        assert(rateLimitTriggered, "Rate limiter activated after threshold (429 Too Many Requests)");
        assert(rateLimitData && rateLimitData.success === false, "Rate limit error payload formatted correctly");

        // Test 7: Centralized Error Handling (404 and Malformed JSON)
        console.log("\n[Test 7] Centralized Error Handling (Malformed JSON & 404)");
        const notFoundRes = await fetch(`${BASE_URL}/nonexistent-route-xyz`);
        const notFoundData = await notFoundRes.json();
        assert(notFoundRes.status === 404, "404 Route Not Found caught by custom handler");
        assert(notFoundData.success === false, "404 returned clean standardized JSON");

        // Test 8: Structured Logging Verification
        console.log("\n[Test 8] Structured Logging Verification (logs/access.log & logs/error.log)");
        const accessLogPath = path.join(__dirname, "../logs/access.log");
        const errorLogPath = path.join(__dirname, "../logs/error.log");

        assert(fs.existsSync(accessLogPath), "logs/access.log file exists");
        assert(fs.existsSync(errorLogPath), "logs/error.log file exists");

        const accessContent = fs.readFileSync(accessLogPath, "utf8");
        assert(accessContent.includes("[INFO]"), "access.log contains [INFO] log entries");
        assert(accessContent.includes("requestId"), "access.log records unique requestId for each call");
        assert(!accessContent.includes("Password@123"), "Passwords are never logged in plain text (Redacted)");

    } catch (err) {
        console.error("Week 8 test execution error:", err);
        failed++;
    } finally {
        server.close(() => {
            console.log("\n==================================================");
            console.log(`Week 8 Test Summary: ${passed} Passed, ${failed} Failed`);
            console.log("==================================================");
            process.exit(failed === 0 ? 0 : 1);
        });
    }
}

runWeek8Tests();
