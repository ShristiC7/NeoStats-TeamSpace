import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must not exceed 80 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).default('team_member')
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).optional().default('team_member')
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must not exceed 80 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).default('team_member')
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).optional(),
  active: z.boolean().optional()
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Name cannot exceed 120 characters'),
  description: z.string().max(2000).optional().default(''),
  managerId: z.string().optional().nullable()
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['active', 'archived']).optional()
});

export const memberRoleSchema = z.object({
  role: z.enum(['manager', 'member', 'viewer']).default('member')
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(180, 'Title cannot exceed 180 characters'),
  description: z.string().max(4000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).default('todo'),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional()
});

export const updateTaskSchema = z.object({
  expectedVersion: z.coerce.number().int().min(0, 'A non-negative integer expectedVersion is required for concurrency control'),
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().max(4000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional()
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment body cannot be empty').max(2000, 'Comment cannot exceed 2000 characters')
});
