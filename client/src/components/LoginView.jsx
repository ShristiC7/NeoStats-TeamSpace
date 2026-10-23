import React, { useState } from 'react';
import { Shield, Sparkles, CheckCircle, ArrowRight, UserCheck, Terminal, Eye, Lock } from 'lucide-react';

export default function LoginView({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@teamspace.local', pass: 'Admin123!', icon: Shield, note: 'Manage users, all projects, assign PMs' },
    { role: 'Project Manager', email: 'manager@teamspace.local', pass: 'Manager123!', icon: Terminal, note: 'Manage assigned projects, members & tasks' },
    { role: 'Team Member', email: 'member@teamspace.local', pass: 'Member123!', icon: UserCheck, note: 'Update assigned tasks & collaborate' },
    { role: 'Viewer', email: 'viewer@teamspace.local', pass: 'Viewer123!', icon: Eye, note: 'Read-only access across workspace' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  };

  const handleQuickLogin = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    onLogin(accEmail, accPass);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-badge">
          <Sparkles size={14} /> NeoStats Full Stack Hackathon
        </div>
        <h1>Welcome to Teamspace</h1>
        <p className="login-sub">
          A multi-user collaborative project management platform with server-enforced RBAC and optimistic concurrency control.
        </p>

        {error && (
          <div className="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              required
              placeholder="e.g. admin@teamspace.local"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn primary full" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign in to workspace'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> One-Click Evaluation Demo Logins
          </div>
          <div className="demo-logins-grid">
            {demoAccounts.map(acc => {
              const Icon = acc.icon;
              return (
                <div
                  key={acc.email}
                  className="demo-login-card"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                >
                  <div className="demo-login-role">
                    <Icon size={14} /> {acc.role}
                  </div>
                  <div className="demo-login-email">{acc.email}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{acc.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="login-art">
        <div className="art-card">
          <div className="art-card-top">
            <span className="tiny-dot purple" />
            <span>Architecture & Concurrency Guarantee</span>
          </div>
          <h3>Optimistic Concurrency Control (OCC)</h3>
          <p>
            When multiple team members or project managers edit the same task concurrently, stale updates are rejected with <b>HTTP 409 Conflict</b> using atomic version matching.
          </p>
          <ul style={{ paddingLeft: 18, fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '14px 0' }}>
            <li><b>Role-Based Access Control:</b> Strict server-side verification</li>
            <li><b>Project Membership:</b> Manager, Member, and Viewer roles</li>
            <li><b>Real-time Comments:</b> Threaded task discussions</li>
            <li><b>Audit-Proof:</b> Reproducible MongoDB local seed data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
