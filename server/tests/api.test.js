import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

describe('NeoStats Collaborative Project Management API Test Suite', () => {
  let adminToken = '';
  let managerToken = '';
  let memberToken = '';
  let viewerToken = '';

  let testProjectId = '';
  let testTaskId = '';
  let testMemberId = '';

  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neostats_pm';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-this-before-sharing';
    await connectDB();

    // Ensure seeded users exist in DB
    const ensureUser = async (name, email, password, role) => {
      let u = await User.findOne({ email });
      if (!u) {
        u = await User.create({
          name,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          role,
          active: true
        });
      }
      return u;
    };

    await ensureUser('Avery Admin', 'admin@teamspace.local', 'Admin123!', 'admin');
    await ensureUser('Morgan Manager', 'manager@teamspace.local', 'Manager123!', 'project_manager');
    const member = await ensureUser('Taylor Member', 'member@teamspace.local', 'Member123!', 'team_member');
    await ensureUser('Val Viewer', 'viewer@teamspace.local', 'Viewer123!', 'viewer');
    testMemberId = member._id;

    // Login with all 4 seeded roles
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@teamspace.local', password: 'Admin123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    const managerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@teamspace.local', password: 'Manager123!' });
    expect(managerRes.status).toBe(200);
    managerToken = managerRes.body.token;

    const memberRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@teamspace.local', password: 'Member123!' });
    expect(memberRes.status).toBe(200);
    memberToken = memberRes.body.token;

    const viewerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@teamspace.local', password: 'Viewer123!' });
    expect(viewerRes.status).toBe(200);
    viewerToken = viewerRes.body.token;
  });

  afterAll(async () => {
    // Clean up test project if created
    if (testProjectId) {
      await request(app)
        .delete(`/api/projects/${testProjectId}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    await mongoose.disconnect();
  });

  describe('1. Health and Authentication', () => {
    it('GET /api/health should return ok: true', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.service).toBe('teamspace-api');
    });

    it('POST /api/auth/login with invalid password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teamspace.local', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('GET /api/auth/me returns authenticated user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.email).toBe('admin@teamspace.local');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('Viewer should be forbidden from creating a project (403)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Unauthorized Viewer Project' });
      expect(res.status).toBe(403);
    });

    it('Team Member should be forbidden from creating a project (403)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Unauthorized Member Project' });
      expect(res.status).toBe(403);
    });

    it('Admin can successfully create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Core Platform Automated Test',
          description: 'Automated test project for hackathon verification'
        });
      expect(res.status).toBe(201);
      expect(res.body.project.name).toBe('Core Platform Automated Test');
      testProjectId = res.body.project._id;
    });

    it('Admin can add members to the project', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/members/${testMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'member' });
      expect(res.status).toBe(200);
      expect(res.body.project.members.some(m => String(m.user._id || m.user) === String(testMemberId))).toBe(true);
    });
  });

  describe('3. Task Management & Optimistic Concurrency Control (OCC)', () => {
    it('Admin/PM can create a task with version 0', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Implement Concurrency Locking',
          description: 'Support optimistic version check on task update',
          priority: 'high',
          status: 'todo',
          assignee: testMemberId
        });
      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('Implement Concurrency Locking');
      expect(res.body.task.version).toBe(0);
      testTaskId = res.body.task._id;
    });

    it('Successful update increments task version from 0 to 1', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expectedVersion: 0,
          status: 'in_progress',
          description: 'Updated description at v0'
        });
      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('in_progress');
      expect(res.body.task.version).toBe(1);
    });

    it('STALE UPDATE CONFLICT: Submitting update with stale version 0 returns HTTP 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expectedVersion: 0, // Stale version! Current version in database is 1!
          status: 'done'
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.currentVersion).toBe(1);
      expect(res.body.error.submittedVersion).toBe(0);
      expect(res.body.error.latest.version).toBe(1);
    });

    it('Updating with latest version 1 succeeds and moves task to version 2', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          expectedVersion: 1,
          status: 'done'
        });
      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('done');
      expect(res.body.task.version).toBe(2);
    });
  });

  describe('4. Comments and Collaboration', () => {
    let commentId = '';

    it('Viewer cannot post comments (403)', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ body: 'Viewer comment attempt' });
      expect(res.status).toBe(403);
    });

    it('Project member can post a comment', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ body: 'Great work! Ready for QA review.' });
      expect(res.status).toBe(201);
      expect(res.body.comment.body).toBe('Great work! Ready for QA review.');
      commentId = res.body.comment._id;
    });

    it('Can list comments for task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Comment author can delete their comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(204);
    });
  });
});
