# Architecture — Teamspace

## System context
```text
Browser (React + Vite :5173)
  └─ fetch /api/* with Bearer JWT
       ↓ CORS
Express API (:5000)
  ├─ auth middleware: verify JWT + load active user
  ├─ authorization helpers: global role + project membership
  ├─ controllers: validation, business rules, status codes
  └─ Mongoose models
       ↓
Local MongoDB (127.0.0.1:27017 / neostats_pm)
```

## Data model
- **User**: name, email (unique, normalized), passwordHash, global role, active, timestamps.
- **Project**: name, description, status (`active|archived`), owner, members array `{ user, role, addedAt }`, timestamps.
- **Task**: project, title, description, status (`todo|in_progress|blocked|done`), priority (`low|medium|high|urgent`), assignee, creator, dueDate, version, timestamps.
- **Comment**: task, project, author, body, timestamps.

References are used for users/tasks to keep updates manageable. Project memberships are embedded because they are a small project-scoped list and need to be fetched with the project.

## Authorization approach
1. JWT authentication identifies the user; it does not itself grant access to a project.
2. Every project/task/comment controller checks global role and/or membership before returning or mutating data.
3. Admin is global override.
4. Project managers must be project members with manager role, except an Admin.
5. Team members can update only their assigned tasks and only limited fields.
6. Viewers are read-only.
7. Never rely on frontend-only conditional rendering for security.

## Concurrent updates
Task schema includes `version` (starts at 0). A write uses:
`findOneAndUpdate({ _id: taskId, version: expectedVersion }, { $set: fields, $inc: { version: 1 } }, { new: true, runValidators: true })`.
If no document matches, distinguish missing task (404) from stale version (409). This atomic compare-and-swap prevents last-write-wins data loss.

## API conventions
- JSON request and response bodies.
- `401` unauthenticated, `403` forbidden, `404` missing, `409` version conflict, `422` validation error, `500` unexpected error.
- List endpoints accept `page` and `limit`; cap limit at 100.
- Errors: `{ error: { code, message, details? } }`.

## Folder layout
```text
server/src/
  config/       database connection
  middleware/   authentication, error handling
  models/       User, Project, Task, Comment
  routes/       route composition
  controllers/  REST handlers
  utils/        access-control helpers
client/src/
  components/   app shell and UI components
  lib/          API client
  pages/        login and dashboard
```
