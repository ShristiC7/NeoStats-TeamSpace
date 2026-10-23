import React, { useState } from 'react';
import {
  Kanban, Plus, Search, Filter, MoreVertical,
  Calendar, User, Flag, ChevronDown
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const COLORS = ['#6d28d9','#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'];
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return COLORS[Math.abs(h) % COLORS.length];
}

const fmt = d => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748b', bg: '#f8fafc' },
  { id: 'in_progress', label: 'In Progress', color: '#2563eb', bg: '#eff6ff' },
  { id: 'blocked', label: 'Blocked', color: '#dc2626', bg: '#fef2f2' },
  { id: 'done', label: 'Done', color: '#16a34a', bg: '#f0fdf4' },
];

const PRIORITY_COLORS = {
  urgent: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#64748b'
};

function TaskCard({ task, project, onOpenTask, onChangeStatus }) {
  const [dragging, setDragging] = useState(false);
  const col = COLUMNS.find(c => c.id === task.status);

  return (
    <div
      className="kanban-task-card"
      style={{ opacity: dragging ? 0.5 : 1 }}
      draggable
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      onClick={() => onOpenTask(task)}
    >
      {/* Priority Flag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
          color: PRIORITY_COLORS[task.priority] || '#64748b',
          background: (PRIORITY_COLORS[task.priority] || '#64748b') + '15',
          padding: '2px 7px', borderRadius: 5
        }}>
          {task.priority || 'medium'}
        </span>
        <button className="zendo-more-btn" onClick={e => { e.stopPropagation(); }}>
          <MoreVertical size={13} />
        </button>
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', lineHeight: 1.4, marginBottom: 8 }}>
        {task.title}
      </div>

      {task.description && (
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </div>
      )}

      {/* Project Tag */}
      {project && (
        <div style={{ fontSize: 11, color: '#6d28d9', background: '#ede9fe', borderRadius: 5, padding: '2px 7px', display: 'inline-block', marginBottom: 8 }}>
          {project.name}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.dueDate ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
            <Calendar size={11} />
            {fmt(task.dueDate)}
          </div>
        ) : <div />}

        {task.assignee ? (
          <div className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, background: colorFor(task.assignee.name) }}>
            {initials(task.assignee.name)}
          </div>
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={11} color="#94a3b8" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanDeskView({ user, projects = [], tasks = [], onOpenTask, onChangeStatus, onOpenProject }) {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dragOver, setDragOver] = useState(null);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || (t.title + (t.description || '') + (t.assignee?.name || '')).toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === 'all' || String(t.project?._id || t.project) === projectFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchProject && matchPriority;
  });

  const getColTasks = (colId) => filtered.filter(t => t.status === colId);

  const handleDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId); };
  const handleDrop = (e, colId) => {
    setDragOver(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (task && task.status !== colId) onChangeStatus(task, colId);
  };

  return (
    <div>
      <div className="page-heading" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Kanban size={22} color="#6d28d9" />
            Kanban Desk
          </h1>
          <p className="muted">Drag and drop tasks across all projects in a unified board view.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ width: 240 }}>
          <Search size={14} />
          <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#475569' }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#475569' }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
          {filtered.length} tasks
        </span>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board" style={{ overflowX: 'auto' }}>
        {COLUMNS.map(col => {
          const colTasks = getColTasks(col.id);
          return (
            <div
              key={col.id}
              className="kanban-col"
              style={{ background: dragOver === col.id ? col.bg : '#fff', transition: 'background 0.15s' }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className="kanban-col-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{col.label}</span>
                  <span style={{ marginLeft: 4, background: col.color + '20', color: col.color, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {colTasks.map(task => {
                  const project = projects.find(p => String(p._id) === String(task.project?._id || task.project));
                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={e => { e.dataTransfer.setData('taskId', task._id); }}
                    >
                      <TaskCard
                        task={task}
                        project={project}
                        onOpenTask={onOpenTask}
                        onChangeStatus={onChangeStatus}
                      />
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '28px 16px', color: '#cbd5e1', fontSize: 12, border: '2px dashed #e2e8f0', borderRadius: 10 }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
