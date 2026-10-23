import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function listUsers(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const query = {};

  if (req.query.role) {
    query.role = req.query.role;
  }
  if (req.query.search) {
    const s = String(req.query.search).trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } }
    ];
  }
  if (req.query.active !== undefined) {
    query.active = req.query.active === 'true';
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query)
  ]);

  res.json({
    data: users.map(u => ({
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt
    })),
    page,
    limit,
    total
  });
}

export async function listAssignableUsers(req, res) {
  const users = await User.find({ active: true }).select('name email role active').sort({ name: 1 });
  res.json({
    data: users.map(u => ({
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active
    }))
  });
}

export async function createUser(req, res) {
  const { name, email, password, role = 'team_member' } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({
      error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email address already exists.' }
    });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(password, 12),
    role,
    active: true
  });

  res.status(201).json({
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active
    }
  });
}

export async function updateUser(req, res) {
  const patch = {};
  if (req.body.name !== undefined) patch.name = req.body.name;
  if (req.body.role !== undefined) patch.role = req.body.role;
  if (req.body.active !== undefined) patch.active = req.body.active;

  const u = await User.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true
  });

  if (!u) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
  }

  res.json({
    user: {
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active
    }
  });
}

export async function toggleActive(req, res) {
  const u = await User.findById(req.params.id);
  if (!u) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
  }

  u.active = !u.active;
  await u.save();

  res.json({
    user: {
      _id: u._id,
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active
    }
  });
}
