import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';
import { getProjectAccess, forbidden, notFound, conflict, isAdmin } from '../utils/access.js';

export async function getTask(req, res) {
  const t = await Task.findById(req.params.id)
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email')
    .populate('project', 'name status');

  if (!t) return notFound(res, 'Task not found.');

  const a = await getProjectAccess(req.user, t.project._id || t.project);
  if (!a.isAdmin && !a.member) {
    return forbidden(res, 'You do not have access to view this task.');
  }

  res.json({ task: t });
}

export async function updateTask(req, res) {
  const current = await Task.findById(req.params.id);
  if (!current) return notFound(res, 'Task not found.');

  const a = await getProjectAccess(req.user, current.project);
  if (!a.isAdmin && !a.member) {
    return forbidden(res, 'You do not have access to this project.');
  }

  const manager = !!a.isManager;
  const isAssigned = String(current.assignee || '') === String(req.user._id);

  // Viewers cannot update
  if (req.user.role === 'viewer') {
    return forbidden(res, 'Viewers have read-only access and cannot edit tasks.');
  }

  // Non-managers can only update if they are team_members assigned to the task
  if (!manager && !(req.user.role === 'team_member' && isAssigned)) {
    return forbidden(res, 'You may only update tasks that are assigned to you.');
  }

  const allowedFields = manager
    ? ['title', 'description', 'status', 'priority', 'assignee', 'dueDate']
    : ['status'];

  const patch = {};
  for (const k of allowedFields) {
    if (req.body[k] !== undefined) {
      if (k === 'dueDate') {
        patch[k] = req.body[k] ? new Date(req.body[k]) : null;
      } else if (k === 'assignee') {
        patch[k] = req.body[k] || null;
      } else {
        patch[k] = req.body[k];
      }
    }
  }

  // Disallow non-managers from editing restricted fields
  if (!manager) {
    const attemptedFields = Object.keys(req.body).filter(k => k !== 'expectedVersion' && k !== 'status');
    if (attemptedFields.length > 0) {
      return forbidden(res, `Team members may only update task status. Cannot modify: ${attemptedFields.join(', ')}`);
    }
  }

  // Validate assignee is in project
  if (patch.assignee) {
    const isMember = a.project.members.some(m => String(m.user) === String(patch.assignee));
    if (!isMember) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Assignee must be an active project member.' }
      });
    }
  }

  // Optimistic Concurrency Control Check
  const expected = Number(req.body.expectedVersion);
  if (!Number.isInteger(expected) || expected < 0) {
    return res.status(422).json({
      error: { code: 'VERSION_REQUIRED', message: 'expectedVersion (integer) is required to prevent concurrent write collisions.' }
    });
  }

  // Atomic conditional update
  const updated = await Task.findOneAndUpdate(
    { _id: current._id, version: expected },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true }
  )
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email')
    .populate('project', 'name status');

  if (!updated) {
    const latest = await Task.findById(current._id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name status');

    if (!latest) return notFound(res, 'Task not found.');

    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: `Concurrent edit conflict: this task was modified by another user (now at version ${latest.version}). Your edit was based on version ${expected}.`,
        submittedVersion: expected,
        currentVersion: latest.version,
        latest
      }
    });
  }

  res.json({ task: updated });
}

export async function deleteTask(req, res) {
  const t = await Task.findById(req.params.id);
  if (!t) return notFound(res, 'Task not found.');

  const a = await getProjectAccess(req.user, t.project);
  if (!a.isManager) {
    return forbidden(res, 'Only Project Managers or Admins can delete tasks.');
  }

  await Promise.all([
    t.deleteOne(),
    Comment.deleteMany({ task: t._id })
  ]);

  res.status(204).end();
}

export async function listComments(req, res) {
  const t = await Task.findById(req.params.id);
  if (!t) return notFound(res, 'Task not found.');

  const a = await getProjectAccess(req.user, t.project);
  if (!a.isAdmin && !a.member) {
    return forbidden(res, 'You do not have access to comments for this task.');
  }

  const comments = await Comment.find({ task: t._id })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });

  res.json({ data: comments });
}

export async function createComment(req, res) {
  const t = await Task.findById(req.params.id);
  if (!t) return notFound(res, 'Task not found.');

  const a = await getProjectAccess(req.user, t.project);
  if (!a.isAdmin && !a.member) {
    return forbidden(res, 'You do not have access to this project.');
  }

  if (req.user.role === 'viewer') {
    return forbidden(res, 'Viewers have read-only access and cannot comment.');
  }

  const body = String(req.body.body || '').trim();
  if (!body) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Comment cannot be empty.' }
    });
  }

  const c = await Comment.create({
    task: t._id,
    project: t.project,
    author: req.user._id,
    body
  });

  const populated = await Comment.findById(c._id).populate('author', 'name email role');
  res.status(201).json({ comment: populated });
}

export async function deleteComment(req, res) {
  const c = await Comment.findById(req.params.commentId);
  if (!c) return notFound(res, 'Comment not found.');

  const a = await getProjectAccess(req.user, c.project);
  const isAuthor = String(c.author) === String(req.user._id);

  if (!a.isAdmin && !a.isManager && !isAuthor) {
    return forbidden(res, 'You may only delete your own comments unless you are a manager.');
  }

  await c.deleteOne();
  res.status(204).end();
}
