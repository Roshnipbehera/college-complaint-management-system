require("dotenv").config();
const http = require("http");
const app = require("../server");

async function runWeek9IntegrationTests() {
    console.log("================================================================================");
    console.log("WEEK 9: FULL END-TO-END INTEGRATION & WORKFLOW TESTING");
    console.log("================================================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(5004, resolve));
    const BASE_URL = "http://localhost:5004/api";

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
        const studentEmail = `integration_student_${Date.now()}@college.com`;
        let studentToken = null;
        let staffToken = null;
        let complaintId = null;
        let complaintCode = null;

        // Step 1: Student Registration
        console.log("\n[Step 1] Student Signs Up to the Portal");
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "Rahul Verma",
                email: studentEmail,
                password: "Password@123",
                phone: "9876543210"
            })
        });
        const regData = await regRes.json();
        assert(regRes.status === 201, "Student account created (201 Created)");
        studentToken = regData.token;

        // Step 2: Student Fetches Available Categories
        console.log("\n[Step 2] Student Retrieves Active Complaint Categories");
        const catRes = await fetch(`${BASE_URL}/categories`);
        const catData = await catRes.json();
        assert(catRes.status === 200, "Categories retrieved successfully");
        const labCategory = catData.data.find(c => c.category_name === "Laboratory") || catData.data[0];
        assert(Boolean(labCategory), `Selected category: ${labCategory.category_name} (ID: ${labCategory.category_id})`);

        // Step 3: Student Files a Complaint
        console.log("\n[Step 3] Student Files a Grievance");
        const createRes = await fetch(`${BASE_URL}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                category_id: labCategory.category_id,
                title: "Digital Oscilloscope display glitching in Lab 3",
                description: "Bench #4 oscilloscope screen flickers violently and produces inverted waveforms during analog circuits experiment.",
                priority: "HIGH"
            })
        });
        const createData = await createRes.json();
        assert(createRes.status === 201, "Complaint filed successfully (201 Created)");
        complaintId = createData.data?.complaint_id;
        complaintCode = createData.data?.complaint_code;
        assert(Boolean(complaintCode && complaintCode.startsWith("CMP-")), `Generated Tracking Code: ${complaintCode}`);
        assert(createData.data?.status === "SUBMITTED", "Initial status set to SUBMITTED");

        // Step 4: Student Searches / Filters for their own complaint
        console.log("\n[Step 4] Student Queries Complaint List by Search & Status");
        const searchRes = await fetch(`${BASE_URL}/complaints?search=Oscilloscope&status=SUBMITTED`);
        const searchData = await searchRes.json();
        assert(searchRes.status === 200, "Search query returned 200 OK");
        assert(searchData.data.some(c => c.complaint_id === complaintId), "Student's complaint retrieved via search");

        // Step 5: Staff Member Authenticates
        console.log("\n[Step 5] Staff Member Logs In for Triage");
        const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "staff@college.com",
                password: "Staff@123"
            })
        });
        const staffLoginData = await staffLoginRes.json();
        assert(staffLoginRes.status === 200, "Staff login successful");
        staffToken = staffLoginData.token;

        // Step 6: Staff Assigns Complaint to Staff User (ID: 2)
        console.log("\n[Step 6] Staff Assigns Complaint for Resolution");
        const assignRes = await fetch(`${BASE_URL}/complaints/${complaintId}/assign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${staffToken}`
            },
            body: JSON.stringify({ staff_id: 2 })
        });
        const assignData = await assignRes.json();
        assert(assignRes.status === 200, "Complaint assigned successfully");
        assert(assignData.data?.assigned_staff_name === "Demo Staff", "Assigned staff name verified");
        assert(assignData.data?.status === "ASSIGNED", "Status updated to ASSIGNED");

        // Step 7: Staff Starts Investigation (Status -> IN_PROGRESS)
        console.log("\n[Step 7] Staff Updates Lifecycle Status with Remarks");
        const statusRes = await fetch(`${BASE_URL}/complaints/${complaintId}/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${staffToken}`
            },
            body: JSON.stringify({
                status: "IN_PROGRESS",
                remarks: "Lab technician dispatched with replacement probe set."
            })
        });
        const statusData = await statusRes.json();
        assert(statusRes.status === 200, "Status updated to IN_PROGRESS");
        assert(statusData.data?.status === "IN_PROGRESS", "Complaint verified IN_PROGRESS");

        // Step 8: Student Adds Clarification Comment
        console.log("\n[Step 8] Student Posts a Discussion Comment");
        const commentRes = await fetch(`${BASE_URL}/complaints/${complaintId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                comment_text: "Thank you. Bench #4 power supply is also unstable."
            })
        });
        const commentData = await commentRes.json();
        assert(commentRes.status === 201, "Student comment recorded");
        assert(commentData.data?.comments?.length > 0, "Comment thread populated");

        // Step 9: Staff Resolves Grievance
        console.log("\n[Step 9] Staff Resolves Grievance");
        const resolveRes = await fetch(`${BASE_URL}/complaints/${complaintId}/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${staffToken}`
            },
            body: JSON.stringify({
                status: "RESOLVED",
                remarks: "Replaced faulty BNC cable and power adapter. Oscilloscope calibrated."
            })
        });
        const resolveData = await resolveRes.json();
        assert(resolveRes.status === 200, "Complaint resolved successfully");
        assert(resolveData.data?.status === "RESOLVED", "Status verified RESOLVED");
        assert(Boolean(resolveData.data?.resolved_at), "resolved_at timestamp captured");

        // Step 10: Complete Audit Verification
        console.log("\n[Step 10] Verify Complete Lifecycle Audit Trail");
        const auditRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
            headers: { "Authorization": `Bearer ${studentToken}` }
        });
        const auditData = await auditRes.json();
        assert(auditRes.status === 200, "Full complaint audit retrieved");
        const history = auditData.data?.status_history || [];
        assert(history.length >= 3, `Audit captured ${history.length} status transitions`);

    } catch (err) {
        console.error("Integration test error:", err);
        failed++;
    } finally {
        server.close(() => {
            console.log("\n================================================================================");
            console.log(`Week 9 Integration Test Summary: ${passed} Passed, ${failed} Failed`);
            console.log("================================================================================");
            process.exit(failed === 0 ? 0 : 1);
        });
    }
}

runWeek9IntegrationTests();
