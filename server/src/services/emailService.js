/**
 * TeamSpace Email Service
 * Uses Nodemailer with configurable SMTP.
 * Automatic Ethereal email fallback for local testing & live preview URLs.
 */

import nodemailer from 'nodemailer';

let transporter = null;
let etherealAccount = null;
const recentEmails = [];

async function getTransporter() {
  if (process.env.NODE_ENV === 'test') return null;
  if (transporter) return transporter;

  if (process.env.SMTP_USER && (process.env.SMTP_HOST || process.env.SMTP_PASS)) {
    try {
      const isGmail = process.env.SMTP_HOST === 'smtp.gmail.com' || process.env.SMTP_USER.endsWith('@gmail.com');
      const passClean = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
      
      if (isGmail) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_USER, pass: passClean }
        });
      } else {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: passClean }
        });
      }
      return transporter;
    } catch (err) {
      console.error('[emailService] Configured SMTP failed:', err.message);
    }
  }

  // Automatic Ethereal account for development/hackathon demo
  try {
    etherealAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: { user: etherealAccount.user, pass: etherealAccount.pass }
    });
    console.info('[emailService] Ethereal test inbox initialized for local delivery:', etherealAccount.user);
    return transporter;
  } catch (err) {
    console.warn('[emailService] Ethereal init skipped:', err.message);
    return null;
  }
}

const FROM = process.env.EMAIL_FROM || 'TeamSpace <no-reply@teamspace.app>';
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

function taskLink(taskId) { return `${BASE_URL}/tasks/${taskId}`; }
function fmtDate(d) { if (!d) return 'Not set'; return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }
function fmtDateTime(d) { if (!d) return 'Unknown'; return new Date(d).toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }); }

export async function send({ to, subject, text, html }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn('[emailService] Skipped - invalid recipient:', to);
    return;
  }

  const record = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    to,
    subject,
    text,
    status: 'dispatched',
    previewUrl: null,
    timestamp: new Date().toISOString()
  };
  recentEmails.unshift(record);
  if (recentEmails.length > 50) recentEmails.pop();

  try {
    const mailer = await getTransporter();
    if (mailer) {
      const info = await mailer.sendMail({ from: FROM, to, subject, text, html });
      record.previewUrl = nodemailer.getTestMessageUrl(info);
      record.status = 'delivered';
      console.info(`[emailService] Email sent to ${to} (${info.messageId}) ${record.previewUrl ? 'Preview: ' + record.previewUrl : ''}`);
    } else {
      console.info(`[emailService] Email logged to ${to}: ${subject}`);
    }
  } catch (err) {
    record.status = 'failed';
    record.error = err.message;
    console.error('[emailService] Failed to send email to', to, '-', err.message);
  }
}

export function getRecentEmails() {
  return recentEmails;
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

  const text = `Hello ${assignee.name},\n\nA task has been assigned to you in TeamSpace.\n\n${rows}\n\nPlease open TeamSpace to view the task and its details: ${link}\n\nThank you,\nTeamSpace Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 24px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">TeamSpace</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Collaborative Project Workspace</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">New Task Assigned</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Hello <strong>${assignee.name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">A task has been assigned to you in TeamSpace.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600; width: 120px;">Task Title:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a; font-weight: 700;">${task.title}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Project:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${projectName}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Assigned By:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${assigner?.name || 'A team member'}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Priority:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-transform: uppercase; font-weight: 600;">${task.priority || 'medium'}</td></tr>
          <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Due Date:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${fmtDate(task.dueDate)}</td></tr>
          ${task.description ? `<tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Description:</td><td style="padding: 10px 14px; font-size: 13px; color: #334155; line-height: 1.5;">${task.description}</td></tr>` : ''}
        </table>

        <div style="margin: 24px 0 16px; text-align: center;">
          <a href="${link}" style="background: #6d28d9; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            Open Task in TeamSpace &rarr;
          </a>
        </div>
      </div>
      <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Sent automatically by TeamSpace.
      </div>
    </div>
  `;

  await send({ to: assignee.email, subject: `New Task Assigned: ${task.title}`, text, html });
}

export async function sendTaskCompletedEmail({ task, completedBy, projectName, recipients }) {
  if (!recipients?.length) { console.warn('[emailService] sendTaskCompletedEmail: no recipients'); return; }
  const link = taskLink(task._id);
  const completedAt = fmtDateTime(task.updatedAt || new Date());

  for (const recipient of recipients) {
    if (!recipient?.email) { console.warn('[emailService] sendTaskCompletedEmail: recipient has no email:', recipient?.name); continue; }
    const text = `Hello ${recipient.name},\n\nA task has been marked as completed in TeamSpace.\n\nTask: ${task.title}\nProject: ${projectName}\nCompleted by: ${completedBy?.name || 'A team member'}\nCompleted at: ${completedAt}\n\nView task: ${link}\n\nThank you,\nTeamSpace Team`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">TeamSpace</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Collaborative Project Workspace</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Task Marked as Completed</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Hello <strong>${recipient.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">The following task has been successfully completed in project <strong>${projectName}</strong>:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600; width: 120px;">Task:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a; font-weight: 700;">${task.title}</td></tr>
            <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Project:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${projectName}</td></tr>
            <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Completed By:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${completedBy?.name || 'A team member'}</td></tr>
            <tr><td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600;">Completed At:</td><td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${completedAt}</td></tr>
          </table>

          <div style="margin: 24px 0 16px; text-align: center;">
            <a href="${link}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              View Task in TeamSpace &rarr;
            </a>
          </div>
        </div>
        <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent automatically by TeamSpace.
        </div>
      </div>
    `;

    await send({ to: recipient.email, subject: `Task Completed: ${task.title}`, text, html });
  }
}

export { send as _sendRaw };
