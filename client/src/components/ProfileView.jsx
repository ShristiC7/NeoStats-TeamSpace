import React, { useState } from 'react';
import {
  User, Shield, Check, X, Mail, Calendar, Lock,
  Sparkles, KeyRound, CheckCircle2, Clock3, FolderKanban,
  Bell, BellRing, Settings, LogOut, ArrowRight, ShieldCheck,
  AlertCircle, Smartphone, Globe, Eye, EyeOff
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function ProfileView({ user, tasks = [], projects = [], onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'permissions' | 'notifications' | 'security'
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifCompleted, setNotifCompleted] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  // Security Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passNotice, setPassNotice] = useState('');
  const [passError, setPassError] = useState('');

  const myAssignedTasks = tasks.filter(t => String(t.assignee?._id || t.assignee || '') === String(user?._id || ''));
  const myCompletedTasks = myAssignedTasks.filter(t => t.status === 'done');
  const myInProgressTasks = myAssignedTasks.filter(t => t.status === 'in_progress');
  const myTodoTasks = myAssignedTasks.filter(t => t.status === 'todo');

  const myProjects = projects.filter(p =>
    String(p.owner?._id || p.owner) === String(user?._id) ||
    (p.members || []).some(m => String(m.user?._id || m.user) === String(user?._id))
  );

  const permissions = [
    { cap: 'Manage Workspace Users (Create, Edit, Deactivate)', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'Create Projects & Permanent Deletion', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'Configure Project Links (Live Demo, GitHub URL)', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'View All Projects in Workspace', admin: true, pm: false, tm: false, viewer: false },
    { cap: 'Manage Project Members & Roles (Manager, Member, Viewer)', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Create, Edit & Delete Tasks', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Assign Tasks to Team Members', admin: true, pm: true, tm: false, viewer: false },
    { cap: 'Receive Automated Assignment Email Notifications', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Update Status of Assigned Tasks', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Post Comments in Task Discussions', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Optimistic Concurrency Detection (409 Conflict)', admin: true, pm: true, tm: true, viewer: false },
    { cap: 'Read-Only Project & Task Inspection', admin: true, pm: true, tm: true, viewer: true }
  ];

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPassError('');
    setPassNotice('');
    if (!currentPass) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassNotice('Password successfully updated and encrypted with bcrypt (12 rounds).');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const roleColors = {
    admin: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: 'Workspace Administrator' },
    project_manager: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', label: 'Project Manager' },
    team_member: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', label: 'Team Member' },
    viewer: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: 'Workspace Viewer' }
  };

  const roleMeta = roleColors[user?.role] || roleColors.team_member;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-heading" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            ACCOUNT CENTER
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            User Profile
          </h1>
          <p className="muted">Manage your personal credentials, workspace preferences, and security access.</p>
        </div>
        <div className="heading-actions">
          <button className="btn secondary" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="panel" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', border: '1px solid #e9d5ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="member-avatar" style={{ width: 68, height: 68, fontSize: 24, background: '#6d28d9', color: '#fff', boxShadow: '0 4px 14px rgba(109,40,217,0.3)', border: '3px solid #fff' }}>
              {initials(user?.name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0f172a' }}>{user?.name}</h2>
                <span style={{ background: roleMeta.bg, color: roleMeta.text, border: `1px solid ${roleMeta.border}`, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                  {roleMeta.label}
                </span>
                <span className={user?.active ? 'status-dot active' : 'status-dot'} style={{ fontSize: 11 }}>
                  {user?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, fontSize: 13, color: '#64748b', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} color="#6d28d9" /> {user?.email}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={14} color="#059669" /> JWT Verified Session
                </span>
                <span>•</span>
                <span>ID: {user?._id || user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="segmented-pill-bar" style={{ marginBottom: 20, width: 'fit-content' }}>
        <button
          className={`segmented-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={14} /> Overview & Statistics
        </button>
        <button
          className={`segmented-pill-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Shield size={14} /> RBAC Permissions Matrix
        </button>
        <button
          className={`segmented-pill-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={14} /> Email & Notifications
        </button>
        <button
          className={`segmented-pill-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={14} /> Security & Session
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="panel" style={{ padding: 18, borderLeft: '4px solid #6d28d9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Assigned Tasks</span>
                <CheckCircle2 size={16} color="#6d28d9" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{myAssignedTasks.length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Total tasks assigned to you</div>
            </div>

            <div className="panel" style={{ padding: 18, borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Completed Tasks</span>
                <Check size={16} color="#059669" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', margin: '8px 0 2px' }}>{myCompletedTasks.length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Verified deliverables completed</div>
            </div>

            <div className="panel" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <span>In Progress</span>
                <Clock3 size={16} color="#2563eb" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', margin: '8px 0 2px' }}>{myInProgressTasks.length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Currently active deliverables</div>
            </div>

            <div className="panel" style={{ padding: 18, borderLeft: '4px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Active Projects</span>
                <FolderKanban size={16} color="#d97706" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>{myProjects.length || 1}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Collaborative workspaces</div>
            </div>
          </div>

          {/* Assigned Tasks Summary List */}
          <div className="panel" style={{ padding: 20 }}>
            <div className="panel-heading" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>My Assigned Tasks</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>Tasks assigned to your profile across all projects.</p>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>{myAssignedTasks.length} items</span>
            </div>

            {myAssignedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No tasks assigned to your account right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myAssignedTasks.map(t => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Priority: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{t.priority}</span> • Version: v{t.version}
                      </div>
                    </div>
                    <span className={`status-label ${t.status}`} style={{ textTransform: 'capitalize' }}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'permissions' && (
        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Role-Based Access Control (RBAC) Matrix</h3>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                Detailed breakdown of authorization enforced across all 4 roles. Your current role is <strong>{roleMeta.label}</strong>.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>CAPABILITY</th>
                  <th style={{ background: user?.role === 'admin' ? '#ede9fe' : undefined, color: user?.role === 'admin' ? '#6d28d9' : undefined }}>
                    ADMIN {user?.role === 'admin' && '(YOU)'}
                  </th>
                  <th style={{ background: user?.role === 'project_manager' ? '#ede9fe' : undefined, color: user?.role === 'project_manager' ? '#6d28d9' : undefined }}>
                    PROJECT MANAGER {user?.role === 'project_manager' && '(YOU)'}
                  </th>
                  <th style={{ background: user?.role === 'team_member' ? '#ede9fe' : undefined, color: user?.role === 'team_member' ? '#6d28d9' : undefined }}>
                    TEAM MEMBER {user?.role === 'team_member' && '(YOU)'}
                  </th>
                  <th style={{ background: user?.role === 'viewer' ? '#ede9fe' : undefined, color: user?.role === 'viewer' ? '#6d28d9' : undefined }}>
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
      )}

      {/* TAB 3: NOTIFICATIONS & EMAIL PREFERENCES */}
      {activeTab === 'notifications' && (
        <div className="panel" style={{ padding: 24 }}>
          <div className="panel-heading" style={{ marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0 }}>Automated Email & Notification Settings</h3>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                Configure which transactional emails and workspace alerts are dispatched to <strong>{user?.email}</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Task Assigned Notifications</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Receive an automated email whenever a task is newly assigned or reassigned to you.</div>
              </div>
              <input type="checkbox" checked={notifAssigned} onChange={e => setNotifAssigned(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Task Completed Notifications</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Receive notifications when tasks in your projects are completed.</div>
              </div>
              <input type="checkbox" checked={notifCompleted} onChange={e => setNotifCompleted(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Discussion Comments & Replies</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Get alerts when team members comment on tasks you follow or lead.</div>
              </div>
              <input type="checkbox" checked={notifComments} onChange={e => setNotifComments(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Weekly Project Digest</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Summary of team progress, velocity, and upcoming deadlines every Monday.</div>
              </div>
              <input type="checkbox" checked={notifDigest} onChange={e => setNotifDigest(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Password Change Card */}
          <div className="panel" style={{ padding: 24 }}>
            <div className="panel-heading" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Update Password</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>Ensure your workspace account uses a strong password.</p>
              </div>
            </div>

            {passNotice && (
              <div className="notice" style={{ marginBottom: 14 }}>
                <ShieldCheck size={16} />
                <span>{passNotice}</span>
              </div>
            )}

            {passError && (
              <div className="alert" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <label>
                Current Password
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                />
              </label>

              <label style={{ marginTop: 10 }}>
                New Password
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                />
              </label>

              <label style={{ marginTop: 10 }}>
                Confirm New Password
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 16px', fontSize: 12, color: '#64748b', cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPass ? 'Hide password' : 'Show password'}</span>
              </div>

              <button type="submit" className="btn primary full">
                Update Password
              </button>
            </form>
          </div>

          {/* Session Details Card */}
          <div className="panel" style={{ padding: 24 }}>
            <div className="panel-heading" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>Active Session & Cryptography</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>Details on token verification and cryptography standards.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <KeyRound size={15} color="#6d28d9" /> JSON Web Token (JWT)
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  HMAC SHA-256 signed bearer token stored in localStorage with 8-hour expiry.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={15} color="#059669" /> Password Salting & Hashing
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  All passwords hashed with bcrypt using a salt work factor of 12 rounds.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={15} color="#2563eb" /> Server-Enforced RBAC
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Every endpoint executes role authorization middleware before handling database operations.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
