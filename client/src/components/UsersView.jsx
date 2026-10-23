import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  Edit2,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function UsersView({
  users,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onToggleActive
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team_member'
  });

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'team_member' });
  const [submitting, setSubmitting] = useState(false);

  const filteredUsers = users.filter(u => {
    const matchesSearch = (`${u.name} ${u.email}`).toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.active : !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onCreateUser(newForm);
    setSubmitting(false);
    setShowCreateModal(false);
    setNewForm({ name: '', email: '', password: '', role: 'team_member' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    await onUpdateUser(editingUser._id || editingUser.id, editForm);
    setSubmitting(false);
    setEditingUser(null);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name, role: u.role });
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            ADMINISTRATION CONSOLE
          </div>
          <h1>User Management</h1>
          <p className="muted">Create, inspect, update roles, and activate or deactivate user accounts.</p>
        </div>

        <div className="heading-actions">
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New User
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ width: 280 }}>
          <Search size={15} />
          <input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>
          {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} registered
        </span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>USER</th>
                <th>WORKSPACE ROLE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const userId = u._id || u.id;
                const isSelf = String(userId) === String(currentUser?._id);

                return (
                  <tr key={userId}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar">{initials(u.name)}</div>
                        <div>
                          <b>{u.name} {isSelf && <span style={{ fontSize: 10, color: '#6366f1' }}>(You)</span>}</b>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-pill">{u.role.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={u.active ? 'status-dot active' : 'status-dot'}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="icon-btn"
                          title="Edit user role and name"
                          onClick={() => openEdit(u)}
                        >
                          <Edit2 size={15} />
                        </button>

                        {!isSelf && (
                          <button
                            className="icon-btn"
                            title={u.active ? 'Deactivate user' : 'Reactivate user'}
                            style={{ color: u.active ? '#ef4444' : '#16a34a' }}
                            onClick={() => onToggleActive(userId)}
                          >
                            {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="empty">
              <Users size={24} />
              <b>No users found</b>
              <span>Try adjusting your search or filters.</span>
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <form className="modal" onSubmit={handleCreateSubmit}>
            <div className="modal-top">
              <span className="eyebrow">ADMIN / NEW USER</span>
              <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <h2>Create New User</h2>
            <p className="muted">Add a new workspace account with assigned role and credentials.</p>

            <label>
              Full Name
              <input
                required
                maxLength={80}
                placeholder="e.g. Jordan Casey"
                value={newForm.name}
                onChange={e => setNewForm({ ...newForm, name: e.target.value })}
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                required
                placeholder="e.g. jordan@teamspace.local"
                value={newForm.email}
                onChange={e => setNewForm({ ...newForm, email: e.target.value })}
              />
            </label>

            <label>
              Initial Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={newForm.password}
                onChange={e => setNewForm({ ...newForm, password: e.target.value })}
              />
            </label>

            <label>
              Workspace Role
              <select
                value={newForm.role}
                onChange={e => setNewForm({ ...newForm, role: e.target.value })}
              >
                <option value="admin">Admin (full administrative permissions)</option>
                <option value="project_manager">Project Manager (manage projects, members & tasks)</option>
                <option value="team_member">Team Member (update assigned tasks, add comments)</option>
                <option value="viewer">Viewer (read-only access)</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setEditingUser(null); }}>
          <form className="modal" onSubmit={handleEditSubmit}>
            <div className="modal-top">
              <span className="eyebrow">ADMIN / EDIT USER</span>
              <button type="button" className="icon-btn" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <h2>Edit {editingUser.name}</h2>
            <p className="muted">Update user display name or workspace-wide role.</p>

            <label>
              Full Name
              <input
                required
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>

            <label>
              Workspace Role
              <select
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_member">Team Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
