import React from 'react';
import {
  User,
  Shield,
  Check,
  X,
  Mail,
  Calendar,
  Lock,
  Sparkles,
  KeyRound
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function ProfileView({ user, onLogout }) {
  const permissions = [
    { cap: 'Manage Workspace Users (Create, Edit, Deactivate)', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'Create Projects & Permanent Deletion', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'View All Projects in Workspace', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'Manage Project Members & Roles (Manager, Member, Viewer)', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Create, Edit & Delete Tasks', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Assign Tasks to Team Members', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Update Status of Assigned Tasks', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Post Comments in Task Discussions', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Optimistic Concurrency Detection (409 Conflict)', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Read-Only Project & Task Inspection', admin: true, pm: true, tm: true, viewer: true }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            ACCOUNT & PERMISSIONS
          </div>
          <h1>User Profile</h1>
          <p className="muted">Your identity, security credentials, and active role authorization matrix.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="panel">
          <div className="panel-heading">
            <h3>Profile Identity</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '8px 0 16px' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20, background: '#4f46e5', color: '#fff' }}>
              {initials(user?.name)}
            </div>
            <div>
              <h2 style={{ fontSize: 20, margin: 0 }}>{user?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, marginTop: 4 }}>
                <Mail size={14} /> {user?.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>CURRENT ROLE</small>
              <div style={{ marginTop: 4 }}>
                <span className="role-pill" style={{ fontSize: 13, textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>ACCOUNT STATUS</small>
              <div style={{ marginTop: 4 }}>
                <span className={user?.active ? 'status-dot active' : 'status-dot'}>
                  {user?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Security & Session</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.5, fontSize: 13 }}>
            <p>
              Session tokens are verified by Express.js middleware using jsonwebtoken with HMAC SHA-256 signatures. Passwords are salted and hashed with bcrypt (12 rounds).
            </p>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={14} color="#6366f1" /> Server-Enforced RBAC
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
                Permissions are validated on every API request. Unauthorized calls directly return HTTP 403 Forbidden.
              </p>
            </div>

            <button className="btn secondary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={onLogout}>
              Sign out of workspace
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Role-Based Access Control (RBAC) Matrix</h3>
            <p className="muted">Detailed breakdown of authorization enforced across all 4 roles.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>CAPABILITY</th>
                <th style={{ background: user?.role === 'admin' ? '#ede9fe' : undefined }}>
                  ADMIN {user?.role === 'admin' && '(YOU)'}
                </th>
                <th style={{ background: user?.role === 'project_manager' ? '#ede9fe' : undefined }}>
                  PROJECT MANAGER {user?.role === 'project_manager' && '(YOU)'}
                </th>
                <th style={{ background: user?.role === 'team_member' ? '#ede9fe' : undefined }}>
                  TEAM MEMBER {user?.role === 'team_member' && '(YOU)'}
                </th>
                <th style={{ background: user?.role === 'viewer' ? '#ede9fe' : undefined }}>
                  VIEWER {user?.role === 'viewer' && '(YOU)'}
                </th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{p.cap}</td>
                  <td>
                    {p.admin ? (
                      <span className="matrix-badge-yes"><Check size={14} /> Yes</span>
                    ) : (
                      <span className="matrix-badge-no"><X size={14} /> No</span>
                    )}
                  </td>
                  <td>
                    {p.pm ? (
                      <span className="matrix-badge-yes"><Check size={14} /> Assigned</span>
                    ) : (
                      <span className="matrix-badge-no"><X size={14} /> No</span>
                    )}
                  </td>
                  <td>
                    {p.tm ? (
                      <span className="matrix-badge-yes"><Check size={14} /> Assigned</span>
                    ) : (
                      <span className="matrix-badge-no"><X size={14} /> No</span>
                    )}
                  </td>
                  <td>
                    {p.viewer ? (
                      <span className="matrix-badge-yes"><Check size={14} /> Read-only</span>
                    ) : (
                      <span className="matrix-badge-no"><X size={14} /> No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
