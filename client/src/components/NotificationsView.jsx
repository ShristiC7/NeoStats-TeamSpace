import React, { useState } from 'react';
import {
  Bell, CheckCircle, Clock, AlertTriangle, MessageSquare,
  UserPlus, FolderKanban, Settings, Trash2, Check
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const fmtRelative = d => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
};

const INITIAL_NOTIFS = [
  {
    id: 1, type: 'task_assigned', icon: FolderKanban, color: '#6d28d9',
    title: 'Task Assigned to You',
    body: 'Avery Admin assigned you to "Implement Concurrency Locking" in Mobile App Redesign.',
    time: new Date(Date.now() - 1200000), read: false
  },
  {
    id: 2, type: 'task_completed', icon: CheckCircle, color: '#059669',
    title: 'Task Completed',
    body: 'Taylor Member completed "Design Kanban Board" in Website Design.',
    time: new Date(Date.now() - 3600000), read: false
  },
  {
    id: 3, type: 'comment', icon: MessageSquare, color: '#2563eb',
    title: 'New Comment',
    body: 'Morgan Manager commented on "User Research Analysis": "Great progress, please send to QA."',
    time: new Date(Date.now() - 7200000), read: false
  },
  {
    id: 4, type: 'member_added', icon: UserPlus, color: '#0891b2',
    title: 'Added to Project',
    body: 'You were added to "Website Design" as a Team Member.',
    time: new Date(Date.now() - 86400000), read: true
  },
  {
    id: 5, type: 'task_due', icon: Clock, color: '#d97706',
    title: 'Task Due Soon',
    body: '"Landing Page Wireframes" is due tomorrow. Don\'t miss the deadline!',
    time: new Date(Date.now() - 172800000), read: true
  },
  {
    id: 6, type: 'conflict', icon: AlertTriangle, color: '#dc2626',
    title: 'Edit Conflict Detected',
    body: 'Your update to "API Integration" was rejected — the task was modified by another user. Please reload and retry.',
    time: new Date(Date.now() - 259200000), read: true
  },
];

const TYPE_LABELS = {
  all: 'All',
  task_assigned: 'Assigned',
  task_completed: 'Completed',
  comment: 'Comments',
  member_added: 'Members',
  task_due: 'Due Soon',
  conflict: 'Conflicts',
};

export default function NotificationsView({ user }) {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [filter, setFilter] = useState('all');

  const displayed = filter === 'all'
    ? notifs
    : notifs.filter(n => n.type === filter);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const deleteNotif = (id) => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div className="notifications-view">
      <div className="page-heading" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ background: '#6d28d9', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '2px 10px' }}>
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="muted">Stay updated on tasks, comments, and project activity.</p>
        </div>
        <div className="heading-actions">
          {unreadCount > 0 && (
            <button className="btn secondary" onClick={markAllRead}>
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="segmented-pill-bar" style={{ marginBottom: 20, width: 'fit-content' }}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`segmented-pill-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {key === 'all' && unreadCount > 0 && (
              <span style={{ marginLeft: 4, background: '#6d28d9', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 5px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <Bell size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No notifications here!</p>
          </div>
        )}

        {displayed.map(n => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`notification-item ${!n.read ? 'unread' : ''}`}
              onClick={() => markRead(n.id)}
            >
              <div className="notif-icon-wrap" style={{ background: n.color + '15', color: n.color }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: n.read ? 600 : 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>
                      {n.title}
                      {!n.read && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#6d28d9', marginLeft: 7, verticalAlign: 'middle' }} />}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{n.body}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtRelative(n.time)}</span>
                    <button
                      className="zendo-more-btn"
                      style={{ padding: 4, color: '#94a3b8' }}
                      onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                      title="Dismiss"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
