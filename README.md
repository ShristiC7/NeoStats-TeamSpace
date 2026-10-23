# Teamspace — Collaborative Project Management Platform

A local-first MERN implementation of the NeoStats Full Stack Engineering Hackathon brief. The brief recommends PostgreSQL, but allows any locally running database; this implementation uses **local MongoDB** as requested.

## Features
- JWT login and server-side role authorization (Admin, Project Manager, Team Member, Viewer)
- Project CRUD, archive, project membership and project-level roles
- Task CRUD, assignment, status changes, filters and pagination
- Task comments (create/read/delete with authorization)
- Optimistic concurrency: tasks use `version`; updates require `expectedVersion`; stale writes return HTTP 409
- Seeded demo users, projects, tasks and comments
- Responsive dashboard UI and API error handling

## Requirements
- Node.js 22+
- npm
- MongoDB Community Server running locally (default URI `mongodb://127.0.0.1:27017/neostats_pm`)
- Git (recommended)

## 1. Configure environment
Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`.
Set a unique `JWT_SECRET` in `server/.env`.

## 2. Install dependencies
From the repository root:
```bash
npm install
npm run install:all
```
If the root install does not install workspace packages on your npm version, run `npm install` inside both `server` and `client`.

## 3. Start MongoDB
Start the MongoDB service using the method for your OS. Confirm it is listening on `127.0.0.1:27017`.
No Atlas/cloud database is used.

## 4. Seed demo data
```bash
npm run seed
```
This resets the seeded demo records and creates the accounts below. Do not use these demo passwords outside local development.

| Role | Email | Password |
|---|---|---|
| Admin | admin@teamspace.local | Admin123! |
| Project Manager | manager@teamspace.local | Manager123! |
| Team Member | member@teamspace.local | Member123! |
| Viewer | viewer@teamspace.local | Viewer123! |

## 5. Run the app
In one terminal:
```bash
npm run dev:server
```
In another terminal:
```bash
npm run dev:client
```
Open http://localhost:5173. API health check: http://localhost:5000/api/health.

## Architecture
- `client/`: React + Vite UI; all API calls go through `src/lib/api.js`.
- `server/`: Express API; routes → authentication/authorization middleware → controllers → Mongoose models.
- MongoDB collections: `users`, `projects`, `tasks`, `comments`. Project membership is embedded in `projects.members`; tasks reference project and assignee IDs; comments reference task and author IDs.
- Role checks happen on the server. UI hiding is convenience only.
- Task optimistic concurrency uses atomic conditional updates on `_id` and `version`; if the expected version does not match, API returns `409 CONFLICT`.
- Passwords are bcrypt-hashed; JWTs expire; inactive accounts cannot log in.

## Main API routes
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/users`, `PATCH /api/users/:id`, `PATCH /api/users/:id/deactivate` (Admin)
- `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` (delete is archive)
- `POST/DELETE /api/projects/:id/members/:userId`, `PATCH /api/projects/:id/members/:userId`
- `GET/POST /api/projects/:projectId/tasks`, `GET/PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/tasks/:id/comments`, `DELETE /api/comments/:id`

## Important implementation notes
- This is a hackathon-ready starter implementation, not a security-audited production service. For production, add rate limiting, refresh-token/session strategy, audit logs, CSRF protection if cookie auth is adopted, stronger input schemas, and integration tests.
- For task updates, send `{ ..., "expectedVersion": 0 }` using the task's current `version`. Every successful update increments `version`.
- API returns JSON errors shaped like `{ "error": { "code": "FORBIDDEN", "message": "..." } }`.
