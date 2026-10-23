import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  LogOut,
  FolderKanban,
  CheckSquare
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

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('teamspace_token') || '');
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);

  const [page, setPage] = useState('Overview'); // 'Overview' | 'Projects' | 'Tasks' | 'Users' | 'Profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Task Detail Modal State
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskComments, setTaskComments] = useState([]);

  const request = useCallback((path, opts = {}) => api(path, { token, ...opts }), [token]);

  // Load all initial data
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
  }, [token, request, activeProject]);

  useEffect(() => {
    if (token) loadWorkspace();
  }, [token]);

  // Refresh tasks whenever active project changes
  useEffect(() => {
    if (!token || !activeProject) return;
    request(`/projects/${activeProject}/tasks?limit=200`)
      .then(res => setTasks(res.data || []))
      .catch(err => setError(err.message));
  }, [activeProject, token, request]);

  // Auto-dismiss notices after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Auth Operations
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
      setNotice(`Welcome back, ${res.user.name}!`);
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teamspace_token');
    setToken('');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setPage('Overview');
  };

  // Quick Switcher from Demo Bar
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
    // Update local task state
    setTasks(prev => prev.map(t => (t._id === taskId ? res.task : t)));
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
        setError('Optimistic Concurrency Conflict: Task changed in another session. Refreshed with latest data.');
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
    } catch (err) {
      setError(err.message);
    }
  };

  // Simulate 409 Concurrency Conflict
  const handleSimulateConflict = async (targetTask) => {
    // 1. Behind the scenes, trigger a concurrent edit on the server to bump its version to targetTask.version + 1
    await request(`/tasks/${targetTask._id}`, {
      method: 'PATCH',
      body: {
        status: targetTask.status === 'done' ? 'in_progress' : 'done',
        expectedVersion: targetTask.version
      }
    });

    // 2. Now attempt to save with the old expectedVersion
    return await request(`/tasks/${targetTask._id}`, {
      method: 'PATCH',
      body: {
        title: targetTask.title + ' [Conflicting Edit]',
        expectedVersion: targetTask.version // STALE! Server is now at version + 1
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

  // User Administration Operations (Admin)
  const handleCreateUser = async (formData) => {
    try {
      await request('/users', { method: 'POST', body: formData });
      setNotice('New user account created successfully.');
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
      setNotice('User updated successfully.');
      const res = await request('/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await request(`/users/${userId}/toggle-active`, { method: 'PATCH' });
      setNotice('User status toggled successfully.');
      const res = await request('/users');
      setUsers(res.data || []);
      const aRes = await request('/users/assignable');
      setAssignableUsers(aRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // If not authenticated, render LoginView
  if (!token || !user) {
    return (
      <LoginView
        onLogin={handleLogin}
        error={error}
      />
    );
  }

  const selectedProject = projects.find(p => p._id === (selectedProjectId || activeProject));

  return (
    <div className="app-shell">
      {/* PERSISTENT DEMO BAR FOR HACKATHON EVALUATORS */}
      <DemoBar
        currentUser={user}
        onSwitchRole={handleSwitchRole}
      />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        page={selectedProjectId ? 'Projects' : page}
        setPage={(newPage) => {
          setSelectedProjectId(null);
          setPage(newPage);
        }}
        user={user}
        projectsCount={projects.length}
        tasksCount={tasks.filter(t => t.status !== 'done').length}
        onLogout={handleLogout}
      />

      <main className="main-area">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="slash">/</span>
            <span>{selectedProjectId ? selectedProject?.name : page}</span>
          </div>

          <div className="searchbox">
            <Search size={15} />
            <input
              placeholder="Search across tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="top-actions">
            <button className="icon-btn" title="Refresh workspace data" onClick={loadWorkspace}>
              <RefreshCw size={16} />
            </button>
            <div
              className="avatar"
              title={`${user.name} (${user.role})`}
              style={{ background: '#4f46e5', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* NOTICES AND ALERTS */}
        <div className="content">
          {error && (
            <div className="alert global-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button className="text-btn" onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          {notice && (
            <div className="notice">
              <ShieldCheck size={16} />
              <span>{notice}</span>
            </div>
          )}

          {/* VIEW SWITCHING */}
          {selectedProjectId && selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              tasks={tasks}
              user={user}
              onBack={() => setSelectedProjectId(null)}
              onOpenTask={handleOpenTask}
              onCreateTask={handleCreateTask}
              onUpdateProject={async (patch) => {
                await request(`/projects/${selectedProject._id}`, { method: 'PATCH', body: patch });
                await loadWorkspace();
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
              tasks={tasks}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              onOpenProject={(pid) => {
                if (pid) setSelectedProjectId(pid);
                else setPage('Projects');
              }}
              onOpenTask={handleOpenTask}
              onChangeStatus={handleChangeStatus}
              onRefresh={loadWorkspace}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
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
          ) : page === 'Tasks' ? (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Workspace Task Board</h3>
                  <p className="muted">Tasks across active project: <b>{selectedProject?.name || 'All'}</b></p>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <DashboardView
                  user={user}
                  projects={projects}
                  tasks={tasks}
                  activeProject={activeProject}
                  setActiveProject={setActiveProject}
                  onOpenProject={(pid) => setSelectedProjectId(pid)}
                  onOpenTask={handleOpenTask}
                  onChangeStatus={handleChangeStatus}
                  onRefresh={loadWorkspace}
                  filter={filter}
                  setFilter={setFilter}
                  search={search}
                  setSearch={setSearch}
                />
              </div>
            </div>
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

          {/* TASK DETAIL DRAWER & CONFLICT RESOLUTION MODAL */}
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

          <footer className="footer" style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <span>© 2026 Teamspace · NeoStats Full Stack Engineering Hackathon</span>
            <span>Optimistic Concurrency & Server-Enforced RBAC Enabled</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
