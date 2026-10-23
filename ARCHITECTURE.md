# System Architecture Note — Teamspace

## 1. System Overview & Context

Teamspace is structured with a strict decoupling of frontend presentation from backend persistence and business rules:

```
┌──────────────────────────────────────────────┐
│        Frontend: React + Vite (:5173)        │
│  - App Router / Tabbed Navigation            │
│  - Kanban Board & Table Views                │
│  - Concurrency Conflict Visualizer (OCC)     │
│  - Hackathon 1-Click Role Switcher           │
└──────────────────────┬───────────────────────┘
                       │ HTTP REST (JSON) + Bearer JWT
                       ▼
┌──────────────────────────────────────────────┐
│        Backend API: Express.js (:5000)       │
│  - Centralized Error & CORS Middleware       │
│  - Authentication: JWT + bcrypt (12 rounds)  │
│  - Role-Based Access Control (RBAC)          │
│  - Request Validation via Zod Schemas        │
│  - Optimistic Concurrency Manager (OCC)      │
└──────────────────────┬───────────────────────┘
                       │ Native Driver / Mongoose
                       ▼
┌──────────────────────────────────────────────┐
│   Database: Local MongoDB (Port 27017)       │
│  - Collections: users, projects, tasks,      │
│    comments                                  │
│  - Compound indexes on access patterns       │
└──────────────────────────────────────────────┘
```

---

## 2. Data Model Design (MongoDB Collections)

### Collection: `users`
- `_id`: ObjectId (Primary key)
- `name`: String, required, max 80 chars
- `email`: String, unique, lowercase, trimmed
- `passwordHash`: String, bcrypt hash (excluded from default projections)
- `role`: Enum `['admin', 'project_manager', 'team_member', 'viewer']`
- `active`: Boolean (default: true)
- `timestamps`: `createdAt`, `updatedAt`

### Collection: `projects`
- `_id`: ObjectId
- `name`: String, required, max 120 chars
- `description`: String, max 2000 chars
- `status`: Enum `['active', 'archived']` (default: 'active')
- `owner`: ObjectId -> ref `User`
- `members`: Embedded Subdocument Array:
  - `user`: ObjectId -> ref `User`, required
  - `role`: Enum `['manager', 'member', 'viewer']` (project-scoped role)
  - `addedAt`: Date (default: now)
- `timestamps`: `createdAt`, `updatedAt`
- **Index**: `{'members.user': 1, status: 1}` for fast member lookups.

### Collection: `tasks`
- `_id`: ObjectId
- `project`: ObjectId -> ref `Project`, indexed
- `title`: String, required, max 180 chars
- `description`: String, max 4000 chars
- `status`: Enum `['todo', 'in_progress', 'blocked', 'done']`
- `priority`: Enum `['low', 'medium', 'high', 'urgent']`
- `assignee`: ObjectId -> ref `User`, nullable
- `createdBy`: ObjectId -> ref `User`, required
- `dueDate`: Date, nullable
- `version`: Number, integer, default 0 (concurrency token)
- `timestamps`: `createdAt`, `updatedAt`
- **Indexes**: `{ project: 1, status: 1 }`, `{ assignee: 1, status: 1 }`

### Collection: `comments`
- `_id`: ObjectId
- `task`: ObjectId -> ref `Task`, indexed
- `project`: ObjectId -> ref `Project`
- `author`: ObjectId -> ref `User`, required
- `body`: String, required, max 2000 chars
- `timestamps`: `createdAt`, `updatedAt`

---

## 3. Optimistic Concurrency Control (OCC) Architecture

To satisfy Requirement 6 of the Hackathon Brief ("Concurrent Updates: Two users may open and edit the same task simultaneously..."):

### Data Flow for Task Mutation:
```
User A (opens task at v0) ───────────┐
                                    │
User B (opens task at v0) ─────┐    │
                               │    ▼
                               │  User A saves change:
                               │  findOneAndUpdate({ _id, version: 0 }, { $set, $inc: { version: 1 } })
                               │  ==> SUCCESS: Database version moves to v1
                               │
                               ▼
User B saves change with expectedVersion = 0:
findOneAndUpdate({ _id, version: 0 }, ...)
==> NO MATCH (version in DB is already 1)
==> Server fetches latest state and returns HTTP 409 Conflict:
    {
      error: {
        code: 'CONFLICT',
        message: 'Concurrent edit conflict...',
        currentVersion: 1,
        submittedVersion: 0,
        latest: { ... }
      }
    }
==> Frontend receives 409 and presents interactive conflict banner.
```

---

## 4. Authorization & Security Architecture

1. **Authentication**: Users log in using `POST /api/auth/login`. On successful bcrypt comparison and active account verification, a signed JSON Web Token (JWT) is issued with an 8-hour expiration.
2. **Global Authorization (`requireAuth`, `allowRoles`)**:
   - Every protected route requires a valid `Authorization: Bearer <token>` header.
   - Deactivated accounts are rejected at the authentication middleware level.
3. **Project Scoped Authorization (`getProjectAccess`)**:
   - `admin`: Always has full access across all projects, tasks, and users.
   - `project_manager`: Must be a project member with `role === 'manager'` to mutate project details, manage members, and create/delete tasks.
   - `team_member`: Can read tasks in their projects, update status of assigned tasks, and participate in comments discussions.
   - `viewer`: Strictly read-only access.
4. **Input Validation**: All incoming request bodies are validated against strict Zod schemas before reaching business logic controllers.
