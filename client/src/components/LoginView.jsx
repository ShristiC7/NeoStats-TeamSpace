import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Terminal,
  UserCheck,
  Eye,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginView({ onLogin, onRegister, onGoogleAuth, error }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Form State
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('team_member');

  const [submitting, setSubmitting] = useState(false);

  const googleClientId = '816385652364-dske9418ts4ut74k3chva9fuqgnbnm9t.apps.googleusercontent.com';

  const demoAccounts = [
    { role: 'Admin', email: 'admin@teamspace.local', pass: 'Admin123!', icon: Shield, note: 'Manage users & all projects' },
    { role: 'Project Manager', email: 'manager@teamspace.local', pass: 'Manager123!', icon: Terminal, note: 'Manage projects, tasks & members' },
    { role: 'Team Member', email: 'member@teamspace.local', pass: 'Member123!', icon: UserCheck, note: 'Update assigned tasks & comments' },
    { role: 'Viewer', email: 'viewer@teamspace.local', pass: 'Viewer123!', icon: Eye, note: 'Read-only access across workspace' }
  ];

  const rolesList = [
    { id: 'admin', label: 'Admin', desc: 'Manage users, create projects & view all records', icon: Shield },
    { id: 'project_manager', label: 'Project Manager', desc: 'Lead projects, assign tasks & manage team roles', icon: Terminal },
    { id: 'team_member', label: 'Team Member', desc: 'Update task progress & collaborate in discussions', icon: UserCheck },
    { id: 'viewer', label: 'Viewer', desc: 'Read-only view of workspace projects and tasks', icon: Eye }
  ];

  // Initialize Google Identity Services
  useEffect(() => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { theme: 'outline', size: 'large', width: '100%', text: mode === 'signup' ? 'signup_with' : 'signin_with', shape: 'pill' }
        );
      } catch (err) {
        console.warn('Google GSI init notice:', err);
      }
    }
  }, [mode]);

  const handleGoogleResponse = async (response) => {
    if (response?.credential) {
      await onGoogleAuth(response.credential, selectedRole);
    }
  };

  const handleManualGoogleClick = () => {
    // If the official button rendered, trigger click or show prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google OAuth library is loading. Please check internet connection.');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onRegister({
      name,
      email: regEmail,
      password: regPassword,
      role: selectedRole
    });
    setSubmitting(false);
  };

  return (
    <div className="zendo-auth-container">
      <div className="zendo-auth-card">
        {/* Logo and Brand */}
        <div className="auth-header-logo">
          <div className="zendo-logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="zendo-logo-text">Zendo</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PROJECT MANAGEMENT</div>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          {mode === 'signin' ? 'Welcome back to Zendo' : 'Create your workspace account'}
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {mode === 'signin'
            ? 'Sign in to access your projects, tasks, and team discussions.'
            : 'Select your workspace role to get started with collaborative project management.'}
        </p>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Role-Based Sign Up
          </button>
        </div>

        {error && (
          <div className="alert" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div style={{ marginBottom: 16 }}>
          <div id="googleSignInBtn" style={{ width: '100%' }}></div>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
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

            <button type="submit" className="btn primary full" disabled={submitting} style={{ marginTop: 8, padding: '12px' }}>
              {submitting ? 'Authenticating...' : 'Sign in to Zendo'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* ROLE-BASED SIGN UP FORM */
          <form onSubmit={handleSignUp}>
            <label>
              Full Name
              <input
                required
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                required
                placeholder="e.g. alex@company.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </label>

            <label>
              Create Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </label>

            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Select Your Workspace Role</span>
              <div className="role-cards-grid">
                {rolesList.map(r => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <div
                      key={r.id}
                      className={`role-card-opt ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRole(r.id)}
                    >
                      <b>
                        <Icon size={14} color={isSelected ? '#6d28d9' : '#64748b'} />
                        {r.label}
                      </b>
                      <small>{r.desc}</small>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn primary full" disabled={submitting} style={{ marginTop: 8, padding: '12px' }}>
              {submitting ? 'Creating account...' : `Sign Up as ${selectedRole.replace('_', ' ')}`} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Evaluation One-Click Demo Logins */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={13} /> Evaluation Mode — 1-Click Role Logins:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {demoAccounts.map(acc => {
              const Icon = acc.icon;
              return (
                <div
                  key={acc.email}
                  className="role-card-opt"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    onLogin(acc.email, acc.pass);
                  }}
                >
                  <b style={{ color: '#6d28d9', fontSize: 12 }}>
                    <Icon size={13} /> {acc.role}
                  </b>
                  <small style={{ fontSize: 10 }}>{acc.email}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
