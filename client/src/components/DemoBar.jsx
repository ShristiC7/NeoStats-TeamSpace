import React from 'react';
import { Shield, UserCheck, Eye, Terminal } from 'lucide-react';

export default function DemoBar({ currentUser, onSwitchRole }) {
  const roles = [
    { id: 'admin', label: 'Admin', email: 'admin@teamspace.local', icon: Shield, desc: 'All privileges & user admin' },
    { id: 'project_manager', label: 'Project Manager', email: 'manager@teamspace.local', icon: Terminal, desc: 'Manages assigned projects & tasks' },
    { id: 'team_member', label: 'Team Member', email: 'member@teamspace.local', icon: UserCheck, desc: 'Updates assigned tasks & comments' },
    { id: 'viewer', label: 'Viewer', email: 'viewer@teamspace.local', icon: Eye, desc: 'Read-only access' }
  ];

  return (
    <div className="demo-bar">
      <div className="demo-bar-left">
        <span className="demo-bar-badge">NeoStats Hackathon Evaluation Mode</span>
        <span>Quick Role Switcher:</span>
      </div>
      <div className="demo-bar-roles">
        {roles.map(r => {
          const Icon = r.icon;
          const isActive = currentUser?.role === r.id;
          return (
            <button
              key={r.id}
              className={`demo-role-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSwitchRole(r.email, 'Admin123!')}
              title={`${r.desc} (${r.email})`}
            >
              <Icon size={14} />
              <span>{r.label}</span>
              {isActive && <span style={{ fontSize: '10px', opacity: 0.8 }}>(active)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
