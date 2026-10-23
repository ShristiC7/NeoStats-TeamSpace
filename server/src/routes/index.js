import { Router } from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  registerSchema,
  googleAuthSchema,
  createUserSchema,
  updateUserSchema,
  createProjectSchema,
  updateProjectSchema,
  memberRoleSchema,
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema
} from '../validators/schemas.js';

import { login, register, googleAuth, me } from '../controllers/auth.js';
import * as users from '../controllers/users.js';
import * as projects from '../controllers/projects.js';
import * as tasks from '../controllers/tasks.js';
import { getRecentEmails } from '../services/emailService.js';

const r = Router();

// Health Check
r.get('/health', (req, res) => res.json({ ok: true, service: 'teamspace-api', timestamp: new Date().toISOString() }));

// Auth Routes (Login, Role-based Register, Google OAuth)
r.post('/auth/login', validate(loginSchema), login);
r.post('/auth/register', validate(registerSchema), register);
r.post('/auth/google', validate(googleAuthSchema), googleAuth);
r.get('/auth/me', requireAuth, me);

// Users Management (Admin) & Assignable Users Lookup
r.get('/users/assignable', requireAuth, users.listAssignableUsers);
r.get('/users', requireAuth, allowRoles('admin'), users.listUsers);
r.post('/users', requireAuth, allowRoles('admin'), validate(createUserSchema), users.createUser);
r.patch('/users/:id', requireAuth, allowRoles('admin'), validate(updateUserSchema), users.updateUser);
r.patch('/users/:id/deactivate', requireAuth, allowRoles('admin'), (req, res, next) => {
  req.body.active = false;
  next();
}, users.updateUser);
r.patch('/users/:id/toggle-active', requireAuth, allowRoles('admin'), users.toggleActive);

// Projects Management
r.get('/projects', requireAuth, projects.listProjects);
r.post('/projects', requireAuth, allowRoles('admin'), validate(createProjectSchema), projects.createProject);
r.get('/projects/:id', requireAuth, projects.getProject);
r.patch('/projects/:id', requireAuth, validate(updateProjectSchema), projects.updateProject);
r.delete('/projects/:id', requireAuth, projects.archiveProject);
r.post('/projects/:id/restore', requireAuth, projects.restoreProject);
r.delete('/projects/:id/permanent', requireAuth, allowRoles('admin'), projects.deleteProject);

// Project Membership Management
r.post('/projects/:id/members/:userId', requireAuth, validate(memberRoleSchema), projects.addMember);
r.patch('/projects/:id/members/:userId', requireAuth, validate(memberRoleSchema), projects.changeMemberRole);
r.delete('/projects/:id/members/:userId', requireAuth, projects.removeMember);

// Tasks Management
r.get('/projects/:projectId/tasks', requireAuth, projects.projectTasks);
r.post('/projects/:projectId/tasks', requireAuth, validate(createTaskSchema), projects.createTask);
r.get('/tasks/:id', requireAuth, tasks.getTask);
r.patch('/tasks/:id', requireAuth, validate(updateTaskSchema), tasks.updateTask);
r.delete('/tasks/:id', requireAuth, tasks.deleteTask);

// Comments Management
r.get('/tasks/:id/comments', requireAuth, tasks.listComments);
r.post('/tasks/:id/comments', requireAuth, validate(createCommentSchema), tasks.createComment);
r.delete('/comments/:commentId', requireAuth, tasks.deleteComment);

// Recent Dispatched Emails Log (For Verification & Demo)
r.get('/system/recent-emails', requireAuth, (req, res) => {
  res.json({ ok: true, count: getRecentEmails().length, data: getRecentEmails() });
});

export default r;
