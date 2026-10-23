import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

// ─── Mock email service to prevent real emails during tests ──────────────────
vi.mock('../src/services/emailService.js', () => ({
  sendTaskAssignedEmail: vi.fn().mockResolvedValue(undefined),
  sendTaskCompletedEmail: vi.fn().mockResolvedValue(undefined),
  _sendRaw: vi.fn().mockResolvedValue(undefined)
}));

import { sendTaskAssignedEmail, sendTaskCompletedEmail } from '../src/services/emailService.js';

describe('TeamSpace Collaborative Project Management API Test Suite', () => {
  let adminToken = '';
  let managerToken = '';
  let memberToken = '';
  let viewerToken = '';

  let testProjectId = '';
  let testTaskId = '';
  let testMemberId = '';
  let testMemberEmail = '';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neostats_pm';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-this-before-sharing';
    await connectDB();

    const ensureUser = async (name, email, password, role) => {
      let u = await User.findOne({ email });
      if (!u) {
        u = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role, active: true });
      }
      return u;
    };

    await ensureUser('Avery Admin', 'admin@teamspace.local', 'Admin123!', 'admin');
    await ensureUser('Morgan Manager', 'manager@teamspace.local', 'Manager123!', 'project_manager');
    const member = await ensureUser('Taylor Member', 'member@teamspace.local', 'Member123!', 'team_member');
    await ensureUser('Val Viewer', 'viewer@teamspace.local', 'Viewer123!', 'viewer');
    testMemberId = member._id;
    testMemberEmail = member.email;

    const loginUser = async (email, password) => {
      const res = await request(app).post('/api/auth/login').send({ email, password });
      expect(res.status).toBe(200);
      return res.body.token;
    };

    adminToken = await loginUser('admin@teamspace.local', 'Admin123!');
    managerToken = await loginUser('manager@teamspace.local', 'Manager123!');
    memberToken = await loginUser('member@teamspace.local', 'Member123!');
    viewerToken = await loginUser('viewer@teamspace.local', 'Viewer123!');
  });

  afterAll(async () => {
    if (testProjectId) {
      await request(app)
        .delete(`/api/projects/${testProjectId}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    await mongoose.disconnect();
  });

  // ─── 1. Health & Authentication ─────────────────────────────────────────────
  describe('1. Health and Authentication', () => {
    it('GET /api/health should return ok: true', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.service).toBe('teamspace-api');
    });

    it('POST /api/auth/login with invalid password returns 401', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'admin@teamspace.local', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('GET /api/auth/me returns authenticated user details', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });
  });

  // ─── 2. Role-Based Access Control ───────────────────────────────────────────
  describe('2. Role-Based Access Control (RBAC)', () => {
    it('Viewer cannot create a project (403)', async () => {
      const res = await request(app).post('/api/projects').set('Authorization', `Bearer ${viewerToken}`).send({ name: 'Unauthorized Viewer Project' });
      expect(res.status).toBe(403);
    });

    it('Team Member cannot create a project (403)', async () => {
      const res = await request(app).post('/api/projects').set('Authorization', `Bearer ${memberToken}`).send({ name: 'Unauthorized Member Project' });
      expect(res.status).toBe(403);
    });

    it('Admin can create a project', async () => {
      const res = await request(app).post('/api/projects').set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Core Platform Automated Test', description: 'Automated test project' });
      expect(res.status).toBe(201);
      expect(res.body.project.name).toBe('Core Platform Automated Test');
      testProjectId = res.body.project._id;
    });

    it('Admin can add members to the project', async () => {
      const res = await request(app).post(`/api/projects/${testProjectId}/members/${testMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`).send({ role: 'member' });
      expect(res.status).toBe(200);
      expect(res.body.project.members.some(m => String(m.user._id || m.user) === String(testMemberId))).toBe(true);
    });
  });

  // ─── 3. Task Management & OCC ───────────────────────────────────────────────
  describe('3. Task Management & Optimistic Concurrency Control (OCC)', () => {
    it('Admin can create a task with version 0', async () => {
      const res = await request(app).post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Implement Concurrency Locking', description: 'Support OCC', priority: 'high', status: 'todo', assignee: testMemberId });
      expect(res.status).toBe(201);
      expect(res.body.task.version).toBe(0);
      testTaskId = res.body.task._id;
    });

    it('Successful update increments task version from 0 to 1', async () => {
      const res = await request(app).patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 0, status: 'in_progress', description: 'Updated description at v0' });
      expect(res.status).toBe(200);
      expect(res.body.task.version).toBe(1);
    });

    it('CONFLICT: Stale version 0 update returns HTTP 409', async () => {
      const res = await request(app).patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 0, status: 'done' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.currentVersion).toBe(1);
    });

    it('Update with version 1 succeeds and task reaches version 2', async () => {
      const res = await request(app).patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 1, status: 'todo' });
      expect(res.status).toBe(200);
      expect(res.body.task.version).toBe(2);
    });
  });

  // ─── 4. Comments ────────────────────────────────────────────────────────────
  describe('4. Comments and Collaboration', () => {
    let commentId = '';

    it('Viewer cannot post comments (403)', async () => {
      const res = await request(app).post(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`).send({ body: 'Viewer comment attempt' });
      expect(res.status).toBe(403);
    });

    it('Project member can post a comment', async () => {
      const res = await request(app).post(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`).send({ body: 'Great work! Ready for QA review.' });
      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('Great work! Ready for QA review.');
      commentId = res.body.comment._id;
    });

    it('Can list comments for task', async () => {
      const res = await request(app).get(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Comment author can delete their own comment', async () => {
      const res = await request(app).delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(204);
    });
  });

  // ─── 5. Email Notification Tests ────────────────────────────────────────────
  describe('5. Email Notifications', () => {
    let emailTaskId = '';
    let emailProjectId = '';
    let memberUser2Id = '';

    beforeAll(async () => {
      // Create a second project and task for isolated email tests
      const projRes = await request(app).post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Email Test Project', description: 'For email notification tests' });
      expect(projRes.status).toBe(201);
      emailProjectId = projRes.body.project._id;

      // Add member to project
      await request(app).post(`/api/projects/${emailProjectId}/members/${testMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`).send({ role: 'member' });
    });

    afterAll(async () => {
      if (emailProjectId) {
        await request(app).delete(`/api/projects/${emailProjectId}/permanent`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('Creating a task with an assignee triggers sendTaskAssignedEmail', async () => {
      vi.clearAllMocks();
      const res = await request(app).post(`/api/projects/${emailProjectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Email Assign Task', status: 'todo', priority: 'medium', assignee: testMemberId });
      expect(res.status).toBe(201);
      emailTaskId = res.body.task._id;

      // Give setImmediate a chance to fire
      await new Promise(r => setTimeout(r, 100));
      expect(sendTaskAssignedEmail).toHaveBeenCalledOnce();
      const args = sendTaskAssignedEmail.mock.calls[0][0];
      expect(args.assignee.email).toBe(testMemberEmail);
      expect(args.task.title).toBe('Email Assign Task');
    });

    it('Creating a task without assignee does NOT trigger assignment email', async () => {
      vi.clearAllMocks();
      const res = await request(app).post(`/api/projects/${emailProjectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'No Assignee Task', status: 'todo' });
      expect(res.status).toBe(201);
      await new Promise(r => setTimeout(r, 100));
      expect(sendTaskAssignedEmail).not.toHaveBeenCalled();
    });

    it('Changing assignee triggers sendTaskAssignedEmail for new assignee', async () => {
      vi.clearAllMocks();
      // Clear assignee first
      await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 0, assignee: null });

      vi.clearAllMocks();
      // Re-assign
      const taskRes = await request(app).get(`/api/tasks/${emailTaskId}`).set('Authorization', `Bearer ${adminToken}`);
      const ver = taskRes.body.task.version;

      const res = await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: ver, assignee: String(testMemberId) });
      expect(res.status).toBe(200);
      await new Promise(r => setTimeout(r, 100));
      expect(sendTaskAssignedEmail).toHaveBeenCalledOnce();
    });

    it('Updating task description only does NOT trigger assignment email', async () => {
      vi.clearAllMocks();
      const taskRes = await request(app).get(`/api/tasks/${emailTaskId}`).set('Authorization', `Bearer ${adminToken}`);
      const ver = taskRes.body.task.version;
      const assigneeId = taskRes.body.task.assignee?._id;

      const res = await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: ver, description: 'Updated description only', assignee: String(assigneeId) });
      expect(res.status).toBe(200);
      await new Promise(r => setTimeout(r, 100));
      // Assignee unchanged, no email
      expect(sendTaskAssignedEmail).not.toHaveBeenCalled();
    });

    it('Transitioning task to done triggers sendTaskCompletedEmail', async () => {
      vi.clearAllMocks();
      const taskRes = await request(app).get(`/api/tasks/${emailTaskId}`).set('Authorization', `Bearer ${adminToken}`);
      const ver = taskRes.body.task.version;

      const res = await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: ver, status: 'done' });
      expect(res.status).toBe(200);
      await new Promise(r => setTimeout(r, 100));
      expect(sendTaskCompletedEmail).toHaveBeenCalledOnce();
      const args = sendTaskCompletedEmail.mock.calls[0][0];
      expect(args.task.status).toBe('done');
      expect(args.projectName).toBe('Email Test Project');
    });

    it('Editing already-completed task does NOT send duplicate completion email', async () => {
      vi.clearAllMocks();
      const taskRes = await request(app).get(`/api/tasks/${emailTaskId}`).set('Authorization', `Bearer ${adminToken}`);
      const ver = taskRes.body.task.version;
      expect(taskRes.body.task.status).toBe('done');

      // Edit description of already-done task (status stays done)
      const res = await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: ver, description: 'Editing a completed task', status: 'done' });
      expect(res.status).toBe(200);
      await new Promise(r => setTimeout(r, 100));
      // Status did not transition TO done (was already done)
      expect(sendTaskCompletedEmail).not.toHaveBeenCalled();
    });

    it('Stale version update does NOT trigger any email notifications', async () => {
      vi.clearAllMocks();
      const taskRes = await request(app).get(`/api/tasks/${emailTaskId}`).set('Authorization', `Bearer ${adminToken}`);
      const currentVer = taskRes.body.task.version;

      // Submit with stale version
      const res = await request(app).patch(`/api/tasks/${emailTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ expectedVersion: 0, status: 'todo' });
      expect(res.status).toBe(409);
      await new Promise(r => setTimeout(r, 100));
      expect(sendTaskAssignedEmail).not.toHaveBeenCalled();
      expect(sendTaskCompletedEmail).not.toHaveBeenCalled();
    });
  });

  // ─── 6. Project Links (Feature 2) ───────────────────────────────────────────
  describe('6. Project Links Feature', () => {
    let linksProjectId = '';

    afterAll(async () => {
      if (linksProjectId) {
        await request(app).delete(`/api/projects/${linksProjectId}/permanent`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('Can create a project without URLs', async () => {
      const res = await request(app).post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'No Links Project' });
      expect(res.status).toBe(201);
      linksProjectId = res.body.project._id;
      // liveDemoUrl and githubUrl should be absent or null
      expect(res.body.project.liveDemoUrl ?? null).toBeNull();
      expect(res.body.project.githubUrl ?? null).toBeNull();
    });

    it('Can create a project with valid URLs', async () => {
      const res = await request(app).post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Links Project', liveDemoUrl: 'https://demo.example.com', githubUrl: 'https://github.com/example/repo' });
      expect(res.status).toBe(201);
      expect(res.body.project.liveDemoUrl).toBe('https://demo.example.com');
      expect(res.body.project.githubUrl).toBe('https://github.com/example/repo');
      // Clean up
      await request(app).delete(`/api/projects/${res.body.project._id}/permanent`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('Invalid URL is rejected with validation error', async () => {
      const res = await request(app).post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad URL Project', liveDemoUrl: 'javascript:alert(1)', githubUrl: 'not-a-url' });
      expect(res.status).toBe(422);
    });

    it('Authorized user can update project URLs', async () => {
      const res = await request(app).patch(`/api/projects/${linksProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ liveDemoUrl: 'https://updated-demo.com', githubUrl: 'https://github.com/updated/repo' });
      expect(res.status).toBe(200);
      expect(res.body.project.liveDemoUrl).toBe('https://updated-demo.com');
      expect(res.body.project.githubUrl).toBe('https://github.com/updated/repo');
    });

    it('Unauthorized user cannot update project URLs (403)', async () => {
      const res = await request(app).patch(`/api/projects/${linksProjectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ liveDemoUrl: 'https://evil.com' });
      expect(res.status).toBe(403);
    });

    it('Can clear URLs by setting to empty string', async () => {
      const res = await request(app).patch(`/api/projects/${linksProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ liveDemoUrl: '', githubUrl: '' });
      expect(res.status).toBe(200);
      expect(res.body.project.liveDemoUrl ?? null).toBeNull();
      expect(res.body.project.githubUrl ?? null).toBeNull();
    });

    it('Project without URLs loads correctly', async () => {
      const res = await request(app).get(`/api/projects/${linksProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.project.name).toBe('No Links Project');
    });
  });
});
