# College Complaint Management System

A production-grade Node.js, Express, and MySQL backend system for managing student complaints, tracking grievance lifecycles, and enabling administrative triage in educational institutions.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js (v5)
- **Database**: MySQL (with `mysql2` connection pooling and parameterized queries)
- **Authentication**: `bcryptjs` (password hashing with 10 salt rounds) & `jsonwebtoken` (JWT)
- **Session Management**: HTTP-only, secure, SameSite cookies via `cookie-parser`
- **Security & Headers**: `helmet` (MIME sniffing prevention, X-Frame-Options, DNS prefetch control)
- **CORS**: Configured with origin whitelisting and credentials support
- **Rate Limiting**: `express-rate-limit` (Global API limiter & strict authentication brute-force defense)
- **Validation & Sanitization**: `express-validator` (declarative schema validation)
- **Logging**: Custom structured logger with file transports (`logs/access.log`, `logs/error.log`) and credential sanitization

---

## 📅 10-Week Project Progression

### Week 1: Project Initialization
- Project scope and requirements defined
- Node.js environment initialized (`package.json`)
- Basic HTTP server and Git repository setup

### Week 2: Asynchronous Programming & Modules
- Modular architecture implemented (`models/`, `routes/`, `middleware/`, `config/`)
- Asynchronous database operations using Promises & async/await

### Week 3: Express Routing & Controllers
- Express router integration
- RESTful routing conventions established for resources

### Week 4: Middleware & Error Handling
- Custom request logger middleware
- Initial complaint validation middleware
- Centralized error handling and 404 route-not-found handlers
- Static public file serving

### Week 5: MySQL Database Integration
- Connection pool configured in `config/db.js`
- Relational database schema with foreign key relationships (`database/schema.sql`)
- Health and database status endpoints (`/api/database/*`)

### ✅ Week 6: Complete CRUD APIs, Queries & Filtering
- **CRUD Operations**: Complete endpoints for Create, Read (all and by ID), Update (PUT/PATCH), and Delete complaints.
- **Query Filtering**: Multi-attribute filtering on `status`, `category_id`, `student_id`, `priority`, and text `search`.
- **Pagination**: Composable pagination via `limit`, `page`, and `offset` query parameters.
- **Categories API**: Active category listing and lookup (`/api/categories`).
- **Testing Evidence**: Documented in [`docs/API_TESTING_WEEK6.md`](docs/API_TESTING_WEEK6.md).

### ✅ Week 7: Authentication, Bcrypt & Sessions/Cookies
- **Password Hashing**: Cryptographic salt + hash using `bcryptjs` (10 rounds).
- **Dual-Channel Authentication**: Supports both HTTP-only session cookies and `Authorization: Bearer <token>` headers.
- **Auth Endpoints**: Register (`/api/auth/register`), Login (`/api/auth/login`), Logout (`/api/auth/logout`), Profile (`/api/auth/me`).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `STUDENT`, `STAFF`, and `ADMIN` roles.
- **Complaint Lifecycle Management**: Staff assignment (`/api/complaints/:id/assign`), status updates with remarks (`/api/complaints/:id/status`), and threaded comments (`/api/complaints/:id/comments`).
- **Security Review**: Comprehensive report in [`docs/SECURITY_REVIEW_WEEK7.md`](docs/SECURITY_REVIEW_WEEK7.md).

### ✅ Week 8: CORS, Security, Validation & Logging
- **CORS Hardening**: Strict origin whitelist, preflight handling, and `credentials: true` support.
- **HTTP Security Headers**: Implemented with `helmet` (`nosniff`, `SAMEORIGIN`).
- **Rate Limiting**:
  - Global API limiter: 100 requests per 15 minutes.
  - Auth route limiter: 15 attempts per 15 minutes to prevent brute-force attacks.
- **Robust Validation**: Schema validation and sanitization using `express-validator`.
- **Structured Logging**: Request tracking with timestamps, request IDs, IP addresses, duration, and automatic redaction of sensitive credentials.
- **Security Checklist**: Full checklist in [`docs/SECURITY_CHECKLIST_WEEK8.md`](docs/SECURITY_CHECKLIST_WEEK8.md).
- **Log Demonstration**: Detailed log output samples in [`docs/LOGS_DEMONSTRATION.md`](docs/LOGS_DEMONSTRATION.md).

### 🔮 Future Milestones
- **Week 9**: Frontend Integration (React/HTML client with interactive dashboard)
- **Week 10**: Cloud Deployment & Final Demonstration

---

## 🚀 Installation & Setup

### 1. Clone the repository:
```bash
git clone https://github.com/Roshnipbehera/college-complaint-management-system.git
cd college-complaint-management-system
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Configure Environment Variables:
Copy `.env.example` to `.env` and configure your MySQL credentials:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=college_complaint_management
DB_PORT=3306
JWT_SECRET=college_complaint_jwt_secret_key_super_secure_2026
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=15
```

### 4. Seed the Database:
Run the automatic database migration and seed script:
```bash
npm run seed
```
This automatically sets up all relational tables, seeds 11 complaint categories, and initializes demo accounts with bcrypt passwords:
- **Student**: `student@college.com` / `Student@123`
- **Staff**: `staff@college.com` / `Staff@123`
- **Admin**: `admin@college.com` / `Admin@123`

### 5. Start the Server:
```bash
# Start in production mode
npm start

# Or start in development mode with auto-reload
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 🧪 Running Test Suites

Automated test suites are included for every milestone:

```bash
# Run all test suites (Weeks 6, 7 & 8)
npm test

# Run Week 6 tests (CRUD & filtering)
npm run test:week6

# Run Week 7 tests (Auth, bcrypt & sessions)
npm run test:week7

# Run Week 8 tests (CORS, security, validation & logging)
npm run test:week8
```

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new student account | Public |
| `POST` | `/api/auth/login` | Log in and receive JWT + HTTP-only cookie | Public |
| `POST` | `/api/auth/logout` | Log out and invalidate auth cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/auth/staff` | List staff members for assignments | Staff / Admin |

### 📋 Complaints (`/api/complaints`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/complaints` | List complaints (filters: `status`, `category_id`, `priority`, `search`, `page`, `limit`) | Public / Authenticated |
| `GET` | `/api/complaints/:id` | Get single complaint by ID with history & comments | Public / Owner / Staff |
| `POST` | `/api/complaints` | Submit a new complaint | Student |
| `PUT` | `/api/complaints/:id` | Update complaint details | Owner / Staff / Admin |
| `PATCH` | `/api/complaints/:id` | Partial update of complaint fields | Owner / Staff / Admin |
| `DELETE` | `/api/complaints/:id` | Delete a complaint | Owner / Admin |
| `POST` | `/api/complaints/:id/assign` | Assign complaint to staff member | Staff / Admin |
| `POST` | `/api/complaints/:id/status` | Update complaint status with remarks | Staff / Admin |
| `POST` | `/api/complaints/:id/comments` | Add threaded comment/reply | Authenticated |

### 🏷️ Categories (`/api/categories`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/categories` | List active categories | Public |
| `GET` | `/api/categories/:id` | Get single category by ID | Public |
| `POST` | `/api/categories` | Create new category | Admin |

### 🗄️ Database Diagnostics (`/api/database`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/database/test` | Test database connection | Public |
| `GET` | `/api/database/status` | Get database status and server timestamp | Public |
| `GET` | `/api/database/tables` | List all tables in schema | Public |
| `GET` | `/api/database/info` | Get active database metadata | Public |
