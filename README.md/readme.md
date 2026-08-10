# College Complaint Management System

## Project Overview

A web-based system where college students can submit complaints and track their resolution. The platform will eventually support students, staff, and administrators, with role-based access, complaint categorization, status tracking, and a complete resolution history.

## Problem Statement

Colleges often lack a centralized, transparent system for students to report issues. Complaints handled through informal channels (email, verbal reports, paper forms) get lost, are hard to track, and lack accountability. This system solves that by providing a structured, traceable complaint workflow.

## Objectives

- Provide students with an easy way to submit and track complaints online.
- Establish a structured complaint categorization system.
- Enable staff and administrators to manage and resolve complaints efficiently.
- Maintain a transparent history of complaint status and resolution.
- Implement secure, role-based access control.

## Planned Features

- Student login
- Complaint submission
- Complaint categories
- Status tracking
- Admin assignment
- Comments and updates
- Resolution history
- Role-based authentication (Students, Staff, Administrators)

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL (planned)
- **Version Control:** Git and GitHub
- **Package Management:** npm

## Week 1 Progress

Week 1 focuses on Node.js, NPM, server-side scripting, project requirements, GitHub setup, and the initial Express server.

Completed in Week 1:

- Project selected and requirements documented (`docs/requirements.md`)
- Node.js project initialized with npm
- Express installed and configured
- Basic Express server built with `GET /`, `GET /api/health`, and `GET /api/project` routes
- `npm start` and `npm run dev` (nodemon) scripts configured
- Git repository initialized with an initial commit

## Installation Instructions

1. Clone or download this repository.
2. Install dependencies:
   ```
   npm install
   ```

## How to Run the Server

Start the server normally:

```
npm start
```

Start the server in development mode (auto-restarts on file changes via nodemon):

```
npm run dev
```

By default the server runs on port `3000`. To use a different port, set the `PORT` environment variable:

```
PORT=4000 npm start
```

The server will be available at: `http://localhost:3000`

## API Endpoints

| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| GET    | `/`            | Returns API running status message |
| GET    | `/api/health`  | Returns server health status       |
| GET    | `/api/project` | Returns basic project information  |

### Example Responses

`GET /`

```json
{
  "message": "College Complaint Management System API is running",
  "status": "success",
  "week": 1
}
```

`GET /api/health`

```json
{
  "status": "OK",
  "message": "Server is healthy"
}
```

`GET /api/project`

```json
{
  "name": "College Complaint Management System",
  "version": "1.0.0",
  "stage": "Week 1"
}
```

## Project Structure

```
college-complaint-management/
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Future Development Plan

- **Week 2:** MySQL database design and connection, schema for users/complaints/categories
- **Week 3:** Student login, role-based authentication, complaint submission
- **Week 4:** Complaint categories, status tracking, admin assignment
- **Week 5:** Comments and updates, resolution history
- **Week 6:** Admin, staff, and student dashboards
- **Week 7:** Testing, bug fixes, UI polish
- **Week 8:** Final deployment and documentation
