import React, { useState } from 'react';
import {
  FolderKanban, ArrowLeft, Archive, RotateCcw, Trash2, Plus, Users,
  CheckSquare, Search, Kanban, Table as TableIcon, Shield, UserMinus,
  ArrowUpRight, Sparkles, Calendar, Globe, ExternalLink, Edit3, Code2, Link2, AlertCircle
} from 'lucide-react';

const fmt = s => s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';
const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

function isValidHttpUrl(str) {
  if (!str) return true;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export default function ProjectDetailView({
  project, tasks, user, onBack, onOpenTask, onCreateTask, onUpdateProject,
  onToggleArchive, onDeleteProject, onAddMember, onChangeMemberRole,
  onRemoveMember, onChangeStatus, assignableUsers
}) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [viewMode, setViewMode] = useState('kanban');
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectRole, setSelectedProjectRole] = useState('member');

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignee: '', dueDate: '' });

  const [showLinksModal, setShowLinksModal] = useState(false);
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linksError, setLinksError] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);

  if (!project) return null;

  const currentMember = project.members?.find(m => String(m.user?._id || m.user) === String(user?._id));
  const isManager = user?.role === 'admin' || currentMember?.role === 'manager';
  const isAdmin = user?.role === 'admin';

  const visibleTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch = (`${t.title} ${t.description} ${t.assignee?.name || ''}`).toLowerCase().includes(taskSearch.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const columns = [
    { id: 'todo', label: 'To Do', color: '#64748b' },
    { id: 'in_progress', label: 'In Progress', color: '#2563eb' },
    { id: 'blocked', label: 'Blocked', color: '#dc2626' },
    { id: 'done', label: 'Done', color: '#16a34a' }
  ];

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await onCreateTask({ ...taskForm, assignee: taskForm.assignee || null, dueDate: taskForm.dueDate || null });
    setShowCreateTaskModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assignee: '', dueDate: '' });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await onAddMember(project._id, selectedUserId, selectedProjectRole);
    setShowAddMemberModal(false);
    setSelectedUserId('');
    setSelectedProjectRole('member');
  };

  const handleOpenLinksModal = () => {
    setLiveDemoUrl(project.liveDemoUrl || '');
    setGithubUrl(project.githubUrl || '');
    setLinksError('');
    setShowLinksModal(true);
  };

  const handleSaveLinks = async (e) => {
    e.preventDefault();
    setLinksError('');
    const demoTrimmed = liveDemoUrl.trim();
    const ghTrimmed = githubUrl.trim();
    if (demoTrimmed && !isValidHttpUrl(demoTrimmed)) {
      setLinksError('Live Demo URL must be a valid HTTP or HTTPS URL (e.g. https://example.com).');
      return;
    }
    if (ghTrimmed && !isValidHttpUrl(ghTrimmed)) {
      setLinksError('GitHub URL must be a valid HTTP or HTTPS URL (e.g. https://github.com/org/repo).');
      return;
    }
    setSavingLinks(true);
    try {
      await onUpdateProject({ liveDemoUrl: demoTrimmed || '', githubUrl: ghTrimmed || '' });
      setShowLinksModal(false);
    } catch (err) {
      setLinksError(err.message || 'Failed to save project links.');
    } finally {
      setSavingLinks(false);
    }
  };

  const existingMemberIds = new Set((project.members || []).map(m => String(m.user?._id || m.user)));
  const availableUsersToAdd = assignableUsers.filter(u => !existingMemberIds.has(String(u._id)));
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button className="text-btn" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <ArrowLeft size={16} /> Back to Projects Portfolio
        </button>
      </div>

      <div className="page-heading" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className={project.status === 'archived' ? 'tag archived' : 'tag'}>
              {project.status}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Created by {project.owner?.name || 'Administrator'}
            </span>
          </div>
          <h1>{project.name}</h1>
          <p className="muted">{project.description || 'No description provided for this project.'}</p>
        </div>

        <div className="heading-actions">
          {isManager && (
            <button
              className="btn secondary"
              title={project.status === 'archived' ? 'Restore Project' : 'Archive Project'}
              onClick={() => onToggleArchive(project)}
            >
              {project.status === 'archived' ? <RotateCcw size={15} /> : <Archive size={15} />}
              {project.status === 'archived' ? 'Restore' : 'Archive'}
            </button>
          )}

          {isAdmin && (
            <button
              className="btn secondary"
              style={{ color: '#dc2626' }}
              title="Permanently Delete Project"
              onClick={() => onDeleteProject(project._id)}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}

          {isManager && (
            <button className="btn primary" onClick={() => setShowCreateTaskModal(true)}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* FEATURE 2: PROJECT LINKS SECTION */}
      <div className="project-links-bar" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
            <Link2 size={14} color="#6d28d9" /> Links:
          </div>

          {/* Live Demo Link */}
          {project.liveDemoUrl ? (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link-badge demo"
              title={`Open Live Demo: ${project.liveDemoUrl}`}
            >
              <Globe size={14} />
              <span>Live Demo</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </a>
          ) : (
            <div className="project-link-badge empty" title="No live demo URL configured">
              <Globe size={14} style={{ opacity: 0.4 }} />
              <span>No Live Demo</span>
            </div>
          )}

          {/* GitHub Repo Link */}
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link-badge github"
              title={`Open GitHub Repository: ${project.githubUrl}`}
            >
              <Code2 size={14} />
              <span>GitHub Repository</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </a>
          ) : (
            <div className="project-link-badge empty" title="No repository URL configured">
              <Code2 size={14} style={{ opacity: 0.4 }} />
              <span>No Repository</span>
            </div>
          )}

          {/* Manage Links Button for Managers */}
          {isManager && (
            <button
              className="text-btn"
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: '#6d28d9', fontWeight: 600 }}
              onClick={handleOpenLinksModal}
            >
              <Edit3 size={13} />
              {project.liveDemoUrl || project.githubUrl ? 'Edit Project Links' : 'Add Project Links'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={16} /> Tasks ({tasks.length})
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={16} /> Team Members ({project.members?.length || 0})
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FolderKanban size={16} /> Overview & Analytics
        </button>
      </div>
      {/* TAB 1: TASKS BOARD / LIST */}
      {activeTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
            <div className="searchbox" style={{ width: 240 }}>
              <Search size={15} />
              <input
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
            >
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginLeft: 'auto' }}>
              <button
                className={`icon-btn ${viewMode === 'kanban' ? 'selected' : ''}`}
                style={{ borderRadius: 0, padding: '6px 12px', background: viewMode === 'kanban' ? '#ede9fe' : '#fff' }}
                title="Kanban Board View"
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={16} color={viewMode === 'kanban' ? '#6d28d9' : '#64748b'} />
              </button>
              <button
                className={`icon-btn ${viewMode === 'table' ? 'selected' : ''}`}
                style={{ borderRadius: 0, padding: '6px 12px', background: viewMode === 'table' ? '#ede9fe' : '#fff' }}
                title="Table View"
                onClick={() => setViewMode('table')}
              >
                <TableIcon size={16} color={viewMode === 'table' ? '#6d28d9' : '#64748b'} />
              </button>
            </div>
          </div>

          {/* Kanban Board Mode */}
          {viewMode === 'kanban' ? (
            <div className="kanban-board">
              {columns.map(col => {
                const colTasks = visibleTasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-col">
                    <div className="kanban-col-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{col.label}</span>
                        <span style={{ background: '#f1f5f9', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, color: '#64748b' }}>
                          {colTasks.length}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {colTasks.map(t => {
                        const isAssigned = String(t.assignee?._id || '') === String(user._id);
                        const canChangeStatus = isManager || (user.role === 'team_member' && isAssigned);

                        return (
                          <div
                            key={t._id}
                            className="kanban-card"
                            onClick={() => onOpenTask(t)}
                          >
                            <div className="kanban-card-top">
                              <span className={`priority-tag ${t.priority}`}>
                                {t.priority}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span className="kanban-card-version">v{t.version}</span>
                                {canChangeStatus && (
                                  <select
                                    className="mini-status-select"
                                    value={t.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => {
                                      e.stopPropagation();
                                      onChangeStatus(t, e.target.value);
                                    }}
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="done">Done</option>
                                  </select>
                                )}
                              </div>
                            </div>

                            <div className="kanban-card-title">{t.title}</div>
                            {t.description && <div className="kanban-card-desc">{t.description}</div>}

                            <div className="kanban-card-foot">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="avatar small-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                                  {initials(t.assignee?.name || 'U')}
                                </div>
                                <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.assignee?.name || 'Unassigned'}
                                </span>
                              </div>

                              {t.dueDate && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                                  <Calendar size={11} /> {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px 8px', color: '#94a3b8', fontSize: 12 }}>
                          No tasks in {col.label.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View Mode */
            <div className="table-wrap panel">
              <table>
                <thead>
                  <tr>
                    <th>TASK</th>
                    <th>ASSIGNEE</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>VERSION</th>
                    <th>DUE DATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map(t => {
                    const isAssigned = String(t.assignee?._id || '') === String(user._id);
                    const canChangeStatus = isManager || (user.role === 'team_member' && isAssigned);

                    return (
                      <tr key={t._id}>
                        <td>
                          <button className="task-title" onClick={() => onOpenTask(t)}>
                            <span className={`task-check-small ${t.status === 'done' ? 'checked' : ''}`}>
                              {t.status === 'done' ? '✓' : ''}
                            </span>
                            <span>
                              <b>{t.title}</b>
                              <small>{t.description || 'No description'}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <div className="assignee">
                            <div className="avatar small-avatar">{initials(t.assignee?.name || 'Unassigned')}</div>
                            <span>{t.assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`priority ${t.priority}`}>{t.priority}</span>
                        </td>
                        <td>
                          {canChangeStatus ? (
                            <select
                              className={`status-select ${t.status}`}
                              value={t.status}
                              onChange={e => onChangeStatus(t, e.target.value)}
                            >
                              <option value="todo">To do</option>
                              <option value="in_progress">In progress</option>
                              <option value="blocked">Blocked</option>
                              <option value="done">Done</option>
                            </select>
                          ) : (
                            <span className={`status-label ${t.status}`}>{t.status.replace('_', ' ')}</span>
                          )}
                        </td>
                        <td>
                          <span className="kanban-card-version">v{t.version}</span>
                        </td>
                        <td>
                          <span className="due-date">{fmt(t.dueDate)}</span>
                        </td>
                        <td>
                          <button className="icon-btn row-more" title="View details" onClick={() => onOpenTask(t)}>
                            <ArrowUpRight size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleTasks.length === 0 && (
                <div className="empty">
                  <CheckSquare size={24} />
                  <b>No tasks found</b>
                  <span>No tasks match the active filters.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* TAB 2: TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Project Team Members</h3>
              <p className="muted">Manage project-level roles: Manager, Member, and Viewer.</p>
            </div>
            {isManager && (
              <button className="btn primary" onClick={() => setShowAddMemberModal(true)}>
                <Plus size={16} /> Add Member
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>WORKSPACE ROLE</th>
                  <th>PROJECT ROLE</th>
                  {isManager && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {(project.members || []).map(m => {
                  const mUser = m.user;
                  const memberId = mUser?._id || mUser;

                  return (
                    <tr key={memberId}>
                      <td>
                        <div className="person-cell">
                          <div className="avatar">{initials(mUser?.name || 'M')}</div>
                          <div>
                            <b>{mUser?.name || 'Member'}</b>
                            <small>{mUser?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="role-pill">{(mUser?.role || 'team_member').replace('_', ' ')}</span>
                      </td>
                      <td>
                        {isManager ? (
                          <select
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600, fontSize: 13 }}
                            value={m.role}
                            onChange={e => onChangeMemberRole(project._id, memberId, e.target.value)}
                          >
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                        )}
                      </td>
                      {isManager && (
                        <td>
                          <button
                            className="icon-btn"
                            title="Remove member from project"
                            style={{ color: '#ef4444' }}
                            onClick={() => onRemoveMember(project._id, memberId)}
                          >
                            <UserMinus size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-heading">
              <h3>Project Summary</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <b style={{ fontSize: 13, color: '#64748b', display: 'block' }}>DESCRIPTION</b>
                <p style={{ marginTop: 4, lineHeight: 1.6 }}>{project.description || 'No description provided.'}</p>
              </div>

              <div>
                <b style={{ fontSize: 13, color: '#64748b', display: 'block' }}>OVERALL PROGRESS</b>
                <div className="progress-label" style={{ marginTop: 8 }}>
                  <span>Completed tasks</span>
                  <b>{progressPct}%</b>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 8 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <small style={{ color: '#64748b' }}>TOTAL TASKS</small>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{tasks.length}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <small style={{ color: '#64748b' }}>DONE TASKS</small>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{doneCount}</div>
                </div>
              </div>

              {/* Project Links Section in Overview */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <b style={{ fontSize: 13, color: '#64748b' }}>PROJECT LINKS & RESOURCES</b>
                  {isManager && (
                    <button className="text-btn" style={{ fontSize: 12 }} onClick={handleOpenLinksModal}>
                      <Edit3 size={12} /> Edit Links
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe size={15} color="#2563eb" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Live Demo:</span>
                    </div>
                    {project.liveDemoUrl ? (
                      <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        {project.liveDemoUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Not configured</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Code2 size={15} color="#0f172a" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Repository:</span>
                    </div>
                    {project.githubUrl ? (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        {project.githubUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <h3>Project Governance</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8 }}>
                <b style={{ fontSize: 12, color: '#475569' }}>WORKSPACE OWNER</b>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{project.owner?.name || 'Administrator'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{project.owner?.email}</div>
              </div>

              <div style={{ background: '#ede9fe', padding: 12, borderRadius: 8 }}>
                <b style={{ fontSize: 12, color: '#6d28d9' }}>PROJECT MANAGERS</b>
                <div style={{ marginTop: 4 }}>
                  {(project.members || []).filter(m => m.role === 'manager').map(m => (
                    <div key={m.user?._id || m.user} style={{ fontSize: 13, fontWeight: 600, color: '#4338ca' }}>
                        {m.user?.name || 'Manager'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* EDIT PROJECT LINKS MODAL (Feature 2) */}
      {showLinksModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowLinksModal(false); }}>
          <form className="modal" onSubmit={handleSaveLinks}>
            <div className="modal-top">
              <span className="eyebrow">{project.name.toUpperCase()} / LINKS</span>
              <button type="button" className="icon-btn" onClick={() => setShowLinksModal(false)}>✕</button>
            </div>
            <h2>Project Links & Resources</h2>
            <p className="muted">Configure Live Demo and GitHub Repository URLs for your project workspace.</p>

            {linksError && (
              <div className="alert" style={{ marginBottom: 14 }}>
                <AlertCircle size={15} />
                <span>{linksError}</span>
              </div>
            )}

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={14} color="#2563eb" /> Live Demo URL
              </span>
              <input
                type="url"
                placeholder="https://example.com/demo"
                value={liveDemoUrl}
                onChange={e => setLiveDemoUrl(e.target.value)}
              />
              <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                Must start with http:// or https://. Leave empty to remove.
              </span>
            </label>

            <label style={{ marginTop: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code2 size={14} color="#0f172a" /> GitHub Repository URL
              </span>
              <input
                type="url"
                placeholder="https://github.com/organization/repository"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
              />
              <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                Must start with http:// or https://. Leave empty to remove.
              </span>
            </label>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn secondary" onClick={() => setShowLinksModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={savingLinks}>
                {savingLinks ? 'Saving...' : 'Save Links'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateTaskModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreateTaskModal(false); }}>
          <form className="modal" onSubmit={handleCreateTask}>
            <div className="modal-top">
              <span className="eyebrow">{project.name.toUpperCase()} / NEW TASK</span>
              <button type="button" className="icon-btn" onClick={() => setShowCreateTaskModal(false)}>✕</button>
            </div>
            <h2>Create New Task</h2>
            <p className="muted">Tasks start at Version 0 and increment atomically on each update.</p>

            <label>
              Task Title
              <input
                required
                maxLength={180}
                placeholder="e.g. Design authentication workflow"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                placeholder="Describe the deliverable and requirements..."
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </label>

            <div className="form-row">
              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </label>
            </div>

            <label>
              Assign To
              <select
                value={taskForm.assignee}
                onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
              >
                <option value="">Unassigned</option>
                {(project.members || []).map(m => (
                  <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                    {m.user?.name || 'Member'} ({m.role})
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setShowCreateTaskModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowAddMemberModal(false); }}>
          <form className="modal" onSubmit={handleAddMember}>
            <div className="modal-top">
              <span className="eyebrow">{project.name.toUpperCase()} / TEAM</span>
              <button type="button" className="icon-btn" onClick={() => setShowAddMemberModal(false)}>✕</button>
            </div>
            <h2>Add Team Member</h2>
            <p className="muted">Grant workspace members access with defined project-level permissions.</p>

            <label>
              Select User
              <select
                required
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">Select a user to add...</option>
                {availableUsersToAdd.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email} — {u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project Role
              <select
                value={selectedProjectRole}
                onChange={e => setSelectedProjectRole(e.target.value)}
              >
                <option value="member">Member (view & update assigned tasks, comment)</option>
                <option value="manager">Manager (create & manage all tasks and members)</option>
                <option value="viewer">Viewer (read-only access)</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!selectedUserId}>
                Add to Project
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
