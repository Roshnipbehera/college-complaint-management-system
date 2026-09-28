# Week 8: Structured Logging & Debugging - Demonstration

## 1. Overview
The College Complaint Management System features a structured logging subsystem (`utils/logger.js` and `middleware/requestLogger.js`).
All HTTP requests, response statuses, execution durations, client IP addresses, and user contexts are tracked.
Errors are captured with stack traces in development and recorded to disk.

---

## 2. Log File Architecture

The system segregates logs into two persistent log sinks in the `logs/` directory:
- `logs/access.log`: Comprehensive ledger of all HTTP requests, informational system events, warnings, and error occurrences.
- `logs/error.log`: Dedicated error file recording exceptions, uncaught rejections, database errors, and stack traces.

---

## 3. Sample Log Demonstration Entries

### 3.1 Successful Authenticated Request (INFO):
```json
[2026-09-28T07:45:20.124Z] [INFO] GET /api/complaints - 200 (13ms) {
  "requestId": "7V9L5GJV",
  "method": "GET",
  "url": "/api/complaints",
  "status": 200,
  "duration": "13ms",
  "ip": "::1",
  "user": "STUDENT:1"
}
```

### 3.2 Complaint Creation Log (INFO):
```json
[2026-09-28T07:45:20.210Z] [INFO] POST /api/complaints - 201 (44ms) {
  "requestId": "ZDHORZTT",
  "method": "POST",
  "url": "/api/complaints",
  "status": 201,
  "duration": "44ms",
  "ip": "::1",
  "user": "STUDENT:1"
}
```

### 3.3 Validation Error Interception (WARN):
```json
[2026-09-28T07:45:21.050Z] [WARN] POST /api/auth/register - 400 (19ms) {
  "requestId": "1J9UEJKY",
  "method": "POST",
  "url": "/api/auth/register",
  "status": 400,
  "duration": "19ms",
  "ip": "::1",
  "user": "guest"
}
```

### 3.4 Rate Limit Trigger (WARN):
```json
[2026-09-28T07:45:22.312Z] [WARN] POST /api/auth/login - 429 (1ms) {
  "requestId": "8CMUK7F0",
  "method": "POST",
  "url": "/api/auth/login",
  "status": 429,
  "duration": "1ms",
  "ip": "::1",
  "user": "guest"
}
```

### 3.5 404 Route Not Found (WARN):
```json
[2026-09-28T07:45:22.950Z] [WARN] GET /api/nonexistent-route - 404 (3ms) {
  "requestId": "K0A77QTQ",
  "method": "GET",
  "url": "/api/nonexistent-route",
  "status": 404,
  "duration": "3ms",
  "ip": "::1",
  "user": "guest"
}
```

---

## 4. Credential Redaction & Privacy Defense

To ensure compliance with data protection standards, the logger automatically intercepts and sanitizes sensitive data fields (`password`, `password_hash`, `token`, `jwt`, `cookie`, `authorization`).
When payload metadata is passed to the logger, sensitive values are replaced with `[REDACTED]` prior to formatting or writing to disk.

Example of sanitized logger input:
```json
{
  "email": "student@college.com",
  "password": "[REDACTED]",
  "token": "[REDACTED]"
}
```
This guarantees that student passwords, staff tokens, and session credentials never leak into server log files or console streams.
