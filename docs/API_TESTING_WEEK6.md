# Week 6: Complete CRUD APIs, Queries & Filtering - Testing Evidence

## 1. Overview
In Week 6, the College Complaint Management System backend was expanded to provide full CRUD (Create, Read, Update, Delete) capabilities, multi-attribute query filtering, keyword search, and pagination.

## 2. Implemented Endpoints

| Method | Endpoint | Description | Access | Query Parameters |
|---|---|---|---|---|
| `GET` | `/api/complaints` | List complaints with filtering & pagination | Public / Student / Staff | `status`, `category_id`, `student_id`, `priority`, `search`, `limit`, `page`, `offset` |
| `GET` | `/api/complaints/:id` | Get single complaint by ID with history & comments | Public / Owner / Staff | None |
| `POST` | `/api/complaints` | Submit a new complaint | Student / Public | None |
| `PUT` | `/api/complaints/:id` | Full / partial update of complaint | Owner / Staff / Admin | None |
| `PATCH` | `/api/complaints/:id` | Partial update of complaint fields | Owner / Staff / Admin | None |
| `DELETE` | `/api/complaints/:id` | Delete a complaint | Owner / Admin | None |
| `GET` | `/api/categories` | List active complaint categories | Public | None |
| `GET` | `/api/categories/:id` | Get single category by ID | Public | None |

---

## 3. Query Filtering & Pagination Capabilities

The `GET /api/complaints` endpoint supports composable filtering:
- **Status Filter**: `GET /api/complaints?status=SUBMITTED`
- **Category Filter**: `GET /api/complaints?category_id=2`
- **Student Filter**: `GET /api/complaints?student_id=1`
- **Priority Filter**: `GET /api/complaints?priority=HIGH`
- **Keyword Search**: `GET /api/complaints?search=Projector` (searches `title`, `description`, `complaint_code`)
- **Pagination**: `GET /api/complaints?limit=10&page=1`
- **Compound Filters**: `GET /api/complaints?status=IN_PROGRESS&category_id=2&priority=URGENT&limit=5&page=1`

### Sample Response:
```json
{
  "success": true,
  "count": 1,
  "total": 4,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "complaint_id": 1,
      "complaint_code": "CMP-DEMO-001",
      "title": "Projector in Room 204 not working",
      "description": "The ceiling projector flickers continuously and fails to connect with HDMI in Room 204.",
      "priority": "MEDIUM",
      "status": "SUBMITTED",
      "student_id": 1,
      "category_id": 2,
      "created_at": "2026-09-28T07:11:15.000Z",
      "updated_at": "2026-09-28T07:11:15.000Z",
      "resolved_at": null,
      "closed_at": null,
      "student_name": "Demo Student",
      "student_email": "student@college.com",
      "category_name": "Infrastructure",
      "assigned_staff_name": null,
      "assigned_staff_email": null
    }
  ]
}
```

---

## 4. Automated Testing Evidence

All tests were executed using the automated test suite in `scripts/test-week6.js`.

### Test Execution Output:
```text
==================================================
WEEK 6: CRUD OPERATIONS, QUERIES & FILTERING TESTS
==================================================

[Test 1] List Categories (GET /api/categories)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Response success is true
  ✓ PASS: Returned 11 active categories

[Test 2] Create Complaint (POST /api/complaints)
  ✓ PASS: Status is 201 Created
  ✓ PASS: Response success is true
  ✓ PASS: Created Complaint ID: 4
  ✓ PASS: Title matches payload
  ✓ PASS: Priority set to HIGH

[Test 3] Read All Complaints (GET /api/complaints)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Total complaints count: 4
  ✓ PASS: Data is an array

[Test 4] Query Filtering by Status (GET /api/complaints?status=SUBMITTED)
  ✓ PASS: Status is 200 OK
  ✓ PASS: All returned complaints have status 'SUBMITTED'

[Test 5] Query Filtering by Category (GET /api/complaints?category_id=2)
  ✓ PASS: Status is 200 OK
  ✓ PASS: All returned complaints belong to category_id 2

[Test 6] Keyword Search (GET /api/complaints?search=Seminar)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Search found complaint with keyword 'Seminar'

[Test 7] Pagination (GET /api/complaints?limit=1&page=1)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Returned exact limit of 1 record
  ✓ PASS: Pagination metadata included

[Test 8] Read Single Complaint (GET /api/complaints/4)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Retrieved correct complaint ID
  ✓ PASS: Joined student name correctly
  ✓ PASS: Includes status history array

[Test 9] Update Complaint Partial (PUT /api/complaints/4)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Priority updated to URGENT
  ✓ PASS: Status updated to UNDER_REVIEW

[Test 10] Delete Complaint (DELETE /api/complaints/4)
  ✓ PASS: Status is 200 OK
  ✓ PASS: Delete response success is true
  ✓ PASS: Subsequent GET returns 404 Not Found

==================================================
Week 6 Test Summary: 30 Passed, 0 Failed (100% Pass Rate)
==================================================
```

---

## 5. Sample cURL Commands

### 1. Create a Complaint:
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "category_id": 2,
    "title": "Broken window in Room 301",
    "description": "Window glass is shattered, creating safety hazard during rain.",
    "priority": "HIGH"
  }'
```

### 2. Search Complaints:
```bash
curl -X GET "http://localhost:5000/api/complaints?search=window&status=SUBMITTED"
```

### 3. Update Complaint:
```bash
curl -X PUT http://localhost:5000/api/complaints/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "UNDER_REVIEW",
    "priority": "URGENT"
  }'
```

### 4. Delete Complaint:
```bash
curl -X DELETE http://localhost:5000/api/complaints/1
```
