import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function Sidebar({ page, setPage, user, projectsCount, tasksCount, onLogout }) {
  const navItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Projects', label: 'Projects', icon: FolderKanban, badge: projectsCount },
    { id: 'Tasks', label: 'Task Board', icon: CheckSquare, badge: tasksCount },
    { id: 'Users', label: 'User Admin', icon: Users, adminOnly: true },
    { id: 'Profile', label: 'Role & Profile', icon: User }
  ];

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-icon" style={{ background: '#6366f1', color: '#fff', padding: '6px 9px', borderRadius: 8, fontWeight: 800 }}>
          TS
        </div>
        <div>
          <b style={{ fontSize: 16 }}>teamspace</b>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>COLLABORATIVE PM</span>
        </div>
      </div>

      <div className="workspace-switch">
        <div className="workspace-badge" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
          N
        </div>
        <div>
          <b>NeoStats Studio</b>
          <small>Hackathon Edition</small>
        </div>
      </div>

      <div className="nav-label" style={{ marginTop: 20 }}>WORKSPACE</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = item.icon;
          const isSelected = page === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isSelected ? 'selected' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={18} />
              <span className="nav-label-text">{item.label}</span>
              {item.badge !== undefined && (
                <span className="nav-count" style={{ marginLeft: 'auto' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div className="help-card" style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
            <Sparkles size={14} color="#6366f1" /> Active Role
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'capitalize' }}>
            Signed in as <b>{user?.role?.replace('_', ' ')}</b>
          </div>
        </div>

        <div className="profile-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ background: '#4f46e5', color: '#fff', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
              {initials(user?.name)}
            </div>
            <div className="profile-meta">
              <b style={{ fontSize: 13, display: 'block' }}>{user?.name}</b>
              <small style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</small>
            </div>
          </div>
          <button className="icon-btn" title="Sign out" onClick={onLogout} style={{ color: '#ef4444' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
