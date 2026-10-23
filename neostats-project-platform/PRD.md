# Product Requirements Document — Teamspace
## 1. Product summary
Teamspace is a multi-user project-management web app for teams to manage projects, membership, tasks and task discussion in a shared workspace. It must demonstrate secure role-based access and conflict-safe editing.

## 2. Goals
1. Allow users to sign in and see only the projects/tasks their role permits.
2. Enable Admins to manage users and all projects.
3. Enable Project Managers to manage assigned projects, members and tasks.
4. Enable Team Members to view their projects, update assigned tasks and comment.
5. Enable Viewers to read projects/tasks without mutation permissions.
6. Reject unauthorized API calls even when requests bypass the UI.
7. Detect stale task updates and return HTTP 409 rather than silently overwrite.

## 3. Roles and permissions
| Capability | Admin | Project Manager | Team Member | Viewer |
|---|---:|---:|---:|---:|
| List all users | Yes | No | No | No |
| Create/deactivate users | Yes | No | No | No |
| Create projects | Yes | No | No | No |
| View all projects | Yes | Assigned only | Member only | Member only |
| Update/archive project | Yes | Assigned project | No | No |
| Manage project members | Yes | Assigned project | No | No |
| Create/delete tasks | Yes | Assigned project | No | No |
| Assign tasks | Yes | Assigned project | No | No |
| Update task details/status | Yes | Assigned project | Assigned task (limited fields) | No |
| Read tasks | Yes | Assigned project | Member project / assigned | Member project |
| Add comments | Yes | Assigned project | Member project / assigned task | No |
| Delete own comments | Yes | Assigned project | Own comment | No |

Project-level roles are `manager`, `member`, and `viewer`; global roles remain `admin`, `project_manager`, `team_member`, `viewer`.

## 4. Core workflows
### Authentication
- User submits email/password.
- Server verifies bcrypt hash and active status.
- Server issues a short-lived JWT.
- Frontend stores the token for local demo and sends `Authorization: Bearer <token>`.
- Protected routes return 401 for missing/invalid token.

### Project management
- Admin creates project with name, description, status and initial manager.
- Admin/manager adds members and sets project role.
- Project Manager edits project details, manages membership and archives the project.
- Users see projects according to membership/global role.

### Task management
- Authorized manager creates task with title, description, priority, due date and optional assignee.
- Team members see assigned tasks and update status.
- Task list supports status/search filtering and pagination.
- Each task carries integer `version`. Client includes `expectedVersion` with updates.
- Server updates only where `_id` and `version` match; conflict returns 409 and latest task payload.

### Comments
- Authorized team members/managers add comments to a task.
- Authorized users read comments.
- Admin/manager or comment author may delete a comment subject to project access.

## 5. Functional requirements
- FR-01 Login/logout and current-user retrieval.
- FR-02 Admin user list, create, update and deactivate.
- FR-03 Project create/read/update/archive.
- FR-04 Add/remove/change project membership role.
- FR-05 Task create/read/update/delete/assign/status update.
- FR-06 Create/read/delete comments.
- FR-07 Enforce role permissions on server routes.
- FR-08 Detect concurrent task edits with 409 conflict.
- FR-09 Seed reproducible demo accounts and sample records.
- FR-10 Clear loading, empty, validation and API-error states.

## 6. Non-functional requirements
- Local-only runtime; no cloud database/backend.
- Node.js 22+; MongoDB Community local instance.
- Passwords hashed using bcrypt.
- Environment variables used for secrets and connection strings.
- RESTful JSON API with semantic HTTP codes.
- Maintainable separation of routes, controllers, middleware and models.
- Responsive UI usable at laptop and mobile widths.

## 7. Acceptance criteria
- Each seeded account can sign in.
- Direct API calls from unauthorized roles receive 403.
- Inactive user cannot sign in.
- Task update with current version succeeds and increments version.
- Replaying an old expectedVersion returns 409 and does not overwrite latest data.
- Member can update status of assigned task but cannot change title/assignee.
- Viewer can read but cannot mutate.
- Fresh local database can be populated by one seed command.
- README allows a developer to run client and server locally.

## 8. Out of scope for hackathon MVP
Realtime sockets, file uploads, notifications/email, OAuth, billing, cloud deployment, advanced analytics and multi-tenant organizations.
