import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import Comment from './models/Comment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

await connectDB();

await Promise.all([
  Comment.deleteMany({}),
  Task.deleteMany({}),
  Project.deleteMany({}),
  User.deleteMany({ email: /@teamspace\.local$/ })
]);

const pass = async p => bcrypt.hash(p, 12);

const users = await User.create([
  { name: 'Avery Admin', email: 'admin@teamspace.local', passwordHash: await pass('Admin123!'), role: 'admin' },
  { name: 'Morgan Manager', email: 'manager@teamspace.local', passwordHash: await pass('Manager123!'), role: 'project_manager' },
  { name: 'Taylor Member', email: 'member@teamspace.local', passwordHash: await pass('Member123!'), role: 'team_member' },
  { name: 'Val Viewer', email: 'viewer@teamspace.local', passwordHash: await pass('Viewer123!'), role: 'viewer' },
  { name: 'Esther Howard', email: 'estherhroe@gmail.com', passwordHash: await pass('Esther123!'), role: 'team_member' },
  { name: 'Leslie Alexander', email: 'lesilinealex@gmail.com', passwordHash: await pass('Leslie123!'), role: 'project_manager' },
  { name: 'Kristin Watson', email: 'kristinwatson@gmail.com', passwordHash: await pass('Kristin123!'), role: 'team_member' },
  { name: 'Jane Cooper', email: 'janecooper@gmail.com', passwordHash: await pass('Jane123!'), role: 'admin' }
]);

const [admin, manager, member, viewer, esther, leslie, kristin, jane] = users;

// Project 1: Mobile App Redesign
const project1 = await Project.create({
  name: 'Mobile App Redesign',
  description: 'The goal of this project was to redesign an existing mobile application to improve usability, visual clarity, and engagement.',
  owner: admin._id,
  members: [
    { user: manager._id, role: 'manager' },
    { user: member._id, role: 'member' },
    { user: esther._id, role: 'member' },
    { user: leslie._id, role: 'manager' },
    { user: viewer._id, role: 'viewer' }
  ]
});

// Project 2: Website Design
const project2 = await Project.create({
  name: 'Website Design',
  description: 'The goal of this project was to redesign an existing web application to improve usability, visual clarity, and brand consistency.',
  owner: admin._id,
  members: [
    { user: manager._id, role: 'manager' },
    { user: kristin._id, role: 'member' },
    { user: jane._id, role: 'manager' },
    { user: member._id, role: 'member' }
  ]
});

const tasks = await Task.create([
  {
    project: project1._id,
    title: 'Mobile App Redesign',
    description: 'Establish design tokens, responsive layout grid, and core navigation structure.',
    status: 'in_progress',
    priority: 'high',
    assignee: member._id,
    createdBy: manager._id,
    dueDate: new Date('2026-01-15'),
    version: 1
  },
  {
    project: project1._id,
    title: 'Wireframe design',
    description: 'Produce high-fidelity wireframes for project dashboard and checkout flow.',
    status: 'in_progress',
    priority: 'medium',
    assignee: esther._id,
    createdBy: manager._id,
    dueDate: new Date('2026-01-15'),
    version: 0
  },
  {
    project: project1._id,
    title: 'Credit Report Website',
    description: 'Integrate financial metrics API and build responsive table visualization.',
    status: 'in_progress',
    priority: 'urgent',
    assignee: leslie._id,
    createdBy: admin._id,
    dueDate: new Date('2026-01-15'),
    version: 2
  },
  {
    project: project1._id,
    title: 'Userflow planning',
    description: 'Conduct user journey audit and map out conversion touchpoints.',
    status: 'todo',
    priority: 'high',
    assignee: member._id,
    createdBy: manager._id,
    dueDate: new Date('2026-01-20'),
    version: 0
  },
  {
    project: project1._id,
    title: 'Audit current pages',
    description: 'Complete accessibility and performance benchmarking.',
    status: 'done',
    priority: 'medium',
    assignee: member._id,
    createdBy: manager._id,
    dueDate: new Date('2026-01-10'),
    version: 3
  }
]);

await Comment.create({
  task: tasks[0]._id,
  project: project1._id,
  author: manager._id,
  body: 'Initial mobile prototype looks fantastic! Let us prepare user testing for Monday.'
});

console.log('Seed complete in', mongoose.connection.name);
console.log('Demo logins: admin@teamspace.local / Admin123!, manager@teamspace.local / Manager123!, member@teamspace.local / Member123!, viewer@teamspace.local / Viewer123!');

await mongoose.disconnect();
