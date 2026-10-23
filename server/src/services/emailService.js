/**
 * TeamSpace Email Service
 * Uses Nodemailer with configurable SMTP.
 * All email delivery is backend-only; no credentials are exposed to the client.
 *
 * Required environment variables:
 *   SMTP_HOST      - SMTP server hostname (e.g. smtp.gmail.com)
 *   SMTP_PORT      - SMTP port (default: 587)
 *   SMTP_SECURE    - 'true' for port 465 (SSL), 'false' for STARTTLS
 *   SMTP_USER      - SMTP username / email address
 *   SMTP_PASS      - SMTP password / app password
 *   EMAIL_FROM     - Sender address (e.g. "TeamSpace <no-reply@teamspace.app>")
 *   APP_BASE_URL   - Base URL for task links (e.g. http://localhost:5173)
 */

import nodemailer from 'nodemailer';

// --- Transporter ---

function createTransporter() {
  if (process.env.NODE_ENV === 'test') return null;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[emailService] SMTP not configured. Emails will be logged but not sent.');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

let transporter = null;
try { transporter = createTransporter(); } catch (e) { console.error('[emailService] Transport init failed:', e.message); }

const FROM = process.env.EMAIL_FROM || 'TeamSpace <no-reply@teamspace.app>';
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

function taskLink(taskId) { return `${BASE_URL}/tasks/${taskId}`; }
function fmtDate(d) { if (!d) return 'Not set'; return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }
function fmtDateTime(d) { if (!d) return 'Unknown'; return new Date(d).toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); }

async function send({ to, subject, text, html }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn('[emailService] Skipped - invalid recipient:', to);
    return;
  }
  if (!transporter) {
    console.info('[emailService] SMTP not configured - email NOT sent.\n', { to, subject, text: text?.slice(0, 200) });
    return;
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, text, html });
    console.info('[emailService] Email sent to', to, '-', info.messageId);
  } catch (err) {
    console.error('[emailService] Failed to send email to', to, '-', err.message);
    // Never rethrow - email failure must not undo persisted task changes
  }
}

export async function sendTaskAssignedEmail({ task, assignee, assigner, projectName }) {
  if (!assignee?.email) { console.warn('[emailService] sendTaskAssignedEmail: assignee has no email'); return; }
  const link = taskLink(task._id);
  const rows = [
    `Task: ${task.title}`,
    `Project: ${projectName}`,
    `Assigned by: ${assigner?.name || 'A team member'}`,
    task.priority ? `Priority: ${task.priority}` : '',
    task.dueDate ? `Due Date: ${fmtDate(task.dueDate)}` : '',
    task.description?.trim() ? `Description: ${task.description.trim()}` : ''
  ].filter(Boolean).join('\n');

  const text = `Hello ${assignee.name},\n\nA task has been assigned to you in TeamSpace.\n\n${rows}\n\nOpen task: ${link}\n\nThank you,\nTeamSpace`;

  await send({ to: assignee.email, subject: `New Task Assigned: ${task.title}`, text });
}

export async function sendTaskCompletedEmail({ task, completedBy, projectName, recipients }) {
  if (!recipients?.length) { console.warn('[emailService] sendTaskCompletedEmail: no recipients'); return; }
  const link = taskLink(task._id);
  const completedAt = fmtDateTime(task.updatedAt || new Date());

  for (const recipient of recipients) {
    if (!recipient?.email) { console.warn('[emailService] sendTaskCompletedEmail: recipient has no email:', recipient?.name); continue; }
    const text = `Hello ${recipient.name},\n\nA task has been marked as completed in TeamSpace.\n\nTask: ${task.title}\nProject: ${projectName}\nCompleted by: ${completedBy?.name || 'A team member'}\nCompleted at: ${completedAt}\n\nView task: ${link}\n\nThank you,\nTeamSpace`;
    await send({ to: recipient.email, subject: `Task Completed: ${task.title}`, text });
  }
}

export { send as _sendRaw };
