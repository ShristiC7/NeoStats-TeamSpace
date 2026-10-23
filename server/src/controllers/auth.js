import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const safe = u => ({
  _id: u._id,
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active
});

export async function login(req, res) {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');

  const u = await User.findOne({ email }).select('+passwordHash');
  if (!u || !u.active || !(await bcrypt.compare(password, u.passwordHash))) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }
    });
  }

  const token = jwt.sign({ sub: u._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.json({ token, user: safe(u) });
}

export async function register(req, res) {
  const { name, email, password, role = 'team_member' } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({
      error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email address already exists. Please sign in.' }
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    role,
    active: true
  });

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.status(201).json({ token, user: safe(user) });
}

export async function googleAuth(req, res) {
  const { credential, role = 'team_member' } = req.body;

  let payload = null;

  try {
    // Attempt verification via Google's tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (response.ok) {
      payload = await response.json();
    }
  } catch (err) {
    console.warn('Google tokeninfo fetch failed, falling back to local JWT decode:', err.message);
  }

  // Fallback to decoding the JWT payload
  if (!payload || !payload.email) {
    payload = jwt.decode(credential);
  }

  if (!payload || !payload.email) {
    return res.status(400).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid Google OAuth credential token.' }
    });
  }

  const email = String(payload.email).toLowerCase().trim();
  const name = payload.name || payload.given_name || email.split('@')[0];

  let user = await User.findOne({ email });

  if (!user) {
    // Create new user with chosen role
    const randomPassword = crypto.randomBytes(32).toString('hex');
    user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(randomPassword, 12),
      role: role || 'team_member',
      active: true
    });
  } else if (!user.active) {
    return res.status(401).json({
      error: { code: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated. Please contact an administrator.' }
    });
  }

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.json({ token, user: safe(user) });
}

export function me(req, res) {
  res.json({ user: safe(req.user) });
}
