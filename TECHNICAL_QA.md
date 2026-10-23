# TeamSpace: Technical Defense & Architecture Q&A Guide
> **Comprehensive Question & Answer Reference for Technical Evaluations, System Reviews, and Hackathon Defense**

---

## 1. System Architecture & High-Level Design

### Q1: What architectural pattern does TeamSpace follow, and what are its boundaries?
**Answer**:
TeamSpace follows a **decoupled Client-Server Architecture** adhering to **RESTful principles**:
- **Client Tier**: Single Page Application (SPA) built with React and Vite. It handles presentation, optimistic user interactions, client-side routing, and session state. The client is treated as an *untrusted environment*.
- **API Tier**: Express.js server providing a stateless REST API under `/api`. All business rules, role-based authorization gates, optimistic concurrency checks, and email dispatch triggers reside here.
- **Data Tier**: MongoDB with Mongoose ODM providing persistent document storage, unique indexes, and atomic compare-and-swap update operations.

### Q2: Why did you choose a REST API over GraphQL or gRPC?
**Answer**:
1. **Predictability & Caching**: REST provides standard HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`) and well-understood status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`).
2. **Optimistic Concurrency Alignment**: Standard `HTTP 409 Conflict` semantics map natively to REST specifications for state collision handling.
3. **Low Complexity Overhead**: Eliminates the need for schema stitching, complex resolvers, query depth limiting (common security hazards in GraphQL), or binary proto compilers required by gRPC.

---

## 2. Authentication, Authorization & Security (RBAC)

### Q3: How is authentication implemented, and how are user sessions maintained?
**Answer**:
Authentication uses **JSON Web Tokens (JWT)** signed with HMAC-SHA256 (`HS256`):
- Upon successful login via `POST /api/auth/login`, the server generates a token containing payload `{ sub: user._id, iat, exp }` with an 8-hour expiry.
- Passwords are salted and hashed using **bcrypt** with a work factor of **12 rounds**, preventing rainbow table and dictionary attacks.
- The client stores the JWT in `localStorage` and transmits it in the `Authorization: Bearer <token>` HTTP header.
- Middleware `requireAuth` extracts the token, verifies the signature against `JWT_SECRET`, checks if the user exists and is still `active: true` in MongoDB, and attaches `req.user`. If deactivated, access is revoked immediately on the very next request.

### Q4: If a user inspects the DOM and enables a disabled button or crafts a raw curl request, how does the system prevent unauthorized actions?
**Answer**:
**Zero-trust server-side enforcement**. Frontend disabling is purely for User Experience (UX), never security:
- Every protected route is guarded by server middleware:
  - `requireAuth`: Validates JWT authenticity and account active status.
  - `allowRoles('admin')`: Restricts administrative routes (e.g., user creation, project deletion).
  - `getProjectAccess(user, projectId)`: Resolves whether the user is an Admin, a Project Manager, a Project Member, or an outside user.
- Even if a Team Member sends a `PATCH /api/projects/:id` request via `curl` with a valid JWT, `getProjectAccess` checks their role and returns `HTTP 403 Forbidden` (`Only Admins or assigned Project Managers can update this project`).

### Q5: How does the system handle dual-level roles (System Roles vs Project Roles)?
**Answer**:
TeamSpace implements a **hierarchical two-tier RBAC**:
1. **Global System Role** (`User.role`): `admin`, `project_manager`, `team_member`, `viewer`.
   - `admin` has global supervisory access across all projects, users, and audit logs.
2. **Project-Level Role** (`Project.members[i].role`): `manager`, `member`, `viewer`.
   - A global `project_manager` can only manage tasks and members in projects they own or where they are explicitly assigned as `manager`.
   - A `team_member` can only access projects where their `_id` appears in the `members` array.
   - A `viewer` has read-only access and cannot mutate tasks or post comments, regardless of project assignment.

### Q6: How does Google OAuth 2.0 work under the hood?
**Answer**:
TeamSpace uses **Google Identity Services (GSI)**:
1. The frontend initializes `window.google.accounts.id` with the Client ID (`816385652364-7khs3otudctkk4egba9ttsia24nt50nm.apps.googleusercontent.com`).
2. When the user completes the Google prompt, Google returns a cryptographically signed OpenID Connect **JWT credential**.
3. The frontend sends this credential and the chosen initial role to `POST /api/auth/google`.
4. The backend verifies the credential against Google's token verification endpoint (`https://oauth2.googleapis.com/tokeninfo?id_token=...`), verifying `aud === GOOGLE_CLIENT_ID`, signature, and expiration.
5. If the user already exists by email, their `googleId` is linked and a TeamSpace JWT is issued. If new, an account is created with the verified name and email and their selected role.

---

## 3. Concurrency Control & Data Consistency (OCC)

### Q7: Explain Optimistic Concurrency Control (OCC) and how TeamSpace prevents "Lost Updates".
**Answer**:
In multi-user collaborative systems, two users (e.g., Alice and Bob) can load the same task at the same time:
- Without OCC, if Alice changes status to "In Progress" and Bob changes status to "Blocked", whoever clicks Save last overwrites the other person's changes silently.
- **TeamSpace OCC Implementation**:
  1. Every task document in MongoDB has a numeric `version` field (initialized at `0`).
  2. When the client loads a task, it receives `version: 0`.
  3. When sending an update, the client MUST supply `expectedVersion: 0`.
  4. The server runs an atomic MongoDB command:
     ```javascript
     const updated = await Task.findOneAndUpdate(
       { _id: taskId, version: expectedVersion },
       { $set: patch, $inc: { version: 1 } },
       { new: true, runValidators: true }
     );
     ```
  5. If Alice's request arrives first, MongoDB matches `{ _id: taskId, version: 0 }`, updates fields, and increments `version` to `1`.
  6. When Bob's request arrives with `expectedVersion: 0`, MongoDB searches for `{ _id: taskId, version: 0 }`. Since version is now `1`, **zero documents match**.
  7. The server detects `updated === null`, fetches the fresh document from the database, and responds with:
     ```json
     {
       "error": {
         "code": "CONFLICT",
         "message": "Concurrent edit conflict: this task was modified by another user (now at version 1). Your edit was based on version 0.",
         "submittedVersion": 0,
         "currentVersion": 1,
         "latest": { ... }
       }
     }
     ```
  8. The HTTP status is `409 Conflict`. The client displays an interactive **Conflict Resolution Modal** showing the diff between Bob's edit and Alice's saved state.

### Q8: Why use Optimistic Concurrency Control instead of Pessimistic Locking (e.g., `SELECT ... FOR UPDATE` or mutex locks)?
**Answer**:
1. **High Availability & No Abandoned Locks**: In web apps, users frequently open an edit modal and walk away, close the laptop lid, or lose Wi-Fi. Pessimistic locks lock the row until a timeout expires, frustrating other teammates.
2. **Zero Read Overhead**: OCC does not block readers. Reads require zero lock acquisition, maximizing read throughput.
3. **Distributed Scale**: In a clustered backend, pessimistic locks require centralized lock managers (like Redis Redlock) with distributed deadlock detection. OCC leverages the storage engine's native single-document atomicity.

---

## 4. Database Design & Data Modeling

### Q9: Why did you choose MongoDB and Mongoose over PostgreSQL/MySQL?
**Answer**:
1. **Hierarchical Project Representation**: In TeamSpace, a Project contains an array of `members` with embedded roles (`role`, `addedAt`). In relational databases, this requires a junction table with extra joins on every project query.
2. **Lock-Free Atomic Increment**: MongoDB's `$inc` operator within `findOneAndUpdate` provides an atomic compare-and-swap primitive directly inside the query execution engine.
3. **Schema Evolution with Mongoose**: Mongoose schemas enforce type validation, enum constraints, required fields, and default values while maintaining flexible JSON payloads for rich deliverables.

### Q10: What indexes exist in your database, and why are they necessary?
**Answer**:
- `User.email`: Unique index (`{ email: 1 }, { unique: true }`). Guarantees no two accounts can share an email and enables $O(1)$ login lookups.
- `Project.members.user + status`: Compound index (`{ 'members.user': 1, status: 1 }`). Optimizes queries where non-admin users fetch all active projects they belong to.
- `Task.project + status`: Compound index (`{ project: 1, status: 1 }`). Accelerates Kanban board rendering by indexing all tasks for a specific workspace partitioned by column.
- `Task.assignee`: Single index (`{ assignee: 1 }`). Optimizes the "My Tasks" view to immediately retrieve all deliverables assigned to the authenticated user.

---

## 5. Automated Email Notifications (Feature 1)

### Q11: How does the Automated Email Notification pipeline work without degrading API response times?
**Answer**:
The email notification pipeline operates **asynchronously via event deferral (`setImmediate`)**:
1. When a task is created or updated, the database write occurs first and commits synchronously.
2. The HTTP response is prepared and sent to the client, or `setImmediate` is invoked to queue the email dispatch onto the Node.js event loop's check phase.
3. The background job:
   - Evaluates whether the assignee was newly assigned or reassigned (`newAssigneeId !== previousAssigneeId`).
   - If reassigned, queries the assignee's email and project name.
   - Renders the custom HTML and plaintext templates adhering strictly to challenge specs (task title, project name, assigner name, priority, due date, direct link).
   - Calls `nodemailer.sendMail(...)`.
   - Records the dispatched email into an in-memory ring buffer (`recentEmails`) with recipient, subject, preview URL, and timestamp.
4. **Resilience**: If the SMTP server experiences network latency or failure, the API request does **not** hang or fail for the user; error logging catches the issue cleanly.

### Q12: How does the system handle email delivery in development vs production?
**Answer**:
- **Production**: If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are provided in `.env`, Nodemailer connects to the configured production relay (e.g., SendGrid, Postmark, AWS SES, or Gmail SMTP).
- **Development & Hackathon Evaluation**: If SMTP credentials are blank, the service automatically calls `nodemailer.createTestAccount()` on startup to provision a sandbox account on **Ethereal Email**. It generates real RFC 5322 MIME messages and provides public preview URLs (`https://ethereal.email/message/...`) viewable in any browser without requiring external mailbox logins.

---

## 6. Input Validation & Error Handling

### Q13: How does TeamSpace handle input validation and prevent injection attacks?
**Answer**:
1. **Schema Validation via Zod**: Every request body is validated against explicit Zod schemas in middleware before reaching route controllers:
   - `createTaskSchema`: Enforces title string length (1–140 chars), priority enums (`low`, `medium`, `high`, `urgent`), ISO date parsing, and MongoDB ObjectId formats.
   - `updateTaskSchema`: Enforces `expectedVersion` as a non-negative integer.
2. **NoSQL Injection Prevention**: Mongoose cast checking and parameterized queries ensure query objects cannot be hijacked by injecting `$gt` or `$ne` operators.
3. **XSS Protection**: React escapes all JSX text interpolations by default. For URL fields like `liveDemoUrl` and `githubUrl`, links are validated with `http:` / `https:` protocols and rendered with `rel="noopener noreferrer"` and `target="_blank"`.

### Q14: What standard HTTP status codes are used across the API?
**Answer**:
- `200 OK`: Successful read or update.
- `201 Created`: Successful creation of project, task, user, or comment.
- `204 No Content`: Successful deletion (e.g., comment deletion).
- `400 Bad Request`: Malformed JSON or invalid query params.
- `401 Unauthorized`: Missing, expired, or invalid JWT token.
- `403 Forbidden`: Authenticated user lacks RBAC permissions for the resource.
- `404 Not Found`: Target project, task, or user does not exist.
- `409 Conflict`: Optimistic concurrency version mismatch.
- `422 Unprocessable Entity`: Zod schema validation failure or semantic rule violation (e.g., assigning a task to a non-member).
- `500 Internal Server Error`: Unhandled server exceptions (caught by global error middleware).

---

## 7. Frontend Engineering & User Experience

### Q15: Why choose Vanilla CSS over Tailwind or a component library like MUI?
**Answer**:
1. **Ultra-Fast Performance**: The entire application stylesheet is a single, minified ~25 KB CSS file (`styles.css`). Zero runtime CSS-in-JS overhead (no Emotion or styled-components parse cost).
2. **Bespoke Enterprise Aesthetic**: Allows exact pixel control over design tokens, custom glassmorphism layers, dark/light contrast, and fluid micro-animations (e.g., hover lifts, active states, glowing badges) without wrestling with CSS library overrides.
3. **Zero Build Bottlenecks**: Avoids Tailwind PostCSS compile times, enabling instant Hot Module Replacement (HMR) under Vite.

### Q16: How is drag-and-drop implemented in the Kanban boards?
**Answer**:
The Kanban Desk and Project Detail views use the native **HTML5 Drag and Drop API** (`draggable`, `onDragStart`, `onDragOver`, `onDrop`):
- Eliminates bloated external drag-and-drop libraries (saving ~100 KB in bundle size).
- When a task card is picked up, its payload (`task`) is stored in component state.
- Dropping on a target column triggers `onChangeStatus(task, newColumnId)`.
- Updates occur optimistically in UI state and are verified atomically against the backend with `expectedVersion`. If a 409 conflict occurs, the board reverts cleanly and prompts the user.

---

## 8. Scalability, Monitoring & Future Extensions

### Q17: If TeamSpace grew from 100 users to 100,000 users, what architectural changes would you implement?
**Answer**:
1. **Database Tier**:
   - Enable a **MongoDB Replica Set** with Read Preferences set to `secondaryPreferred` for read-heavy operations (e.g., fetching project overviews).
   - Shard the `tasks` collection using a compound shard key `{ project: 1, _id: 1 }`.
2. **Background Job Queue**:
   - Migrate in-process `setImmediate` email dispatching to a dedicated Redis-backed queue like **BullMQ** or **RabbitMQ**. This provides retries with exponential backoff, rate limiting, and failure dead-letter queues.
3. **Real-Time Collaboration**:
   - Add **WebSockets (Socket.io)** backed by a **Redis Pub/Sub adapter** to broadcast task status changes and comments to all active viewers in real time.
4. **Distributed Caching**:
   - Cache frequently accessed project metadata and user profiles in **Redis** with a 15-minute TTL and cache invalidation on update.

---

## 9. Quick-Fire Summary for Hackathon Judges

| Evaluation Pillar | Implementation in TeamSpace |
|---|---|
| **Architecture** | Cleanly decoupled Express API + React Vite SPA with persistent MongoDB document store. |
| **Security** | 4-tier server-side RBAC, bcrypt password hashing (12 rounds), Google OAuth 2.0 (GSI), JWT token auth. |
| **Data Integrity** | Atomic compare-and-swap Optimistic Concurrency Control (OCC) with `HTTP 409 Conflict` resolution. |
| **Feature 1** | Automated email alerts for task assignment and completion via Nodemailer + Ethereal sandbox + in-app audit log. |
| **Feature 2** | Live Demo and GitHub repository URLs verified and rendered on project cards and workspace headers. |
| **Code Quality** | Strict Zod validation schemas, unified error response envelope, modular component design, zero build errors. |
