import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock3,
  Calendar,
  AlertTriangle,
  Zap,
  Save,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Lock,
  User
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = d => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'None';

export default function TaskDetailModal({
  task,
  user,
  project,
  comments,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onDeleteComment,
  onSimulateConflict,
  onReloadTask
}) {
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    assignee: task.assignee?._id || task.assignee || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
  });

  const [commentText, setCommentText] = useState('');
  const [conflictState, setConflictState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localNotice, setLocalNotice] = useState('');

  useEffect(() => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      assignee: task.assignee?._id || task.assignee || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setConflictState(null);
  }, [task]);

  const currentMember = project?.members?.find(m => String(m.user?._id || m.user) === String(user?._id));
  const isManager = user?.role === 'admin' || currentMember?.role === 'manager';
  const isAssigned = String(task.assignee?._id || task.assignee || '') === String(user?._id);
  const canEditFull = isManager;
  const canEditStatusOnly = !isManager && user?.role === 'team_member' && isAssigned;
  const isViewer = user?.role === 'viewer';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setLocalError('');
    setLocalNotice('');

    try {
      const payload = canEditFull
        ? {
            title: form.title,
            description: form.description,
            status: form.status,
            priority: form.priority,
            assignee: form.assignee || null,
            dueDate: form.dueDate || null,
            expectedVersion: task.version
          }
        : {
            status: form.status,
            expectedVersion: task.version
          };

      await onUpdateTask(task._id, payload);
      setLocalNotice('Task saved successfully! Version incremented.');
      setConflictState(null);
    } catch (err) {
      if (err.status === 409) {
        setConflictState(err.payload?.error || {
          message: 'Conflict detected: Task was modified in another session.',
          currentVersion: (task.version || 0) + 1,
          submittedVersion: task.version
        });
      } else {
        setLocalError(err.message || 'Failed to update task.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateConflict = async () => {
    setSimulating(true);
    setLocalError('');
    try {
      const res = await onSimulateConflict(task);
      setConflictState(res);
    } catch (err) {
      if (err.status === 409) {
        setConflictState(err.payload?.error || err);
      } else {
        setLocalError(err.message || 'Simulation error');
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleLoadLatest = async () => {
    await onReloadTask(task._id);
    setConflictState(null);
    setLocalNotice('Loaded latest task version from server.');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await onAddComment(task._id, commentText);
      setCommentText('');
    } catch (err) {
      setLocalError(err.message || 'Failed to post comment.');
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal task-modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">{project?.name?.toUpperCase() || 'TASK'}</span>
            <span className="kanban-card-version">v{task.version}</span>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Status notice or errors */}
        {localNotice && (
          <div className="notice" style={{ marginBottom: 14 }}>
            <CheckCircle2 size={16} /> {localNotice}
          </div>
        )}
        {localError && (
          <div className="alert" style={{ marginBottom: 14 }}>
            <AlertTriangle size={16} /> {localError}
          </div>
        )}

        {/* 409 CONFLICT DETECTED BANNER */}
        {conflictState && (
          <div className="conflict-box">
            <div className="conflict-box-title">
              <AlertTriangle size={18} />
              <span>Optimistic Concurrency Conflict (HTTP 409)</span>
            </div>
            <div className="conflict-box-text">
              This task was modified concurrently by another team member! The server is currently at <b>Version {conflictState.currentVersion || (task.version + 1)}</b>, but your edit was based on <b>Version {conflictState.submittedVersion ?? task.version}</b>.
            </div>
            <div className="conflict-box-actions">
              <button
                type="button"
                className="btn primary"
                onClick={handleLoadLatest}
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                <RefreshCw size={14} /> Review & Load Latest State
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setConflictState(null)}
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* TASK FORM */}
        <form onSubmit={handleSave}>
          {canEditFull ? (
            <>
              <label>
                Task Title
                <input
                  required
                  maxLength={180}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </>
          ) : (
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>{task.title}</h2>
              <p className="muted" style={{ lineHeight: 1.5, marginBottom: 16 }}>
                {task.description || 'No description provided.'}
              </p>
            </div>
          )}

          <div className="form-row" style={{ marginTop: 12 }}>
            <label>
              Status
              {canEditFull || canEditStatusOnly ? (
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <input disabled value={task.status.replace('_', ' ')} />
              )}
            </label>

            <label>
              Priority
              {canEditFull ? (
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <input disabled value={task.priority} />
              )}
            </label>
          </div>

          <div className="form-row">
            <label>
              Assignee
              {canEditFull ? (
                <select
                  value={form.assignee}
                  onChange={e => setForm({ ...form, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {(project?.members || []).map(m => (
                    <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                      {m.user?.name || 'Member'}
                    </option>
                  ))}
                </select>
              ) : (
                <input disabled value={task.assignee?.name || 'Unassigned'} />
              )}
            </label>

            <label>
              Due Date
              {canEditFull ? (
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              ) : (
                <input disabled value={fmtDate(task.dueDate)} />
              )}
            </label>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(canEditFull || canEditStatusOnly) && (
                <button type="submit" className="btn primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Task'}
                </button>
              )}

              {/* SIMULATE 409 CONFLICT BUTTON */}
              {(canEditFull || canEditStatusOnly) && (
                <button
                  type="button"
                  className="btn secondary"
                  title="Simulates a concurrent edit from another user to trigger and demonstrate the server HTTP 409 check"
                  onClick={handleSimulateConflict}
                  disabled={simulating}
                  style={{ background: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }}
                >
                  <Zap size={14} color="#d97706" /> {simulating ? 'Simulating...' : 'Test 409 Conflict'}
                </button>
              )}
            </div>

            {isManager && (
              <button
                type="button"
                className="icon-btn"
                title="Delete task"
                style={{ color: '#ef4444' }}
                onClick={() => onDeleteTask(task._id)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </form>

        {/* COMMENTS SECTION */}
        <div className="comments" style={{ marginTop: 24 }}>
          <h3>
            <MessageSquare size={16} /> Comments <span>{comments.length}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
            {comments.map(c => {
              const isCommentAuthor = String(c.author?._id || c.author) === String(user?._id);
              const canDeleteComment = isManager || isCommentAuthor;

              return (
                <div key={c._id} className="comment" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div className="avatar small-avatar">{initials(c.author?.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <b>
                        {c.author?.name}{' '}
                        <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>
                          ({c.author?.role?.replace('_', ' ')})
                        </span>
                      </b>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <small>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        {canDeleteComment && (
                          <button
                            className="icon-btn"
                            title="Delete comment"
                            style={{ padding: 2, color: '#94a3b8' }}
                            onClick={() => onDeleteComment(c._id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.45 }}>{c.body}</p>
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '12px 0' }}>
                No comments yet. Be the first to share an update.
              </div>
            )}
          </div>

          {!isViewer ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                placeholder="Write a comment or ask for feedback..."
                required
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn primary" style={{ alignSelf: 'flex-end' }}>
                Post Comment
              </button>
            </form>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, padding: 8 }}>
              <Lock size={13} /> Viewers have read-only access and cannot post comments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
