import React from 'react';
import {
  Layers,
  Search,
  Home,
  FolderKanban,
  CheckSquare,
  LayoutGrid,
  MessageSquare,
  Calendar,
  Bell,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function Sidebar({ page, setPage, user, projectsCount, tasksCount, onLogout, notifCount = 0 }) {
  const mainNav = [
    { id: 'Overview', label: 'Home', icon: Home },
    { id: 'Projects', label: 'Projects', icon: FolderKanban, badge: projectsCount },
    { id: 'My Tasks', label: 'My Tasks', icon: CheckSquare, badge: tasksCount },
    { id: 'Kanban Desk', label: 'Kanban Desk', icon: LayoutGrid },
    { id: 'Message', label: 'Message', icon: MessageSquare },
    { id: 'Calendar', label: 'Calendar', icon: Calendar },
    { id: 'Notifications', label: 'Notifications', icon: Bell, badge: notifCount },
  ];

  const othersNav = [
    { id: 'Users', label: 'Team Members', icon: Users, adminOnly: true },
    { id: 'Profile', label: 'Account Settings', icon: Settings },
  ];

  return (
    <aside className="zendo-sidebar">
      {/* Brand Header */}
      <div className="zendo-brand">
        <div className="zendo-logo-icon">
          <Layers size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="zendo-logo-text">TeamSpace</div>
        </div>
      </div>

      {/* Search Input in Sidebar */}
      <div className="zendo-searchbox">
        <Search size={15} />
        <input placeholder="Search..." readOnly onClick={() => setPage('Overview')} />
      </div>

      {/* Main "Home" Group */}
      <div className="zendo-nav-group-label">Home</div>
      <nav className="zendo-nav-list">
        {mainNav.map(item => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              className={`zendo-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontWeight: 700,
                    color: isActive ? '#fff' : '#475569'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* "Others" Group */}
      <div className="zendo-nav-group-label" style={{ marginTop: 20 }}>Others</div>
      <nav className="zendo-nav-list">
        {othersNav.map(item => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              className={`zendo-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile & Logout in Sidebar Footer */}
      <div className="zendo-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => setPage('Profile')}
          >
            <div className="user-profile-badge" style={{ width: 36, height: 36, fontSize: 13 }}>
              {initials(user?.name)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>
          <button
            title="Sign out"
            onClick={onLogout}
            style={{ color: '#94a3b8', padding: 6, borderRadius: 6 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
