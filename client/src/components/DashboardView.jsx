import React from 'react';
import {
  FolderKanban,
  CheckSquare,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Clock3,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const fmt = s => s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';
const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export default function DashboardView({
  user,
  projects,
  tasks,
  activeProject,
  setActiveProject,
  onOpenProject,
  onOpenTask,
  onChangeStatus,
  onRefresh,
  filter,
  setFilter,
  search,
  setSearch
}) {
  const active = projects.find(p => p._id === activeProject) || projects[0];

  const visibleTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = (`${t.title} ${t.description} ${t.assignee?.name || ''}`).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const canManage = user && ['admin', 'project_manager'].includes(user.role);

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            WORKSPACE OVERVIEW
          </div>
          <h1>Welcome back, {user?.name}</h1>
          <p className="muted">Here is what is currently happening across your assigned projects and tasks.</p>
        </div>
        <div className="heading-actions">
          <button className="icon-btn" title="Refresh data" onClick={onRefresh}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>ACTIVE PROJECTS</span>
            <span className="stat-icon lavender"><FolderKanban size={17} /></span>
          </div>
          <div className="stat-value">
            {projects.filter(p => p.status === 'active').length}
            <span className="stat-note">in workspace</span>
          </div>
          <div className="stat-foot">
            <span className="tiny-dot purple" /> {projects.length} total accessible
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>OPEN TASKS</span>
            <span className="stat-icon mint"><CheckSquare size={17} /></span>
          </div>
          <div className="stat-value">
            {tasks.filter(t => t.status !== 'done').length}
            <span className="stat-note">in current focus</span>
          </div>
          <div className="stat-foot">
            <span className="tiny-dot green" /> {doneCount} completed
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>NEEDS ATTENTION</span>
            <span className="stat-icon peach"><AlertCircle size={17} /></span>
          </div>
          <div className="stat-value">
            {tasks.filter(t => t.status === 'blocked' || t.priority === 'urgent').length}
            <span className="stat-note">items</span>
          </div>
          <div className="stat-foot">
            <span className="tiny-dot orange" /> Blocked or urgent
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>PROJECT PROGRESS</span>
            <span className="stat-icon mint"><CheckCircle2 size={17} /></span>
          </div>
          <div className="stat-value">
            {progressPct}%
            <span className="stat-note">completion</span>
          </div>
          <div className="stat-foot">
            <span className="tiny-dot green" /> {doneCount} of {tasks.length} tasks done
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel projects-panel">
          <div className="panel-heading">
            <div>
              <h3>Your Projects</h3>
              <p className="muted">Select a project to switch focus.</p>
            </div>
            <button className="text-btn" onClick={() => onOpenProject(null)}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty">
              <FolderKanban size={24} />
              <b>No projects yet</b>
              <span>Projects you belong to will appear here.</span>
            </div>
          ) : (
            <div className="project-list">
              {projects.map((p, i) => (
                <button
                  key={p._id}
                  className={`project-row ${activeProject === p._id ? 'project-active' : ''}`}
                  onClick={() => {
                    setActiveProject(p._id);
                  }}
                >
                  <div className={`project-symbol color-${i % 4}`}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="project-info">
                    <b>{p.name}</b>
                    <small>{p.description || 'No description provided'}</small>
                  </div>
                  <div className="project-meta">
                    <span className={p.status === 'archived' ? 'tag archived' : 'tag'}>
                      {p.status}
                    </span>
                    <span className="member-stack">
                      {(p.members || []).slice(0, 3).map((m, j) => (
                        <span className={`avatar stack-${j}`} key={String(m.user?._id || m.user)} title={m.user?.name}>
                          {initials(m.user?.name || 'M')}
                        </span>
                      ))}
                    </span>
                  </div>
                  <ArrowUpRight size={16} className="row-arrow" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <h3>Project Focus</h3>
              <p className="muted">Detailed progress for active workspace.</p>
            </div>
          </div>

          {active ? (
            <>
              <div className="focus-project">
                <div className="focus-symbol">{active.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <b>{active.name}</b>
                  <small>{active.members?.length || 0} team members · {tasks.length} tasks</small>
                </div>
              </div>
              <p className="focus-description">{active.description || 'A shared collaborative workspace.'}</p>

              <div className="progress-label">
                <span>Task completion rate</span>
                <b>{progressPct}%</b>
              </div>
              <div className="progress-track">
                <div style={{ width: `${progressPct}%` }} />
              </div>

              <div className="focus-bottom">
                <span><span className="tiny-dot green" /> {doneCount} done</span>
                <span>{tasks.length - doneCount} remaining</span>
              </div>

              <button className="btn secondary full" onClick={() => onOpenProject(active._id)}>
                Open Project Workspace <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <div className="empty">Select a project to inspect details.</div>
          )}
        </section>
      </div>

      <section className="panel tasks-panel" style={{ marginTop: 24 }}>
        <div className="panel-heading task-panel-head">
          <div>
            <h3>Tasks in Focus</h3>
            <p className="muted">Directly manage, filter, and update task statuses.</p>
          </div>
          <div className="task-tools">
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
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
                const canChangeStatus = canManage || (user.role === 'team_member' && isAssigned);

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
              <b>No matching tasks</b>
              <span>Try adjusting your status filter or search criteria.</span>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>Showing {visibleTasks.length} of {tasks.length} tasks</span>
          <span>Optimistic concurrency active <span className="tiny-dot green" /></span>
        </div>
      </section>
    </>
  );
}
