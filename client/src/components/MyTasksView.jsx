import React, { useState } from 'react';
import {
  Plus,
  CheckSquare, Search, Filter, Calendar, Flag, ArrowUpRight,
  Clock, CheckCircle2, XCircle, AlertCircle, BarChart2,
  FolderKanban, User
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: '#64748b', bg: '#f1f5f9', icon: Clock },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', icon: BarChart2 },
  blocked:     { label: 'Blocked',     color: '#dc2626', bg: '#fef2f2', icon: XCircle },
  done:        { label: 'Done',        color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 },
};

const PRIORITY_COLORS = {
  urgent: { color: '#dc2626', bg: '#fee2e2' },
  high:   { color: '#d97706', bg: '#fef3c7' },
  medium: { color: '#2563eb', bg: '#dbeafe' },
  low:    { color: '#64748b', bg: '#f1f5f9' },
};

const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
const isOverdue = d => d && new Date(d) < new Date() ? true : false;

export default function MyTasksView({ user, tasks, projects, onOpenTask, onChangeStatus, onOpenProject, onOpenAssignTask }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate | priority | status
  const [view, setView] = useState('list'); // list | grouped

  const myTasks = tasks.filter(t => {
    const assigneeId = t.assignee?._id || t.assignee;
    return String(assigneeId) === String(user._id);
  });

  const filtered = myTasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchSearch = (`${t.title} ${t.description || ''}`).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    }
    if (sortBy === 'status') {
      const order = { todo: 0, in_progress: 1, blocked: 2, done: 3 };
      return (order[a.status] ?? 0) - (order[b.status] ?? 0);
    }
    return 0;
  });

  const getProject = t => projects.find(p => String(p._id) === String(t.project?._id || t.project));

  const statCounts = {
    all: myTasks.length,
    todo: myTasks.filter(t => t.status === 'todo').length,
    in_progress: myTasks.filter(t => t.status === 'in_progress').length,
    blocked: myTasks.filter(t => t.status === 'blocked').length,
    done: myTasks.filter(t => t.status === 'done').length,
    overdue: myTasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length,
  };

  const completionPct = myTasks.length > 0 ? Math.round((statCounts.done / myTasks.length) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div className="page-heading">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            TASK MANAGEMENT
          </div>
          <h1>My Tasks</h1>
          <p className="muted">All tasks assigned to you across every project.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn primary" onClick={() => onOpenAssignTask && onOpenAssignTask()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Assign Task
          </button>
          <div style={{
            background: 'linear-gradient(135deg, #6d28d9, #2563eb)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
          }}>
            {completionPct}% Complete
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'all',         label: 'Total',      color: '#6d28d9', bg: '#f5f3ff' },
          { key: 'in_progress', label: 'In Progress', color: '#2563eb', bg: '#eff6ff' },
          { key: 'todo',        label: 'To Do',       color: '#64748b', bg: '#f8fafc' },
          { key: 'blocked',     label: 'Blocked',     color: '#dc2626', bg: '#fef2f2' },
          { key: 'done',        label: 'Done',        color: '#16a34a', bg: '#f0fdf4' },
          { key: 'overdue',     label: 'Overdue',     color: '#f97316', bg: '#fff7ed' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => s.key !== 'overdue' && setStatusFilter(s.key)}
            style={{
              background: s.bg,
              border: `1px solid ${s.color}25`,
              borderRadius: 12,
              padding: '14px 16px',
              textAlign: 'left',
              cursor: s.key === 'overdue' ? 'default' : 'pointer',
              transition: 'transform 0.15s ease',
              outline: statusFilter === s.key ? `2px solid ${s.color}` : 'none',
            }}
            title={s.key === 'overdue' ? 'Tasks past due date' : `Filter by ${s.label}`}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{statCounts[s.key]}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="searchbox" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13 }}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>

        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13 }}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13 }}>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
        </select>

        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {sorted.length} task{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task List */}
      {sorted.length === 0 ? (
        <div className="empty panel" style={{ padding: 56, textAlign: 'center' }}>
          <CheckSquare size={36} color="#6d28d9" style={{ marginBottom: 12 }} />
          <b style={{ fontSize: 16 }}>No tasks found</b>
          <span style={{ color: '#64748b', marginTop: 4 }}>
            {myTasks.length === 0
              ? 'You have no tasks assigned. Ask your project manager to assign tasks to you.'
              : 'Try adjusting your search or filters.'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(task => {
            const proj = getProject(task);
            const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            const StatusIcon = sc.icon;
            const overdue = task.status !== 'done' && isOverdue(task.dueDate);

            return (
              <div
                key={task._id}
                className="panel"
                onClick={() => onOpenTask(task)}
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  borderLeft: `3px solid ${sc.color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(109,40,217,0.1)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                {/* Status Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: sc.bg, flexShrink: 0
                }}>
                  <StatusIcon size={16} color={sc.color} />
                </div>

                {/* Task Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Project */}
                    {proj && (
                      <button
                        onClick={e => { e.stopPropagation(); onOpenProject(proj._id); }}
                        style={{
                          fontSize: 11, color: '#6d28d9', background: '#f5f3ff', padding: '2px 8px',
                          borderRadius: 5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <FolderKanban size={11} /> {proj.name}
                      </button>
                    )}

                    {/* Priority */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: pc.color, background: pc.bg, padding: '2px 7px', borderRadius: 5
                    }}>
                      {task.priority || 'medium'}
                    </span>

                    {/* Due Date */}
                    {task.dueDate && (
                      <span style={{
                        fontSize: 11, color: overdue ? '#dc2626' : '#64748b',
                        display: 'flex', alignItems: 'center', gap: 4, fontWeight: overdue ? 700 : 400
                      }}>
                        <Calendar size={11} />
                        {overdue && <AlertCircle size={11} color="#dc2626" />}
                        {fmt(task.dueDate)}
                        {overdue && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg,
                  padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {sc.label}
                </div>

                {/* Status Change */}
                <select
                  value={task.status}
                  onChange={e => { e.stopPropagation(); onChangeStatus(task, e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0',
                    background: '#fff', fontSize: 12, cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>

                <ArrowUpRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
