import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  ShieldCheck,
  Plus
} from 'lucide-react';

import { api } from './lib/api.js';

import DemoBar from './components/DemoBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginView from './components/LoginView.jsx';
import DashboardView from './components/DashboardView.jsx';
import ProjectsView from './components/ProjectsView.jsx';
import ProjectDetailView from './components/ProjectDetailView.jsx';
import UsersView from './components/UsersView.jsx';
import ProfileView from './components/ProfileView.jsx';
import TaskDetailModal from './components/TaskDetailModal.jsx';
import KanbanDeskView from './components/KanbanDeskView.jsx';
import MessagesView from './components/MessagesView.jsx';
import NotificationsView from './components/NotificationsView.jsx';
import CalendarView from './components/CalendarView.jsx';
import MyTasksView from './components/MyTasksView.jsx';
import { Globe, Code2 } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('teamspace_token') || '');
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);          // tasks for selected project
  const [allTasks, setAllTasks] = useState([]);    // tasks across ALL projects
  const [users, setUsers] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [page, setPage] = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notifCount] = useState(3); // demo: 3 unread notifications

  // Create Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', description: '', managerId: '', liveDemoUrl: '', githubUrl: '' });
  const [submittingProject, setSubmittingProject] = useState(false);

  // Task Detail Modal State
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskComments, setTaskComments] = useState([]);

  const request = useCallback((path, opts = {}) => api(path, { token, ...opts }), [token]);

  // Load ALL tasks from all projects
  const loadAllTasks = useCallback(async (pList, reqFn) => {
    if (!pList || pList.length === 0) { setAllTasks([]); return; }
    try {
      const results = await Promise.all(
        pList.map(p => reqFn(`/projects/${p._id}/tasks?limit=200`).then(r => r.data || []).catch(() => []))
      );
      setAllTasks(results.flat());
    } catch (e) {
      console.warn('[loadAllTasks]', e.message);
    }
  }, []);

  // Load Workspace Data
  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const [meRes, projRes, assignableRes] = await Promise.all([
        request('/auth/me'),
        request('/projects'),
        request('/users/assignable')
      ]);

      setUser(meRes.user);
      setProjects(projRes.data || []);
      setAssignableUsers(assignableRes.data || []);

      const pList = projRes.data || [];
      const pid = activeProject && pList.some(p => p._id === activeProject)
        ? activeProject
        : (pList[0]?._id || '');
      setActiveProject(pid);

      if (pid) {
        const tRes = await request(`/projects/${pid}/tasks?limit=200`);
        setTasks(tRes.data || []);
      } else {
        setTasks([]);
      }

      // Load all tasks in background
      await loadAllTasks(pList, request);

      if (meRes.user.role === 'admin') {
        const uRes = await request('/users');
        setUsers(uRes.data || []);
      }
    } catch (err) {
      setError(err.message);
      if (err.status === 401) {
        localStorage.removeItem('teamspace_token');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }, [token, request, activeProject, loadAllTasks]);

  useEffect(() => {
    if (token) loadWorkspace();
  }, [token]);

  useEffect(() => {
    if (!token || !activeProject) return;
    request(`/projects/${activeProject}/tasks?limit=200`)
      .then(res => {
        const taskList = res.data || [];
        setTasks(taskList);
      })
      .catch(err => setError(err.message));
  }, [activeProject, token, request]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Authentication Handlers
  const handleLogin = async (email, password) => {
    setError('');
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem('teamspace_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setNotice(`Welcome back to TeamSpace, ${res.user.name}!`);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleRegister = async (form) => {
    setError('');
    try {
      const res = await api('/auth/register', {
        method: 'POST',
        body: form
      });
      localStorage.setItem('teamspace_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setNotice(`Account created! Welcome to TeamSpace, ${res.user.name} (${res.user.role.replace('_', ' ')}).`);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  const handleGoogleAuth = async (credential, role) => {
    setError('');
    try {
      const res = await api('/auth/google', {
        method: 'POST',
        body: { credential, role }
      });
      localStorage.setItem('teamspace_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setNotice(`Signed in with Google as ${res.user.name}!`);
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teamspace_token');
    setToken('');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setAllTasks([]);
    setPage('Overview');
  };

  const handleSwitchRole = async (email, password) => {
    await handleLogin(email, password);
  };

  // Project Operations
  const handleCreateProject = async (form) => {
    try {
      const res = await request('/projects', { method: 'POST', body: form });
      setNotice('Project created successfully!');
      await loadWorkspace();
      setActiveProject(res.project._id);
      setSelectedProjectId(res.project._id);
      setShowNewProjectModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleArchive = async (project) => {
    try {
      const newStatus = project.status === 'archived' ? 'active' : 'archived';
      await request(`/projects/${project._id}`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      setNotice(`Project ${newStatus === 'archived' ? 'archived' : 'restored'} successfully.`);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project and all its tasks?')) return;
    try {
      await request(`/projects/${projectId}/permanent`, { method: 'DELETE' });
      setNotice('Project permanently deleted.');
      setSelectedProjectId(null);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  // Membership Operations
  const handleAddMember = async (projectId, userId, role) => {
    try {
      await request(`/projects/${projectId}/members/${userId}`, {
        method: 'POST',
        body: { role }
      });
      setNotice('Team member added to project.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeMemberRole = async (projectId, userId, newRole) => {
    try {
      await request(`/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        body: { role: newRole }
      });
      setNotice('Project member role updated.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      setNotice('Member removed from project.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  // Task Operations
  const handleCreateTask = async (taskData) => {
    const pId = selectedProjectId || activeProject;
    try {
      await request(`/projects/${pId}/tasks`, {
        method: 'POST',
        body: taskData
      });
      setNotice('Task created successfully!');
      const res = await request(`/projects/${pId}/tasks?limit=200`);
      setTasks(res.data || []);
      await loadAllTasks(projects, request);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (taskId, patch) => {
    const res = await request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: patch
    });
    setNotice('Task updated successfully.');
    setTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
    setAllTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
    if (taskDetail?._id === taskId) {
      setTaskDetail(res.task);
    }
    return res.task;
  };

  const handleChangeStatus = async (task, newStatus) => {
    try {
      const updated = await handleUpdateTask(task._id, {
        status: newStatus,
        expectedVersion: task.version
      });
      setNotice(`Task moved to ${newStatus.replace('_', ' ')} (v${updated.version})`);
    } catch (err) {
      if (err.status === 409) {
        setError('Optimistic Concurrency Conflict: Task changed in another session. Refreshed with latest state.');
        await loadWorkspace();
      } else {
        setError(err.message);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task and all its comments?')) return;
    try {
      await request(`/tasks/${taskId}`, { method: 'DELETE' });
      setNotice('Task deleted.');
      setTaskDetail(null);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setAllTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSimulateConflict = async (targetTask) => {
    await request(`/tasks/${targetTask._id}`, {
      method: 'PATCH',
      body: {
        status: targetTask.status === 'done' ? 'in_progress' : 'done',
        expectedVersion: targetTask.version
      }
    });

    return await request(`/tasks/${targetTask._id}`, {
      method: 'PATCH',
      body: {
        title: targetTask.title + ' [Conflicting Write]',
        expectedVersion: targetTask.version
      }
    });
  };

  const handleOpenTask = async (task) => {
    setTaskDetail(task);
    try {
      const res = await request(`/tasks/${task._id}/comments`);
      setTaskComments(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReloadTask = async (taskId) => {
    try {
      const res = await request(`/tasks/${taskId}`);
      setTaskDetail(res.task);
      setTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
      setAllTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
      const cRes = await request(`/tasks/${taskId}/comments`);
      setTaskComments(cRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddComment = async (taskId, body) => {
    const res = await request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: { body }
    });
    setTaskComments(prev => [...prev, res.comment]);
    setNotice('Comment posted.');
  };

  const handleDeleteComment = async (commentId) => {
    await request(`/comments/${commentId}`, { method: 'DELETE' });
    setTaskComments(prev => prev.filter(c => c._id !== commentId));
    setNotice('Comment deleted.');
  };

  // User Admin Operations
  const handleCreateUser = async (formData) => {
    try {
      await request('/users', { method: 'POST', body: formData });
      setNotice('New user created successfully.');
      const res = await request('/users');
      setUsers(res.data || []);
      const aRes = await request('/users/assignable');
      setAssignableUsers(aRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUser = async (userId, patch) => {
    try {
      await request(`/users/${userId}`, { method: 'PATCH', body: patch });
      setNotice('User updated.');
      const res = await request('/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await request(`/users/${userId}/toggle-active`, { method: 'PATCH' });
      setNotice('User status toggled.');
      const res = await request('/users');
      setUsers(res.data || []);
      const aRes = await request('/users/assignable');
      setAssignableUsers(aRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token || !user) {
    return (
      <LoginView
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleAuth={handleGoogleAuth}
        error={error}
      />
    );
  }

  const selectedProject = projects.find(p => p._id === (selectedProjectId || activeProject)) || projects[0];
  // Tasks for My Tasks page: filter allTasks by logged-in user
  const myTasks = allTasks.filter(t => {
    const assigneeId = t.assignee?._id || t.assignee;
    return String(assigneeId) === String(user._id);
  });

  return (
    <div className="zendo-app-shell">
      {/* Top Hackathon Demo Switcher */}
      <DemoBar
        currentUser={user}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Canvas Box */}
      <div className="zendo-canvas">
        {/* Left Sidebar */}
        <Sidebar
          page={selectedProjectId ? 'Projects' : page}
          setPage={(newPage) => {
            setSelectedProjectId(null);
            setPage(newPage);
          }}
          user={user}
          projectsCount={projects.length}
          tasksCount={myTasks.filter(t => t.status !== 'done').length}
          onLogout={handleLogout}
          notifCount={notifCount}
        />

        {/* Main Content View */}
        <main className="zendo-main">

          {/* Global Notice Banner */}
          {notice && (
            <div className="notice" style={{ margin: '0 0 16px 0', animation: 'fadeIn 0.3s ease' }}>
              <ShieldCheck size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* Global Error Banner */}
          {error && (
            <div className="alert" style={{ margin: '0 0 16px 0', animation: 'fadeIn 0.3s ease' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: 12, borderRadius: 4, background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>✕ Dismiss</button>
            </div>
          )}

          {/* ROUTING */}
          {selectedProjectId ? (
            <ProjectDetailView
              project={selectedProject}
              tasks={tasks}
              user={user}
              onBack={() => {
                setSelectedProjectId(null);
                setPage('Projects');
              }}
              onOpenTask={handleOpenTask}
              onCreateTask={handleCreateTask}
              onUpdateProject={async (pid, patch) => {
                try {
                  await request(`/projects/${pid}`, { method: 'PATCH', body: patch });
                  setNotice('Project updated.');
                  await loadWorkspace();
                } catch (err) {
                  setError(err.message);
                }
              }}
              onToggleArchive={handleToggleArchive}
              onDeleteProject={handleDeleteProject}
              onAddMember={handleAddMember}
              onChangeMemberRole={handleChangeMemberRole}
              onRemoveMember={handleRemoveMember}
              onChangeStatus={handleChangeStatus}
              assignableUsers={assignableUsers}
            />
          ) : page === 'Overview' ? (
            <DashboardView
              user={user}
              projects={projects}
              tasks={allTasks.length > 0 ? allTasks : tasks}
              onOpenProject={(pid) => setSelectedProjectId(pid)}
              onOpenTask={handleOpenTask}
              onChangeStatus={handleChangeStatus}
              onOpenNewProjectModal={() => setShowNewProjectModal(true)}
              assignableUsers={assignableUsers}
              onOpenProfile={() => setPage('Profile')}
              onOpenNotifications={() => setPage('Notifications')}
            />
          ) : page === 'Projects' ? (
            <ProjectsView
              user={user}
              projects={projects}
              onSelectProject={(pid) => setSelectedProjectId(pid)}
              onCreateProject={handleCreateProject}
              onToggleArchive={handleToggleArchive}
              assignableUsers={assignableUsers}
            />
          ) : page === 'My Tasks' ? (
            <MyTasksView
              user={user}
              tasks={allTasks.length > 0 ? allTasks : tasks}
              projects={projects}
              onOpenTask={handleOpenTask}
              onChangeStatus={handleChangeStatus}
              onOpenProject={(pid) => setSelectedProjectId(pid)}
            />
          ) : page === 'Kanban Desk' ? (
            <KanbanDeskView
              user={user}
              projects={projects}
              tasks={allTasks.length > 0 ? allTasks : tasks}
              onOpenTask={handleOpenTask}
              onChangeStatus={handleChangeStatus}
              onOpenProject={(pid) => setSelectedProjectId(pid)}
            />
          ) : page === 'Message' ? (
            <MessagesView user={user} />
          ) : page === 'Calendar' ? (
            <CalendarView user={user} tasks={allTasks.length > 0 ? allTasks : tasks} projects={projects} />
          ) : page === 'Notifications' ? (
            <NotificationsView user={user} />
          ) : page === 'Users' ? (
            <UsersView
              users={users}
              currentUser={user}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onToggleActive={handleToggleActive}
            />
          ) : page === 'Profile' ? (
            <ProfileView
              user={user}
              onLogout={handleLogout}
            />
          ) : null}

          {/* TASK DETAIL DRAWER */}
          {taskDetail && (
            <TaskDetailModal
              task={taskDetail}
              user={user}
              project={selectedProject || projects.find(p => p._id === taskDetail.project?._id || p._id === taskDetail.project)}
              comments={taskComments}
              onClose={() => setTaskDetail(null)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onSimulateConflict={handleSimulateConflict}
              onReloadTask={handleReloadTask}
            />
          )}

          {/* CREATE PROJECT MODAL */}
          {showNewProjectModal && (
            <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowNewProjectModal(false); }}>
              <form className="modal" onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingProject(true);
                await handleCreateProject(newProjectForm);
                setSubmittingProject(false);
              }}>
                <div className="modal-top">
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', letterSpacing: 0.5 }}>NEW PROJECT</span>
                  <button type="button" onClick={() => setShowNewProjectModal(false)}>✕</button>
                </div>
                <h2 style={{ fontSize: 20, marginBottom: 6 }}>Create New Project Workspace</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  Establish a collaborative space for your team to track tasks and discussions.
                </p>

                <label>
                  Project Name
                  <input
                    required
                    maxLength={120}
                    placeholder="e.g. Mobile App Redesign"
                    value={newProjectForm.name}
                    onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  />
                </label>

                <label>
                  Description
                  <textarea
                    rows={3}
                    placeholder="The goal of this project was to redesign an existing application..."
                    value={newProjectForm.description}
                    onChange={e => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  />
                </label>

                <label>
                  Assign Project Manager
                  <select
                    value={newProjectForm.managerId}
                    onChange={e => setNewProjectForm({ ...newProjectForm, managerId: e.target.value })}
                  >
                    <option value="">Select project manager...</option>
                    {assignableUsers
                      .filter(u => u.role === 'project_manager' || u.role === 'admin')
                      .map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role.replace('_', ' ')})
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={13} color="#2563eb" /> Live Demo URL (Optional)
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com/demo"
                    value={newProjectForm.liveDemoUrl}
                    onChange={e => setNewProjectForm({ ...newProjectForm, liveDemoUrl: e.target.value })}
                  />
                </label>

                <label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Code2 size={13} color="#0f172a" /> GitHub Repository URL (Optional)
                  </span>
                  <input
                    type="url"
                    placeholder="https://github.com/organization/repository"
                    value={newProjectForm.githubUrl}
                    onChange={e => setNewProjectForm({ ...newProjectForm, githubUrl: e.target.value })}
                  />
                </label>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                  <button type="button" className="btn secondary" onClick={() => setShowNewProjectModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary" disabled={submittingProject}>
                    {submittingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
