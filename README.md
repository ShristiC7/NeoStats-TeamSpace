# Teamspace — Collaborative Project Management Platform
> **NeoStats Full Stack Engineering Hackathon — Production-Ready Submission**  
> Built with React (Vite) + Node.js (Express) + MongoDB (Mongoose) + Zod + Vitest.

---

## 🌟 Executive Overview & Challenge Brief

Teamspace is a multi-user collaborative project management web application built strictly to satisfy the **NeoStats Full Stack Engineering Hackathon Challenge Brief**:

- **Objective**: Build a multi-user collaborative project management platform where users with different roles can manage projects, tasks, team members, and task discussions.
- **Strict Server-Side RBAC**: Permissions are verified on the backend across all API endpoints, not merely hidden in the UI.
- **Optimistic Concurrency Control (OCC)**: Atomic conditional updates detect stale task writes and return `HTTP 409 Conflict`, guiding the user through an interactive conflict resolution flow.
- **Local-First Architecture**: Runs entirely locally on Node.js and MongoDB Community Server without external cloud dependencies.
- **Automated Verification**: Full automated test suite built with **Vitest & Supertest** covering RBAC, OCC, comments, and authentication.

---

## 👥 User Roles & Responsibilities

| Role | Responsibilities | Default Demo Account |
|---|---|---|
| **Admin** | Full system administration; manage users (create, edit, deactivate); create/delete projects; assign project managers; view all projects. | `admin@teamspace.local` / `Admin123!` |
| **Project Manager** | Manage assigned projects; add/remove team members; change project-level roles; create/update/delete tasks; assign tasks; change task status. | `manager@teamspace.local` / `Manager123!` |
| **Team Member** | View projects they belong to; view assigned tasks; update task status; post comments in task discussions. | `member@teamspace.local` / `Member123!` |
| **Viewer** | Read-only access to projects and tasks. Cannot mutate tasks, create projects, or post comments. | `viewer@teamspace.local` / `Viewer123!` |

---

## ⚡ Concurrency & Conflict Detection (OCC)

When multiple users open and modify the same task simultaneously:
1. Every task document stores an integer `version` (initialized at `0`).
2. Client submissions must include `expectedVersion`.
3. The server performs an atomic **compare-and-swap** operation:
   ```javascript
   const updated = await Task.findOneAndUpdate(
     { _id: taskId, version: expectedVersion },
     { $set: patch, $inc: { version: 1 } },
     { new: true, runValidators: true }
   );
   ```
4. If another user committed an update first, the version in the database is already incremented. `findOneAndUpdate` returns `null`.
5. The API immediately responds with **`HTTP 409 Conflict`**:
   ```json
   {
     "error": {
       "code": "CONFLICT",
       "message": "Concurrent edit conflict: this task was modified by another user (now at version 2). Your edit was based on version 1.",
       "submittedVersion": 1,
       "currentVersion": 2,
       "latest": { ... }
     }
   }
   ```
6. **UI Conflict Resolution Flow**: The UI catches the 409 and displays an interactive warning banner with a **"Review & Load Latest State"** action button to prevent data loss.
7. **Simulation Tool**: In the Task Detail Drawer, an amber **"Test 409 Conflict"** button is provided so hackathon evaluators can test this mechanism live with a single click!

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla Modern CSS (Tailwind-compatible tokens with DM Sans & Manrope fonts).
- **Backend**: Node.js (v22+), Express.js (REST API, CORS, centralized error handling).
- **Database**: MongoDB Community Edition (local instance `127.0.0.1:27017/neostats_pm`).
- **Data Access & Modeling**: Mongoose with compound indexes, timestamps, and schema validation.
- **Request Validation**: Zod schemas for all mutations (`login`, `users`, `projects`, `tasks`, `comments`).
- **Authentication**: JWT with HMAC-SHA256 signatures, bcrypt (12 salt rounds) for password hashing.
- **Testing**: Vitest + Supertest for end-to-end HTTP API integration testing.

---

## 🚀 Getting Started (Local Setup)

### 1. Prerequisites
- **Node.js**: v22+ (`node -v`)
- **npm**: v10+ (`npm -v`)
- **MongoDB**: Locally running MongoDB Community Server on port `27017`

### 2. Environment Configuration
Create environment files:
- Backend: `server/.env` (configured with `PORT=5000`, `MONGODB_URI=mongodb://127.0.0.1:27017/neostats_pm`, `JWT_SECRET=local-dev-secret`, `CLIENT_ORIGIN=http://localhost:5173`)
- Frontend: `client/.env` (configured with `VITE_API_URL=http://localhost:5000/api`)

### 3. Install Dependencies
```bash
# From repository root:
npm run install:all
```

### 4. Seed Database
Populate the database with realistic demo projects, tasks, comments, and the 4 seeded role accounts:
```bash
npm run seed
```

### 5. Start Frontend and Backend
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Vite client starts at http://localhost:5173
```

---

## 🧪 Running Automated Tests

A comprehensive integration test suite verifies:
1. Health & Authentication (login validation, bad password rejection, inactive accounts).
2. RBAC rules (Viewer/Member cannot create projects [403], Admin can create projects).
3. Optimistic Concurrency Control (version increments to 1, stale version 0 rejected with HTTP 409).
4. Comments Collaboration (Viewer blocked [403], Project Member allowed [201], author deletion).

Run the tests anytime:
```bash
npm --prefix server run test
```
Result: **15 / 15 tests passing**.

---

## 📖 Main API Endpoint Reference

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System status and database readiness |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/users` | Admin only | Paginated user directory with role/status filters |
| `GET` | `/api/users/assignable` | Authenticated | Active users list for assignment and membership |
| `POST` | `/api/users` | Admin only | Create new user account |
| `PATCH` | `/api/users/:id` | Admin only | Update user name, role, or active status |
| `PATCH` | `/api/users/:id/toggle-active` | Admin only | Activate or deactivate user |
| `GET` | `/api/projects` | Authenticated | List accessible projects (Admin sees all) |
| `POST` | `/api/projects` | Admin only | Create new project workspace |
| `GET` | `/api/projects/:id` | Project Member / Admin | Project details and populated membership |
| `PATCH` | `/api/projects/:id` | Project Manager / Admin | Update project name or description |
| `DELETE` | `/api/projects/:id` | Project Manager / Admin | Archive project |
| `POST` | `/api/projects/:id/restore` | Project Manager / Admin | Restore archived project |
| `POST` | `/api/projects/:id/members/:userId` | Project Manager / Admin | Add member or change project role |
| `DELETE` | `/api/projects/:id/members/:userId` | Project Manager / Admin | Remove member from project |
| `GET` | `/api/projects/:projectId/tasks` | Project Member / Admin | List tasks (filtered by status/priority/search) |
| `POST` | `/api/projects/:projectId/tasks` | Project Manager / Admin | Create task (starts at version 0) |
| `GET` | `/api/tasks/:id` | Project Member / Admin | Inspect single task details |
| `PATCH` | `/api/tasks/:id` | Assignee / PM / Admin | Update task (requires `expectedVersion`) |
| `DELETE` | `/api/tasks/:id` | Project Manager / Admin | Delete task and cascading comments |
| `GET` | `/api/tasks/:id/comments` | Project Member / Admin | Fetch task comments thread |
| `POST` | `/api/tasks/:id/comments` | Non-Viewer Member / Admin | Post comment to task discussion |
| `DELETE` | `/api/comments/:commentId` | Comment Author / PM / Admin | Delete comment |

---

## 🎯 Acceptance Criteria Verification Checklist

- [x] **Challenge Brief**: Multi-user collaborative PM platform implemented and locally runnable.
- [x] **Separate Frontend & Backend**: Independent Vite client (5173) and Express REST API (5000).
- [x] **Persistent Database**: Local MongoDB Community Edition with Mongoose models and indexes.
- [x] **Server-Side Authorization**: Endpoints verify global role and project membership (401/403).
- [x] **Optimistic Concurrency Control**: Tasks increment versions atomically; stale edits trigger HTTP 409 Conflict.
- [x] **Interactive Conflict Resolution UI**: Conflict warning with Review & Load Latest State.
- [x] **Core CRUD for Users**: Admin can create, read, update, and deactivate users.
- [x] **Core CRUD for Projects**: Create, read, update, archive, and restore projects.
- [x] **Team Member Management**: Add member, remove member, change project role (Manager, Member, Viewer).
- [x] **Task Management**: Kanban Board and Table views; create, update, delete, filter, and assign tasks.
- [x] **Task Comments**: Real-time comments thread with role indicators and author deletion.
- [x] **Quick Role Switcher**: Top evaluation bar allows 1-click role switching between all 4 roles.
- [x] **Automated Tests**: 15 / 15 tests passing via Vitest and Supertest.
- [x] **Seed Script**: Reproducible seed script (`npm run seed`) creating clean demo data.
