import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { getProjectAccess, forbidden, notFound, isAdmin } from '../utils/access.js';
import { sendTaskAssignedEmail, sendTaskCompletedEmail } from '../services/emailService.js';

export async function listProjects(req, res) {
  let q = {};
  if (!isAdmin(req.user)) {
    q = {
      $or: [
        { 'members.user': req.user._id },
        { owner: req.user._id }
      ]
    };
  }

  if (req.query.status && req.query.status !== 'all') q.status = req.query.status;

  if (req.query.search) {
    const s = String(req.query.search).trim();
    q.$and = q.$and || [];
    q.$and.push({
      $or: [
        { name: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } }
      ]
    });
  }

  const data = await Project.find(q)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role active')
    .sort({ updatedAt: -1 });

  res.json({ data });
}

export async function createProject(req, res) {
  const { name, description = '', managerId, liveDemoUrl = null, githubUrl = null } = req.body;
  let members = [];

  if (managerId) {
    const m = await User.findOne({ _id: managerId, active: true });
    if (!m) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Manager not found or inactive.' } });
    }
    members.push({ user: m._id, role: 'manager' });
  }

  const p = await Project.create({ name, description, owner: req.user._id, members, liveDemoUrl, githubUrl });

  const populated = await Project.findById(p._id)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role active');

  res.status(201).json({ project: populated });
}

export async function getProject(req, res) {
  const a = await getProjectAccess(req.user, req.params.id);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isAdmin && !a.member && String(a.project.owner) !== String(req.user._id)) {
    return forbidden(res, 'You are not a member of this project.');
  }

  const p = await Project.findById(req.params.id)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role active');

  res.json({ project: p });
}

export async function updateProject(req, res) {
  const a = await getProjectAccess(req.user, req.params.id);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isManager) {
    return forbidden(res, 'Only Admins or assigned Project Managers can update this project.');
  }

  const patch = {};
  if (req.body.name !== undefined) patch.name = req.body.name;
  if (req.body.description !== undefined) patch.description = req.body.description;
  if (req.body.status !== undefined) patch.status = req.body.status;
  // Project Links
  if (req.body.liveDemoUrl !== undefined) patch.liveDemoUrl = req.body.liveDemoUrl || null;
  if (req.body.githubUrl !== undefined) patch.githubUrl = req.body.githubUrl || null;

  const p = await Project.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true })
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role active');

  res.json({ project: p });
}

export async function archiveProject(req, res) {
  req.body = { ...req.body, status: 'archived' };
  return updateProject(req, res);
}

export async function restoreProject(req, res) {
  req.body = { ...req.body, status: 'active' };
  return updateProject(req, res);
}

export async function deleteProject(req, res) {
  const a = await getProjectAccess(req.user, req.params.id);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isAdmin) {
    return forbidden(res, 'Only workspace administrators can permanently delete projects.');
  }

  await Promise.all([
    a.project.deleteOne(),
    Task.deleteMany({ project: a.project._id })
  ]);

  res.status(204).end();
}

export async function addMember(req, res) {
  const a = await getProjectAccess(req.user, req.params.id);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isManager) return forbidden(res, 'Only project managers or admins can manage members.');

  const userId = req.params.userId || req.body.userId;
  const user = await User.findOne({ _id: userId, active: true });
  if (!user) return notFound(res, 'Active user not found.');

  const role = req.body.role || 'member';
  if (!['manager', 'member', 'viewer'].includes(role)) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project role.' } });
  }

  const existing = a.project.members.find(m => String(m.user) === String(user._id));
  if (existing) { existing.role = role; } else { a.project.members.push({ user: user._id, role }); }

  await a.project.save();

  const populated = await Project.findById(a.project._id)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role active');

  res.json({ project: populated });
}

export async function removeMember(req, res) {
  const a = await getProjectAccess(req.user, req.params.id);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isManager) return forbidden(res, 'Only project managers or admins can remove members.');

  const targetUserId = req.params.userId;
  a.project.members = a.project.members.filter(m => String(m.user) !== String(targetUserId));
  await a.project.save();

  res.status(204).end();
}

export async function changeMemberRole(req, res) {
  return addMember(req, res);
}

export async function projectTasks(req, res) {
  const a = await getProjectAccess(req.user, req.params.projectId);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isAdmin && !a.member && String(a.project.owner) !== String(req.user._id)) {
    return forbidden(res, 'You do not have access to tasks in this project.');
  }

  const q = { project: a.project._id };

  if (req.query.assignedOnly === 'true' || (req.user.role === 'team_member' && req.query.scope === 'assigned')) {
    q.assignee = req.user._id;
  }

  if (req.query.status && req.query.status !== 'all') q.status = req.query.status;
  if (req.query.priority && req.query.priority !== 'all') q.priority = req.query.priority;
  if (req.query.assignee && req.query.assignee !== 'all') q.assignee = req.query.assignee;
  if (req.query.search) {
    const s = String(req.query.search).trim();
    q.$or = [
      { title: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } }
    ];
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));

  const [data, total] = await Promise.all([
    Task.find(q)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(q)
  ]);

  res.json({ data, page, limit, total });
}

export async function createTask(req, res) {
  const a = await getProjectAccess(req.user, req.params.projectId);
  if (!a.project) return notFound(res, 'Project not found.');
  if (!a.isManager) {
    return forbidden(res, 'Only Project Managers or Admins can create tasks in this project.');
  }

  const { title, description = '', priority = 'medium', status = 'todo', assignee = null, dueDate = null } = req.body;

  if (assignee) {
    const isMember = a.project.members.some(m => String(m.user) === String(assignee));
    if (!isMember) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Assignee must be an active project member.' } });
    }
  }

  const t = await Task.create({
    project: a.project._id,
    title,
    description,
    priority,
    status,
    assignee: assignee || null,
    createdBy: req.user._id,
    dueDate: dueDate ? new Date(dueDate) : null,
    version: 0
  });

  const populated = await Task.findById(t._id)
    .populate('assignee', 'name email role')
    .populate('createdBy', 'name email');

  // Send assignment notification if task has an assignee
  if (populated.assignee) {
    setImmediate(async () => {
      try {
        await sendTaskAssignedEmail({
          task: populated,
          assignee: populated.assignee,
          assigner: req.user,
          projectName: a.project.name
        });
      } catch (err) {
        console.error('[createTask] Email notification failed:', err.message);
      }
    });
  }

  res.status(201).json({ task: populated });
}
