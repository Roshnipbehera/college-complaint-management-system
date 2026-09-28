require("dotenv").config();
const http = require("http");
const app = require("../server");

async function runWeek6Tests() {
    console.log("==================================================");
    console.log("WEEK 6: CRUD OPERATIONS, QUERIES & FILTERING TESTS");
    console.log("==================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(5001, resolve));
    const BASE_URL = "http://localhost:5001/api";

    let passed = 0;
    let failed = 0;
    let createdComplaintId = null;

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
        // Test 1: Get Categories
        console.log("\n[Test 1] List Categories (GET /api/categories)");
        const catRes = await fetch(`${BASE_URL}/categories`);
        const catData = await catRes.json();
        assert(catRes.status === 200, "Status is 200 OK");
        assert(catData.success === true, "Response success is true");
        assert(Array.isArray(catData.data) && catData.data.length > 0, `Returned ${catData.count} active categories`);

        // Test 2: Create Complaint (POST /api/complaints)
        console.log("\n[Test 2] Create Complaint (POST /api/complaints)");
        const createRes = await fetch(`${BASE_URL}/complaints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_id: 1,
                category_id: 2,
                title: "AC not cooling in Seminar Hall A",
                description: "The split AC unit in Seminar Hall A has not been cooling properly during lectures.",
                priority: "HIGH",
                status: "SUBMITTED"
            })
        });
        const createData = await createRes.json();
        assert(createRes.status === 201, "Status is 201 Created");
        assert(createData.success === true, "Response success is true");
        assert(createData.data && createData.data.complaint_id, `Created Complaint ID: ${createData.data?.complaint_id}`);
        assert(createData.data?.title === "AC not cooling in Seminar Hall A", "Title matches payload");
        assert(createData.data?.priority === "HIGH", "Priority set to HIGH");
        createdComplaintId = createData.data?.complaint_id;

        // Test 3: Read All Complaints (GET /api/complaints)
        console.log("\n[Test 3] Read All Complaints (GET /api/complaints)");
        const listRes = await fetch(`${BASE_URL}/complaints`);
        const listData = await listRes.json();
        assert(listRes.status === 200, "Status is 200 OK");
        assert(listData.total > 0, `Total complaints count: ${listData.total}`);
        assert(Array.isArray(listData.data), "Data is an array");

        // Test 4: Query Filtering by Status
        console.log("\n[Test 4] Query Filtering by Status (GET /api/complaints?status=SUBMITTED)");
        const filterStatusRes = await fetch(`${BASE_URL}/complaints?status=SUBMITTED`);
        const filterStatusData = await filterStatusRes.json();
        assert(filterStatusRes.status === 200, "Status is 200 OK");
        const allSubmitted = filterStatusData.data.every(c => c.status === "SUBMITTED");
        assert(allSubmitted, "All returned complaints have status 'SUBMITTED'");

        // Test 5: Query Filtering by Category
        console.log("\n[Test 5] Query Filtering by Category (GET /api/complaints?category_id=2)");
        const filterCatRes = await fetch(`${BASE_URL}/complaints?category_id=2`);
        const filterCatData = await filterCatRes.json();
        assert(filterCatRes.status === 200, "Status is 200 OK");
        const allCat2 = filterCatData.data.every(c => c.category_id === 2);
        assert(allCat2, "All returned complaints belong to category_id 2");

        // Test 6: Keyword Search
        console.log("\n[Test 6] Keyword Search (GET /api/complaints?search=Seminar)");
        const searchRes = await fetch(`${BASE_URL}/complaints?search=Seminar`);
        const searchData = await searchRes.json();
        assert(searchRes.status === 200, "Status is 200 OK");
        assert(searchData.data.some(c => c.title.includes("Seminar")), "Search found complaint with keyword 'Seminar'");

        // Test 7: Pagination (limit & page)
        console.log("\n[Test 7] Pagination (GET /api/complaints?limit=1&page=1)");
        const pageRes = await fetch(`${BASE_URL}/complaints?limit=1&page=1`);
        const pageData = await pageRes.json();
        assert(pageRes.status === 200, "Status is 200 OK");
        assert(pageData.data.length === 1, "Returned exact limit of 1 record");
        assert(pageData.limit === 1 && pageData.page === 1, "Pagination metadata included");

        // Test 8: Read Complaint by ID (GET /api/complaints/:id)
        console.log(`\n[Test 8] Read Single Complaint (GET /api/complaints/${createdComplaintId})`);
        const getRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`);
        const getData = await getRes.json();
        assert(getRes.status === 200, "Status is 200 OK");
        assert(getData.data?.complaint_id === createdComplaintId, "Retrieved correct complaint ID");
        assert(getData.data?.student_name === "Demo Student", "Joined student name correctly");
        assert(Array.isArray(getData.data?.status_history), "Includes status history array");

        // Test 9: Update Complaint (PUT /api/complaints/:id)
        console.log(`\n[Test 9] Update Complaint Partial (PUT /api/complaints/${createdComplaintId})`);
        const updateRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "AC not cooling in Seminar Hall A (Urgent Attention)",
                priority: "URGENT",
                status: "UNDER_REVIEW"
            })
        });
        const updateData = await updateRes.json();
        assert(updateRes.status === 200, "Status is 200 OK");
        assert(updateData.data?.priority === "URGENT", "Priority updated to URGENT");
        assert(updateData.data?.status === "UNDER_REVIEW", "Status updated to UNDER_REVIEW");

        // Test 10: Delete Complaint (DELETE /api/complaints/:id)
        console.log(`\n[Test 10] Delete Complaint (DELETE /api/complaints/${createdComplaintId})`);
        const delRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
            method: "DELETE"
        });
        const delData = await delRes.json();
        assert(delRes.status === 200, "Status is 200 OK");
        assert(delData.success === true, "Delete response success is true");

        // Verify Deletion
        const verifyDelRes = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`);
        assert(verifyDelRes.status === 404, "Subsequent GET returns 404 Not Found");

    } catch (err) {
        console.error("Test execution encountered an error:", err);
        failed++;
    } finally {
        server.close(() => {
            console.log("\n==================================================");
            console.log(`Week 6 Test Summary: ${passed} Passed, ${failed} Failed`);
            console.log("==================================================");
            process.exit(failed === 0 ? 0 : 1);
        });
    }
}

runWeek6Tests();
