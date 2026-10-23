import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  ArrowUpRight,
  Archive,
  RotateCcw,
  Users,
  CheckCircle2,
  Lock
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function ProjectsView({
  user,
  projects,
  onSelectProject,
  onCreateProject,
  onToggleArchive,
  assignableUsers
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === 'admin';

  const filtered = projects.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = (`${p.name} ${p.description}`).toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onCreateProject({ name, description, managerId: managerId || null });
    setSubmitting(false);
    setShowCreateModal(false);
    setName('');
    setDescription('');
    setManagerId('');
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            PROJECT PORTFOLIO
          </div>
          <h1>Projects</h1>
          <p className="muted">All collaborative workspaces and initiatives you have access to.</p>
        </div>
        <div className="heading-actions">
          {canCreate ? (
            <button className="btn primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> New Project
            </button>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={13} /> Only Admins create projects
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ width: 280 }}>
          <Search size={15} />
          <input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="archived">Archived only</option>
        </select>
        <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>
          {filtered.length} project{filtered.length === 1 ? '' : 's'} found
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty panel" style={{ padding: 48 }}>
          <FolderKanban size={32} />
          <b>No projects found</b>
          <span>Try changing your search terms or filters.</span>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((p, i) => {
            const isManager = user?.role === 'admin' || p.members?.some(m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'manager');
            const managerMember = p.members?.find(m => m.role === 'manager');

            return (
              <div key={p._id} className="project-card">
                <div className="project-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`project-symbol color-${i % 4}`} style={{ width: 40, height: 40, fontSize: 16 }}>
                      {p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="project-card-title">{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Lead: {managerMember?.user?.name || p.owner?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  <span className={p.status === 'archived' ? 'tag archived' : 'tag'}>
                    {p.status}
                  </span>
                </div>

                <div className="project-card-desc">
                  {p.description || 'No project description provided.'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={15} />
                    <span>{p.members?.length || 0} team member{p.members?.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="member-stack">
                    {(p.members || []).slice(0, 4).map((m, j) => (
                      <span className={`avatar stack-${j}`} key={String(m.user?._id || m.user)} title={m.user?.name}>
                        {initials(m.user?.name || 'M')}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="btn secondary full"
                    onClick={() => onSelectProject(p._id)}
                  >
                    Open Workspace <ArrowUpRight size={15} />
                  </button>

                  {isManager && (
                    <button
                      className="icon-btn"
                      title={p.status === 'archived' ? 'Restore Project' : 'Archive Project'}
                      onClick={() => onToggleArchive(p)}
                    >
                      {p.status === 'archived' ? <RotateCcw size={16} /> : <Archive size={16} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <form className="modal" onSubmit={handleCreate}>
            <div className="modal-top">
              <span className="eyebrow">ADMIN / NEW PROJECT</span>
              <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <h2>Create New Project</h2>
            <p className="muted">Establish a collaborative workspace for team members and tasks.</p>

            <label>
              Project Name
              <input
                required
                maxLength={120}
                placeholder="e.g. Mobile Application Launch"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                placeholder="Define project goals, scope, and target outcomes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </label>

            <label>
              Assign Project Manager
              <select
                value={managerId}
                onChange={e => setManagerId(e.target.value)}
              >
                <option value="">Select an active project manager...</option>
                {assignableUsers
                  .filter(u => u.role === 'project_manager' || u.role === 'admin')
                  .map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
