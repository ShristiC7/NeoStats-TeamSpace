import React, { useState, useEffect } from 'react';
import {
  Layers, Shield, Terminal, UserCheck, Eye, EyeOff,
  ArrowRight, Lock, Mail, User as UserIcon, CheckCircle2,
  AlertCircle, Sparkles, KeyRound, Check, ShieldCheck, Zap
} from 'lucide-react';

export default function LoginView({ onLogin, onRegister, onGoogleAuth, error }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form State
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('team_member');

  const [submitting, setSubmitting] = useState(false);

  const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '816385652364-7khs3otudctkk4egba9ttsia24nt50nm.apps.googleusercontent.com';

  const demoAccounts = [
    { role: 'Admin', name: 'Avery Admin', email: 'admin@teamspace.local', pass: 'Admin123!', icon: Shield, color: '#6d28d9', note: 'Manage users & all projects' },
    { role: 'Project Manager', name: 'Morgan Manager', email: 'manager@teamspace.local', pass: 'Manager123!', icon: Terminal, color: '#4338ca', note: 'Lead projects & tasks' },
    { role: 'Team Member', name: 'Taylor Member', email: 'member@teamspace.local', pass: 'Member123!', icon: UserCheck, color: '#2563eb', note: 'Update tasks & comments' },
    { role: 'Team Member', name: 'Shristi', email: 'shristi70525@gmail.com', pass: 'Password123!', icon: Sparkles, color: '#059669', note: 'Verified email account' },
    { role: 'Viewer', name: 'Val Viewer', email: 'viewer@teamspace.local', pass: 'Viewer123!', icon: Eye, color: '#64748b', note: 'Read-only access' }
  ];

  const rolesList = [
    { id: 'admin', label: 'Admin', desc: 'Full workspace access: manage all users, projects, and permissions', icon: Shield, color: '#6d28d9' },
    { id: 'project_manager', label: 'Project Manager', desc: 'Manage assigned projects, team members, deliverables, and tasks', icon: Terminal, color: '#4338ca' },
    { id: 'team_member', label: 'Team Member', desc: 'Update assigned tasks status, collaborate in discussions, and view projects', icon: UserCheck, color: '#2563eb' },
    { id: 'viewer', label: 'Viewer', desc: 'Inspect projects, tasks, and audit logs with read-only security permissions', icon: Eye, color: '#64748b' }
  ];

  // Initialize Google Identity Services
  useEffect(() => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse
        });
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: '100%', text: mode === 'signup' ? 'signup_with' : 'signin_with', shape: 'pill' }
          );
        }
      } catch (err) {
        console.warn('Google GSI init notice:', err);
      }
    }
  }, [mode, googleClientId]);

  const handleGoogleResponse = async (response) => {
    if (response?.credential) {
      await onGoogleAuth(response.credential, selectedRole);
    }
  };

  const handleQuickLogin = async (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setSubmitting(true);
    await onLogin(acc.email, acc.pass);
    setSubmitting(false);
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
      <div className="zendo-auth-card" style={{ maxWidth: 540 }}>
        {/* Brand Header */}
        <div className="auth-header-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
          <div className="zendo-logo-icon" style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, color: '#fff', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="zendo-logo-text" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>TeamSpace</div>
            <div style={{ fontSize: 10, color: '#6d28d9', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>COLLABORATIVE WORKSPACE</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            {mode === 'signin' ? 'Welcome Back to TeamSpace' : 'Create Your Workspace Account'}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {mode === 'signin'
              ? 'Sign in to access your projects, tasks, Kanban desk, and team chats.'
              : 'Choose your workspace role to begin collaborating with your team.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="auth-tab-switch" style={{ marginBottom: 18 }}>
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

        {/* Google OAuth Button */}
        <div style={{ marginBottom: 16 }}>
          <div id="googleSignInBtn" style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}></div>
        </div>

        <div className="auth-divider" style={{ margin: '16px 0' }}>
          <span>or continue with email credentials</span>
        </div>

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={13} color="#6d28d9" /> Email address
              </span>
              <input
                type="email"
                required
                placeholder="e.g. admin@teamspace.local or shristi70525@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>

            <label style={{ marginTop: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={13} color="#6d28d9" /> Password
                </span>
                <span
                  style={{ fontSize: 11, color: '#6d28d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />} {showPassword ? 'Hide' : 'Show'}
                </span>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </label>

            <button type="submit" className="btn primary full" disabled={submitting} style={{ marginTop: 16, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Authenticating...' : 'Sign in to TeamSpace'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* ROLE-BASED SIGN UP FORM */
          <form onSubmit={handleSignUp}>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserIcon size={13} color="#6d28d9" /> Full Name
              </span>
              <input
                required
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label style={{ marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={13} color="#6d28d9" /> Email address
              </span>
              <input
                type="email"
                required
                placeholder="e.g. alex@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </label>

            <label style={{ marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={13} color="#6d28d9" /> Password
                </span>
                <span
                  style={{ fontSize: 11, color: '#6d28d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? <EyeOff size={12} /> : <Eye size={12} />} {showRegPassword ? 'Hide' : 'Show'}
                </span>
              </span>
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </label>

            {/* Role Selection Cards */}
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                Select Your Workspace Role:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {rolesList.map(r => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: isSelected ? `2px solid ${r.color}` : '1px solid #e2e8f0',
                        background: isSelected ? '#faf5ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Icon size={14} color={r.color} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: isSelected ? r.color : '#0f172a' }}>{r.label}</span>
                        {isSelected && <Check size={12} color={r.color} style={{ marginLeft: 'auto' }} />}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn primary full" disabled={submitting} style={{ marginTop: 18, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Creating account...' : `Create ${rolesList.find(r => r.id === selectedRole)?.label} Account`} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* 1-Click Fast Demo Credentials Bar */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} /> 1-Click Demo Accounts
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Instant evaluation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: 6 }}>
            {demoAccounts.map(acc => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Sign in as ${acc.name} (${acc.email})`}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>
                    <Icon size={14} color={acc.color} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b', textTransform: 'capitalize' }}>
                    {acc.role.replace('_', ' ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Footer Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 18, fontSize: 11, color: '#94a3b8' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={13} color="#059669" /> TLS Encrypted
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <KeyRound size={13} color="#6d28d9" /> Bcrypt Hashed
          </span>
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Lock size={13} color="#2563eb" /> Strict RBAC
          </span>
        </div>
      </div>
    </div>
  );
}
