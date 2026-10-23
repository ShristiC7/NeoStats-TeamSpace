import React, { useState, useEffect } from 'react';
import {
  Globe, Eye, EyeOff, Shield, Terminal, UserCheck, Sparkles,
  Zap, ArrowRight, Check, AlertCircle, Lock, Mail, User as UserIcon
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

  // Quick Demo Drawer / Modal
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const googleClientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '816385652364-7khs3otudctkk4egba9ttsia24nt50nm.apps.googleusercontent.com';

  const demoAccounts = [
    { role: 'Admin', name: 'Avery Admin', email: 'admin@teamspace.local', pass: 'Admin123!', color: '#6d28d9', note: 'Manage users & all projects' },
    { role: 'Project Manager', name: 'Morgan Manager', email: 'manager@teamspace.local', pass: 'Manager123!', color: '#4338ca', note: 'Lead projects & tasks' },
    { role: 'Team Member', name: 'Taylor Member', email: 'member@teamspace.local', pass: 'Member123!', color: '#2563eb', note: 'Update tasks & comments' },
    { role: 'Team Member', name: 'Shristi', email: 'shristi70525@gmail.com', pass: 'Password123!', color: '#059669', note: 'Verified email account' },
    { role: 'Viewer', name: 'Val Viewer', email: 'viewer@teamspace.local', pass: 'Viewer123!', color: '#64748b', note: 'Read-only access' }
  ];

  const rolesList = [
    { id: 'admin', label: 'Admin', desc: 'Full workspace access & user permissions', color: '#6d28d9' },
    { id: 'project_manager', label: 'Project Manager', desc: 'Lead projects, tasks & deliverables', color: '#4338ca' },
    { id: 'team_member', label: 'Team Member', desc: 'Update assigned tasks & discussions', color: '#2563eb' },
    { id: 'viewer', label: 'Viewer', desc: 'Read-only workspace inspection', color: '#64748b' }
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

  const handleTriggerGoogle = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      const btn = document.querySelector('#googleSignInBtn [role="button"]');
      if (btn) btn.click();
    }
  };

  return (
    <div className="razor-page-wrapper">
      {/* TOP HEADER */}
      <header className="razor-top-nav">
        <div className="razor-nav-brand">
          <div className="razor-brand-title">TeamSpace</div>
          <a href="mailto:support@teamspace.app" className="razor-brand-sublink">
            support@teamspace.app <span style={{ fontSize: 13 }}>&rarr;</span>
          </a>
        </div>

        <div className="razor-nav-actions">
          <div className="razor-globe-wrap" title="Global Workspace">
            <Globe size={18} color="#0f172a" />
          </div>
          <button
            type="button"
            className="razor-link-btn"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
          <button
            type="button"
            className="razor-demo-pill-btn"
            onClick={() => setShowDemoDrawer(!showDemoDrawer)}
            title="Open 1-Click Evaluation Accounts"
          >
            <Zap size={14} style={{ marginRight: 4 }} />
            {showDemoDrawer ? 'Hide Demo' : 'Request Demo'}
          </button>
        </div>
      </header>

      {/* BACKGROUND DECORATIVE DOODLES & ILLUSTRATIONS */}
      <div className="razor-illustrations-layer" aria-hidden="true">
        {/* LEFT DOODLES & SHAPES */}
        <div className="razor-art-left">
          {/* Note Card */}
          <div className="doodle-note-card">
            <div className="doodle-line line-1"></div>
            <div className="doodle-line line-2"></div>
          </div>

          {/* Dotted Yellow Pillar */}
          <div className="doodle-yellow-pillar">
            <div className="pillar-dot dot-1"></div>
            <div className="pillar-dot dot-2"></div>
            <div className="pillar-dot dot-3"></div>
            <div className="pillar-dot dot-4"></div>
            <div className="pillar-dot dot-5"></div>
            <div className="pillar-dot dot-6"></div>
            <div className="pillar-dot dot-7"></div>
            <div className="pillar-dot dot-8"></div>
          </div>

          {/* Upward Growth Chart Box */}
          <div className="doodle-growth-chart">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <path d="M8 34 C 16 32, 22 24, 30 12" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M22 12 H30 V20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Hand Drawn Squiggles */}
          <svg className="doodle-squiggle-left" width="120" height="60" viewBox="0 0 120 60" fill="none">
            <path d="M10 40 Q 30 15, 55 35 T 100 20" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="112" cy="38" r="3" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>

        {/* RIGHT CHARACTER & DOODLES */}
        <div className="razor-art-right">
          {/* Floating Message Bubble */}
          <div className="doodle-chat-card">
            <div className="doodle-line line-1"></div>
            <div className="doodle-line line-2"></div>
          </div>

          {/* Girl working on Laptop Illustration */}
          <div className="doodle-person-wrapper">
            <svg width="190" height="230" viewBox="0 0 190 230" fill="none">
              {/* White Pedestal Box */}
              <rect x="70" y="110" width="80" height="110" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              
              {/* Right Dotted Pillar */}
              <rect x="155" y="118" width="32" height="102" rx="4" fill="#FAD389" stroke="#0f172a" strokeWidth="1.8" />
              <circle cx="166" cy="132" r="2.5" fill="#0f172a" />
              <circle cx="178" cy="144" r="2.5" fill="#0f172a" />
              <circle cx="166" cy="158" r="2.5" fill="#0f172a" />
              <circle cx="178" cy="172" r="2.5" fill="#0f172a" />
              <circle cx="166" cy="186" r="2.5" fill="#0f172a" />
              <circle cx="178" cy="200" r="2.5" fill="#0f172a" />

              {/* Legs hanging from pedestal */}
              <path d="M96 112 L92 165 L82 178" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M96 112 L92 165 L82 178" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M106 112 L112 162 L120 178" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M106 112 L112 162 L120 178" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

              {/* Shoes */}
              <path d="M82 178 L72 188 L85 190 Z" fill="#0f172a" />
              <path d="M120 178 L126 190 L138 185 Z" fill="#0f172a" />

              {/* Torso & Patterned Top */}
              <path d="M88 62 C 85 85, 82 114, 114 114 C 132 114, 126 85, 122 62 Z" fill="#1e293b" />
              {/* Pattern dots on top */}
              <circle cx="98" cy="74" r="1.8" fill="#ffffff" />
              <circle cx="112" cy="76" r="1.8" fill="#ffffff" />
              <circle cx="95" cy="88" r="1.8" fill="#ffffff" />
              <circle cx="108" cy="92" r="1.8" fill="#ffffff" />
              <circle cx="118" cy="85" r="1.8" fill="#ffffff" />
              <circle cx="102" cy="104" r="1.8" fill="#ffffff" />

              {/* Arms & Hands */}
              <path d="M90 68 Q 78 90, 72 105" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M118 68 Q 100 88, 78 108" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

              {/* Light Green Laptop */}
              <path d="M50 92 L75 110 L58 114 Z" fill="#B4D977" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
              <path d="M55 112 L85 112" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

              {/* Head & Hair Bun */}
              <circle cx="104" cy="46" r="11" fill="#fff" stroke="#0f172a" strokeWidth="2" />
              {/* Hair bun and hair */}
              <path d="M100 36 C 96 38, 94 48, 102 52 C 108 52, 114 44, 112 38 Z" fill="#0f172a" />
              <circle cx="116" cy="38" r="7" fill="#0f172a" />
              {/* Nose/Face profile */}
              <path d="M96 46 Q 93 48, 96 50" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Squiggles */}
          <svg className="doodle-squiggle-right" width="130" height="70" viewBox="0 0 130 70" fill="none">
            <path d="M20 30 Q 50 10, 80 40 T 120 25" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="48" r="3" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* 1-CLICK DEMO ACCOUNTS DRAWER */}
      {showDemoDrawer && (
        <div className="razor-demo-drawer-banner">
          <div className="razor-demo-drawer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
              <Zap size={15} color="#F6B27E" />
              <span>1-Click Instant Evaluation Logins:</span>
            </div>
            <div className="razor-demo-chips-grid">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  className="razor-demo-chip"
                  onClick={() => handleQuickLogin(acc)}
                  title={`Login as ${acc.name} (${acc.role})`}
                >
                  <span className="demo-chip-dot" style={{ background: acc.color }}></span>
                  <span className="demo-chip-name">{acc.name}</span>
                  <span className="demo-chip-role">({acc.role.replace('_', ' ')})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN AUTHENTICATION CARD */}
      <main className="razor-center-container">
        <div className="razor-card" style={{ maxWidth: mode === 'signup' ? 520 : 440 }}>
          {/* Card Header */}
          <div className="razor-card-header">
            <h1 className="razor-card-title">
              {mode === 'signin' ? 'Agent Login' : 'Create Account'}
            </h1>
            <p className="razor-card-subtitle">
              {mode === 'signin'
                ? 'Hey, Enter your details to get sign in to your account'
                : 'Enter your credentials and select your workspace role'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="razor-error-box">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="razor-form">
              {/* Email / Username Field */}
              <div className="razor-field">
                <input
                  type="email"
                  required
                  placeholder="Enter Email / Username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="razor-input"
                />
                <span className="razor-field-icon">
                  <div className="razor-circle-indicator"></div>
                </span>
              </div>

              {/* Password / Passcode Field */}
              <div className="razor-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Passcode"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="razor-input"
                />
                <button
                  type="button"
                  className="razor-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Having Trouble in sign in? */}
              <div className="razor-trouble-row">
                <span className="razor-trouble-text">Having trouble in sign in?</span>
              </div>

              {/* Sign in Button (Peachy Orange) */}
              <button
                type="submit"
                className="razor-primary-btn"
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="razor-form">
              {/* Full Name */}
              <div className="razor-field">
                <input
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="razor-input"
                />
              </div>

              {/* Email */}
              <div className="razor-field">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="razor-input"
                />
              </div>

              {/* Password */}
              <div className="razor-field">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Create Passcode (min 8 characters)"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="razor-input"
                />
                <button
                  type="button"
                  className="razor-toggle-pwd"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                >
                  {showRegPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Role Selection */}
              <div style={{ marginTop: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                  Select Workspace Role:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {rolesList.map(r => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #0f172a' : '1px solid #E2E8F0',
                          background: isSelected ? '#FDFBF7' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>{r.label}</span>
                          {isSelected && <Check size={13} color="#0f172a" />}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.3 }}>{r.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="razor-primary-btn"
                disabled={submitting}
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* DIVIDER: — Or Sign in with — */}
          <div className="razor-divider">
            <span>— Or Sign in with —</span>
          </div>

          {/* SOCIAL LOGIN ROW (Google, Demo, Role) */}
          <div className="razor-social-row">
            {/* Google OAuth Button */}
            <button
              type="button"
              className="razor-social-btn"
              onClick={handleTriggerGoogle}
              title="Sign in with Google OAuth"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>

            {/* Quick Demo Toggle */}
            <button
              type="button"
              className="razor-social-btn"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              title="1-Click Demo Accounts"
            >
              <Zap size={16} color="#0f172a" />
              <span>Demo</span>
            </button>

            {/* Workspace Roles Info / Switch */}
            <button
              type="button"
              className="razor-social-btn"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              title="Toggle Sign In / Sign Up"
            >
              <UserCheck size={16} color="#0f172a" />
              <span>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</span>
            </button>
          </div>

          {/* Hidden Google Identity Services Container */}
          <div id="googleSignInBtn" style={{ display: 'none' }}></div>

          {/* BOTTOM REDIRECT LINK */}
          <div className="razor-bottom-switch">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button type="button" className="razor-switch-link" onClick={() => setMode('signup')}>
                  Request Now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button type="button" className="razor-switch-link" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="razor-footer">
        Copyright @TeamSpace 2026 | Privacy Policy
      </footer>
    </div>
  );
}
