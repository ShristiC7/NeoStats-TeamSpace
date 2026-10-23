import React, { useState } from 'react';
import {
  LayoutGrid,
  Clock3,
  CheckCircle2,
  Flag,
  MoreVertical,
  Calendar,
  Plus,
  Bell,
  ArrowUpRight,
  Video,
  Check,
  CheckSquare
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 15, 2026';

export default function DashboardView({
  user,
  projects,
  tasks,
  onOpenProject,
  onOpenTask,
  onChangeStatus,
  onOpenNewProjectModal,
  assignableUsers = []
}) {
  const [taskTab, setTaskTab] = useState('today'); // 'today' | 'tomorrow' | 'upcoming'
  const [scheduleTab, setScheduleTab] = useState('meetings'); // 'meetings' | 'task'

  // Metric counts
  const totalProjectsCount = projects.length || 12;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length || 7;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length || 3;
  const overdueCount = tasks.filter(t => t.status === 'blocked' || t.priority === 'urgent').length || 1;

  // Filter tasks based on taskTab
  const displayedTasks = tasks.length > 0 ? tasks : [
    { _id: 'mock-1', title: 'Mobile App Redesign', status: 'in_progress', dueDate: new Date('2026-01-15'), priority: 'high', version: 1 },
    { _id: 'mock-2', title: 'Wireframe design', status: 'in_progress', dueDate: new Date('2026-01-15'), priority: 'medium', version: 0 },
    { _id: 'mock-3', title: 'Credit Report Website', status: 'in_progress', dueDate: new Date('2026-01-15'), priority: 'urgent', version: 2 }
  ];

  // Default team members display if assignableUsers is small
  const defaultTeamMembers = [
    { name: 'Esther Howard', email: 'estherhroe@gmail.com', role: 'Data Analyst Lead', status: 'Online' },
    { name: 'Leslie Alexander', email: 'lesilinealex@gmail.com', role: 'Product Executive', status: 'Online' },
    { name: 'Kristin Watson', email: 'kristinwatson@gmail.com', role: 'Interaction Designer', status: 'Online' },
    { name: 'Jane Cooper', email: 'janecooper@gmail.com', role: 'Design Lead', status: 'Online' }
  ];

  const teamList = assignableUsers.length >= 4
    ? assignableUsers.slice(0, 4).map(u => ({
        name: u.name,
        email: u.email,
        role: u.role === 'admin' ? 'Design Lead' : u.role === 'project_manager' ? 'Product Executive' : 'Interaction Designer',
        status: 'Online'
      }))
    : defaultTeamMembers;

  return (
    <>
      {/* TOP HEADER */}
      <div className="zendo-top-header">
        <h1>Overview</h1>
        <div className="zendo-top-actions">
          <button className="btn-new-project" onClick={onOpenNewProjectModal}>
            <Plus size={16} /> New Project
          </button>
          <button className="icon-circle-btn" title="Notifications">
            <Bell size={18} />
          </button>
          <div className="user-profile-badge" title={user?.name}>
            {initials(user?.name)}
          </div>
        </div>
      </div>

      {/* 4 TOP METRIC CARDS */}
      <section className="metric-cards-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-wrap blue">
              <LayoutGrid size={18} />
            </div>
            <span className="metric-card-label">Total Projects</span>
          </div>
          <div className="metric-card-val">{totalProjectsCount}</div>
          <div className="metric-card-sub">from last month</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-wrap purple">
              <Clock3 size={18} />
            </div>
            <span className="metric-card-label">In Progress</span>
          </div>
          <div className="metric-card-val">{inProgressTasksCount}</div>
          <div className="metric-card-sub">from last month</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-wrap green">
              <CheckCircle2 size={18} />
            </div>
            <span className="metric-card-label">Completed</span>
          </div>
          <div className="metric-card-val">{completedTasksCount}</div>
          <div className="metric-card-sub">from last month</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <div className="metric-icon-wrap red">
              <Flag size={18} />
            </div>
            <span className="metric-card-label">Overdue</span>
          </div>
          <div className="metric-card-val">{overdueCount}</div>
          <div className="metric-card-sub">from last month</div>
        </div>
      </section>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="zendo-split-layout">
        {/* LEFT COLUMN (~65%) */}
        <div>
          {/* PROJECT OVERVIEW SECTION */}
          <div className="zendo-section-box">
            <div className="zendo-section-head">
              <h2>Project Overview</h2>
              <button className="zendo-more-btn" title="More options">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* PROJECT CARDS (CLICK TO OPEN PROJECT PAGE) */}
            <div className="project-overview-grid">
              {projects.map((proj, i) => {
                const projTasks = tasks.filter(t => t.project === proj._id || t.project?._id === proj._id);
                const projDone = projTasks.filter(t => t.status === 'done').length;
                const pct = projTasks.length ? Math.round((projDone / projTasks.length) * 100) : 65;

                return (
                  <div
                    key={proj._id}
                    className="project-widget-card"
                    onClick={() => onOpenProject(proj._id)}
                    title="Click to open this project workspace"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="project-widget-tag">{proj.status === 'active' ? 'In Progress' : 'Archived'}</span>
                      <button className="zendo-more-btn" onClick={e => { e.stopPropagation(); onOpenProject(proj._id); }}>
                        <MoreVertical size={15} />
                      </button>
                    </div>

                    <div className="project-widget-title">{proj.name}</div>
                    <div className="project-widget-desc">
                      {proj.description || 'The goal of this project was to redesign an existing application to improve usability, visual clarity, and engagement.'}
                    </div>

                    <div className="project-widget-deadline">
                      <Calendar size={13} /> Deadline: {fmtDate(proj.createdAt)}
                    </div>

                    <div className="project-widget-prog-bar">
                      <div className="project-widget-prog-label">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="project-widget-track">
                        <div className="project-widget-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="project-widget-foot">
                      <div className="member-stack" style={{ display: 'flex' }}>
                        {(proj.members || []).slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="member-avatar"
                            style={{ width: 24, height: 24, fontSize: 10, marginLeft: idx > 0 ? -6 : 0, border: '2px solid #fff' }}
                          >
                            {initials(m.user?.name || 'M')}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {projTasks.length || 8} subtasks · 123 activities
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Sample card if only 1 project exists */}
              {projects.length === 1 && (
                <div
                  className="project-widget-card"
                  onClick={() => onOpenProject(projects[0]._id)}
                  title="Click to open project"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="project-widget-tag">In Progress</span>
                    <button className="zendo-more-btn">
                      <MoreVertical size={15} />
                    </button>
                  </div>
                  <div className="project-widget-title">Website Design</div>
                  <div className="project-widget-desc">
                    The goal of this project was to redesign an existing web application to improve usability, visual clarity, and consistency.
                  </div>
                  <div className="project-widget-deadline">
                    <Calendar size={13} /> Deadline: Jan 15, 2026
                  </div>
                  <div className="project-widget-prog-bar">
                    <div className="project-widget-prog-label">
                      <span>Progress</span>
                      <span>65%</span>
                    </div>
                    <div className="project-widget-track">
                      <div className="project-widget-fill" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div className="project-widget-foot">
                    <div className="member-stack" style={{ display: 'flex' }}>
                      <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, border: '2px solid #fff' }}>JD</span>
                      <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, marginLeft: -6, border: '2px solid #fff' }}>SA</span>
                      <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, marginLeft: -6, border: '2px solid #fff' }}>TM</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      subtasks · 123 activities
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MY TASKS SECTION */}
          <div className="zendo-section-box">
            <div className="zendo-section-head">
              <h2>My Tasks</h2>
              <button
                className="btn-new-project"
                style={{ padding: '6px 16px', fontSize: 12, background: '#6d28d9' }}
                onClick={() => onOpenProject(projects[0]?._id)}
              >
                View All Tasks
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="segmented-pill-bar" style={{ marginBottom: 16 }}>
              <button
                className={`segmented-pill-btn ${taskTab === 'today' ? 'active' : ''}`}
                onClick={() => setTaskTab('today')}
              >
                Today
              </button>
              <button
                className={`segmented-pill-btn ${taskTab === 'tomorrow' ? 'active' : ''}`}
                onClick={() => setTaskTab('tomorrow')}
              >
                Tomorrow
              </button>
              <button
                className={`segmented-pill-btn ${taskTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setTaskTab('upcoming')}
              >
                Upcoming
              </button>
            </div>

            {/* Task Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {displayedTasks.map(t => {
                const isDone = t.status === 'done';
                return (
                  <div key={t._id} className="my-task-row">
                    <div
                      className={`my-task-checkbox ${isDone ? 'checked' : ''}`}
                      onClick={() => onChangeStatus(t, isDone ? 'todo' : 'done')}
                      title="Toggle complete"
                    >
                      {isDone && <Check size={12} />}
                    </div>

                    <div
                      className="my-task-title"
                      style={{ cursor: 'pointer', textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#94a3b8' : '#0f172a' }}
                      onClick={() => onOpenTask(t)}
                    >
                      {t.title}
                    </div>

                    <div className="my-task-deadline">
                      <Calendar size={13} /> Deadline: {fmtDate(t.dueDate)}
                    </div>

                    <span className={`my-task-tag ${t.status}`}>
                      {t.status === 'in_progress' ? 'In Progress' : t.status === 'done' ? 'Done' : t.status === 'blocked' ? 'Blocked' : 'To Do'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
                      <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, border: '2px solid #fff' }}>
                        {initials(t.assignee?.name || 'TM')}
                      </span>
                    </div>

                    <button className="zendo-more-btn" onClick={() => onOpenTask(t)}>
                      <MoreVertical size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (~35%) */}
        <div>
          {/* SCHEDULE SECTION */}
          <div className="zendo-section-box">
            <div className="zendo-section-head">
              <h2>Schedule</h2>
              <button className="zendo-more-btn">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Meetings / Task Tab Switcher */}
            <div className="segmented-pill-bar">
              <button
                className={`segmented-pill-btn ${scheduleTab === 'meetings' ? 'active' : ''}`}
                onClick={() => setScheduleTab('meetings')}
              >
                Meetings
              </button>
              <button
                className={`segmented-pill-btn ${scheduleTab === 'task' ? 'active' : ''}`}
                onClick={() => setScheduleTab('task')}
              >
                Task
              </button>
            </div>

            {/* Event Card */}
            <div className="schedule-event-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <b style={{ fontSize: 16, color: '#0f172a' }}>Userflow planning</b>
                <span className="schedule-badge-pill">Coming Soon</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#ea4335', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={12} />
                </div>
                <span>Google Meet</span>
              </div>

              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                📅 Start At: 11:00 AM - 01:00 PM
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <div style={{ display: 'flex' }}>
                  <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, border: '2px solid #fff' }}>EH</span>
                  <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, marginLeft: -6, border: '2px solid #fff' }}>LA</span>
                  <span className="member-avatar" style={{ width: 24, height: 24, fontSize: 10, marginLeft: -6, border: '2px solid #fff' }}>KW</span>
                </div>
                <button style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9' }} onClick={() => onOpenProject(projects[0]?._id)}>
                  View Details
                </button>
              </div>
            </div>
          </div>

          {/* TEAM MEMBERS SECTION */}
          <div className="zendo-section-box">
            <div className="zendo-section-head">
              <h2>Team Members</h2>
              <button className="zendo-more-btn">
                <MoreVertical size={16} />
              </button>
            </div>

            <table className="team-members-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamList.map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="member-info-cell">
                        <div className="member-avatar">{initials(m.name)}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: 12 }}>
                      {m.role}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-online-pill" style={{ justifyContent: 'flex-end' }}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
