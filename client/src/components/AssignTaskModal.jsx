import React, { useState, useEffect } from 'react';
import {
  X, CheckSquare, Calendar, Flag, User, Mail, Send,
  AlertCircle, Sparkles, FolderKanban, CheckCircle2, Info
} from 'lucide-react';

const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low', color: '#64748b', bg: '#f1f5f9' },
  { id: 'medium', label: 'Medium', color: '#2563eb', bg: '#eff6ff' },
  { id: 'high', label: 'High', color: '#d97706', bg: '#fef3c7' },
  { id: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fee2e2' }
];

export default function AssignTaskModal({
  isOpen,
  onClose,
  projects = [],
  defaultProjectId = '',
  assignableUsers = [],
  currentUser,
  onSubmit
}) {
  const [projectId, setProjectId] = useState(defaultProjectId || (projects[0]?._id || ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [defaultProjectId, projects]);

  if (!isOpen) return null;

  const selectedProject = projects.find(p => String(p._id) === String(projectId));
  const selectedUser = assignableUsers.find(u => String(u._id) === String(assigneeId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!projectId) {
      setError('Please select a project for this task.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        projectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee: assigneeId || null,
        dueDate: dueDate || null,
        status
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDue = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 580, width: '100%', borderRadius: 16 }}>
        {/* Header */}
        <div className="modal-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #6d28d9, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <CheckSquare size={18} />
            </div>
            <div>
              <span className="eyebrow" style={{ fontSize: 10, letterSpacing: 0.8, color: '#6d28d9', fontWeight: 700 }}>
                TASK ASSIGNMENT & DISPATCH
              </span>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700, color: '#0f172a' }}>
                Assign New Task
              </h2>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="muted" style={{ fontSize: 13, color: '#64748b', marginTop: -8, marginBottom: 18 }}>
          Create a deliverable and assign it to a team member. An automated email notification will be dispatched immediately.
        </p>

        {error && (
          <div className="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Project Selector */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <FolderKanban size={14} color="#6d28d9" /> Select Project
          </span>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            required
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
          >
            {projects.map(p => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.status === 'active' ? 'Active' : 'Archived'})
              </option>
            ))}
          </select>
        </label>

        {/* Task Title */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
            Task Title *
          </span>
          <input
            required
            maxLength={140}
            placeholder="e.g. Implement OAuth 2.0 and Email Dispatch Service"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
          />
        </label>

        {/* Description */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>
            Description
          </span>
          <textarea
            rows={3}
            placeholder="Detail deliverables, requirements, acceptance criteria, or reference links..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
          />
        </label>

        {/* Assignee & Due Date Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Assignee Selector */}
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <User size={14} color="#2563eb" /> Assign To
            </span>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>

          {/* Due Date */}
          <label style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#059669" /> Due Date
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => handleQuickDue(0)} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>Today</button>
                <button type="button" onClick={() => handleQuickDue(3)} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>+3d</button>
                <button type="button" onClick={() => handleQuickDue(7)} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>+1w</button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </label>
        </div>

        {/* Priority Selector */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Flag size={14} color="#d97706" /> Priority Level
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRIORITY_OPTIONS.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPriority(p.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: priority === p.id ? '2px solid ' + p.color : '1px solid #e2e8f0',
                  background: priority === p.id ? p.bg : '#fff',
                  color: priority === p.id ? p.color : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Automated Email Notification Callout */}
        {selectedUser ? (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <Mail size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
                Automated Email Notification Active (Feature 1)
              </div>
              <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                An email notification with task details, priority, and link will be immediately delivered to <strong>{selectedUser.name}</strong> (<code>{selectedUser.email}</code>).
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#64748b'
          }}>
            <Info size={15} />
            <span>Select an assignee above to trigger automated email notification.</span>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6d28d9' }}
          >
            {submitting ? (
              <span>Assigning...</span>
            ) : (
              <>
                <Send size={14} /> Assign Task & Send Email
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
