require("dotenv").config();
const http = require("http");
const app = require("../server");

async function runWeek7Tests() {
    console.log("==================================================");
    console.log("WEEK 7: AUTHENTICATION, BCRYPT & SESSIONS/COOKIES");
    console.log("==================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(5002, resolve));
    const BASE_URL = "http://localhost:5002/api";

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
        const uniqueEmail = `student_${Date.now()}@college.com`;
        let studentToken = null;
        let studentCookie = null;
        let staffToken = null;
        let createdComplaintId = null;

        // Test 1: User Registration
        console.log("\n[Test 1] User Registration (POST /api/auth/register)");
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "Anita Sharma",
                email: uniqueEmail,
                password: "Password@123",
                phone: "9876501234",
                role_name: "STUDENT"
            })
        });
        const regData = await regRes.json();
        assert(regRes.status === 201, "Status is 201 Created");
        assert(regData.success === true, "Registration success flag is true");
        assert(Boolean(regData.token), "JWT token returned in response body");
        assert(regData.user?.role_name === "STUDENT", "User assigned role STUDENT");
        assert(!regData.user?.password_hash, "password_hash is safely omitted from response");

        // Check Set-Cookie header
        const rawCookie = regRes.headers.get("set-cookie");
        assert(Boolean(rawCookie && rawCookie.includes("token=")), "HTTP-only cookie set in response header");
        assert(rawCookie && rawCookie.includes("HttpOnly"), "Cookie has HttpOnly security flag");
        assert(rawCookie && rawCookie.includes("SameSite=Lax"), "Cookie has SameSite=Lax CSRF protection");

        studentToken = regData.token;
        studentCookie = rawCookie ? rawCookie.split(";")[0] : null;

        // Test 2: Prevent Duplicate Registration
        console.log("\n[Test 2] Duplicate Registration Prevention");
        const dupRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "Duplicate User",
                email: uniqueEmail,
                password: "Password@123"
            })
        });
        const dupData = await dupRes.json();
        assert(dupRes.status === 409, "Status is 409 Conflict for duplicate email");
        assert(dupData.success === false, "Duplicate registration rejected");

        // Test 3: Login with Correct Password
        console.log("\n[Test 3] User Login - Valid Credentials (POST /api/auth/login)");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: uniqueEmail,
                password: "Password@123"
            })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200, "Status is 200 OK on valid password");
        assert(loginData.success === true, "Login success flag is true");
        assert(loginData.user?.email === uniqueEmail.toLowerCase(), "Logged in user email matches");

        // Test 4: Login with Invalid Password
        console.log("\n[Test 4] User Login - Invalid Password");
        const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: uniqueEmail,
                password: "IncorrectPassword999"
            })
        });
        assert(badLoginRes.status === 401, "Status is 401 Unauthorized for incorrect password");

        // Test 5: Protected Route Access via Bearer Token
        console.log("\n[Test 5] Access Protected Route via Bearer Token (GET /api/auth/me)");
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${studentToken}` }
        });
        const meData = await meRes.json();
        assert(meRes.status === 200, "Status is 200 OK with Bearer token");
        assert(meData.data?.full_name === "Anita Sharma", "Authenticated profile retrieved correctly");

        // Test 6: Protected Route Access via Cookie Session
        console.log("\n[Test 6] Access Protected Route via Cookie Session (GET /api/auth/me)");
        const cookieMeRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { "Cookie": studentCookie }
        });
        const cookieMeData = await cookieMeRes.json();
        assert(cookieMeRes.status === 200, "Status is 200 OK with session Cookie");
        assert(cookieMeData.data?.full_name === "Anita Sharma", "Profile retrieved via Cookie");

        // Test 7: Unauthorized Access Blocked
        console.log("\n[Test 7] Protected Route Blocked Without Credentials");
        const unauthRes = await fetch(`${BASE_URL}/auth/me`);
        assert(unauthRes.status === 401, "Status is 401 Unauthorized when missing token");

        // Test 8: Role-Based Access Control (RBAC)
        console.log("\n[Test 8] Role-Based Access Control (Student vs Staff)");
        // Student attempts to access staff endpoint
        const studentStaffAttempt = await fetch(`${BASE_URL}/auth/staff`, {
            headers: { "Authorization": `Bearer ${studentToken}` }
        });
        assert(studentStaffAttempt.status === 403, "Student denied access to staff endpoint (403 Forbidden)");

        // Login as Staff
        const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "staff@college.com",
                password: "Staff@123"
            })
        });
        const staffLoginData = await staffLoginRes.json();
        assert(staffLoginRes.status === 200, "Staff login successful (200 OK)");
        staffToken = staffLoginData.token;

        // Staff accesses staff endpoint
        const staffListRes = await fetch(`${BASE_URL}/auth/staff`, {
            headers: { "Authorization": `Bearer ${staffToken}` }
        });
        const staffListData = await staffListRes.json();
        assert(staffListRes.status === 200, "Staff authorized to access staff endpoint (200 OK)");
        assert(Array.isArray(staffListData.data), "Staff list returned");

        // Test 9: Authenticated Student files a complaint & Staff manages lifecycle
        console.log("\n[Test 9] Authenticated Complaint Lifecycle (File -> Assign -> Status Update -> Comment)");
        const studentComplaintRes = await fetch(`${BASE_URL}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                category_id: 1,
                title: "Grade discrepancy in Operating Systems lab evaluation",
                description: "Lab evaluation marks submitted for OS show 15 instead of 25 awarded in Viva.",
                priority: "HIGH"
            })
        });
        const studentComplaintData = await studentComplaintRes.json();
        assert(studentComplaintRes.status === 201, "Student created complaint successfully (201 Created)");
        assert(studentComplaintData.data?.student_name === "Anita Sharma", "student_id automatically resolved from token");
        createdComplaintId = studentComplaintData.data?.complaint_id;

        // Staff assigns complaint
        const assignRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}/assign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${staffToken}`
            },
            body: JSON.stringify({ staff_id: 2 })
        });
        const assignData = await assignRes.json();
        assert(assignRes.status === 200, "Staff assigned complaint (200 OK)");
        assert(assignData.data?.status === "ASSIGNED", "Complaint status automatically changed to ASSIGNED");

        // Staff updates status to IN_PROGRESS with remarks
        const statusRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${staffToken}`
            },
            body: JSON.stringify({
                status: "IN_PROGRESS",
                remarks: "Checking mark sheet with lab instructor"
            })
        });
        const statusData = await statusRes.json();
        assert(statusRes.status === 200, "Staff updated status to IN_PROGRESS (200 OK)");

        // Student adds comment
        const commentRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                comment_text: "Thank you sir, I have attached the original signed viva evaluation sheet."
            })
        });
        const commentData = await commentRes.json();
        assert(commentRes.status === 201, "Student added comment to complaint (201 Created)");
        assert(commentData.data?.comments?.length > 0, "Comment recorded in complaint thread");

        // Test 10: Logout
        console.log("\n[Test 10] Logout & Session Invalidation (POST /api/auth/logout)");
        const logoutRes = await fetch(`${BASE_URL}/auth/logout`, { method: "POST" });
        const logoutCookie = logoutRes.headers.get("set-cookie");
        assert(logoutRes.status === 200, "Status is 200 OK on logout");
        assert(Boolean(logoutCookie && (logoutCookie.toLowerCase().includes("max-age=0") || logoutCookie.toLowerCase().includes("expires="))), "Token cookie cleared on logout");

    } catch (err) {
        console.error("Week 7 test execution error:", err);
        failed++;
    } finally {
        server.close(() => {
            console.log("\n==================================================");
            console.log(`Week 7 Test Summary: ${passed} Passed, ${failed} Failed`);
            console.log("==================================================");
            process.exit(failed === 0 ? 0 : 1);
        });
    }
}

runWeek7Tests();
