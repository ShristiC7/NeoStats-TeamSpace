import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin,
  Video, Users, Calendar as CalIcon, MoreVertical
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const COLORS = ['#6d28d9','#2563eb','#059669','#d97706','#dc2626','#0891b2'];

const SAMPLE_EVENTS = [
  { id: 1, title: 'Userflow Planning', date: new Date(), start: '11:00 AM', end: '01:00 PM', type: 'meeting', color: '#6d28d9', location: 'Google Meet', attendees: ['EH','LA','KW'] },
  { id: 2, title: 'Design Review', date: new Date(Date.now() + 86400000), start: '02:00 PM', end: '03:00 PM', type: 'review', color: '#2563eb', location: 'Zoom', attendees: ['AM','JD'] },
  { id: 3, title: 'Sprint Planning', date: new Date(Date.now() + 3 * 86400000), start: '10:00 AM', end: '12:00 PM', type: 'meeting', color: '#059669', location: 'Teams', attendees: ['EH','LA','KW','AM'] },
  { id: 4, title: 'Backend API Review', date: new Date(Date.now() + 5 * 86400000), start: '03:30 PM', end: '04:30 PM', type: 'review', color: '#d97706', location: 'Office', attendees: ['MK'] },
  { id: 5, title: 'Project Deadline', date: new Date(Date.now() + 7 * 86400000), start: 'All Day', end: '', type: 'deadline', color: '#dc2626', location: '', attendees: [] },
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getEventsForDay(day, year, month, events) {
  const d = new Date(year, month, day);
  return events.filter(e => isSameDay(new Date(e.date), d));
}

export default function CalendarView({ user, tasks = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', location: '', color: '#6d28d9' });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const selectedDate = new Date(viewYear, viewMonth, selectedDay);
  const selectedEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    const ev = { ...newEvent, id: Date.now(), date: new Date(viewYear, viewMonth, selectedDay), type: 'meeting', attendees: [] };
    setEvents(prev => [...prev, ev]);
    setNewEvent({ title: '', start: '', end: '', location: '', color: '#6d28d9' });
    setShowEventModal(false);
  };

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="page-heading" style={{ marginBottom: 20 }}>
        <div>
          <h1>Calendar</h1>
          <p className="muted">Manage your meetings, deadlines, and project schedule.</p>
        </div>
        <div className="heading-actions">
          <div className="segmented-pill-bar" style={{ marginBottom: 0 }}>
            {['month','week','day'].map(v => (
              <button key={v} className={`segmented-pill-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => setShowEventModal(true)}>
            <Plus size={15} /> Add Event
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Main Calendar */}
        <div className="calendar-main">
          {/* Month Navigator */}
          <div className="calendar-nav">
            <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className="calendar-month-title">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button className="icon-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
            <button className="btn secondary" style={{ marginLeft: 8, fontSize: 12 }} onClick={() => {
              const t = new Date();
              setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); setSelectedDay(t.getDate());
            }}>Today</button>
          </div>

          {/* Day Headers */}
          <div className="calendar-grid-head">
            {DAYS_OF_WEEK.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
              const isToday = isSameDay(new Date(viewYear, viewMonth, day), today);
              const isSelected = day === selectedDay && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
              const dayEvents = getEventsForDay(day, viewYear, viewMonth, events);
              return (
                <div
                  key={day}
                  className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="calendar-day-num">{day}</span>
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="calendar-event-pill" style={{ background: ev.color + '20', color: ev.color, borderLeft: `3px solid ${ev.color}` }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>+{dayEvents.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Sidebar */}
        <div className="calendar-sidebar">
          <div className="calendar-sidebar-head">
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{selectedDay}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            </div>
            <button className="btn primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setShowEventModal(true)}>
              <Plus size={13} />
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            {selectedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                <CalIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No events this day</p>
              </div>
            ) : (
              selectedEvents.map(ev => (
                <div key={ev.id} className="calendar-event-card" style={{ borderLeft: `4px solid ${ev.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{ev.title}</div>
                    <button className="zendo-more-btn"><MoreVertical size={14} /></button>
                  </div>
                  {ev.start && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      <Clock size={12} />
                      {ev.start}{ev.end ? ` – ${ev.end}` : ''}
                    </div>
                  )}
                  {ev.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      <MapPin size={12} />
                      {ev.location}
                    </div>
                  )}
                  {ev.attendees?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} color="#94a3b8" />
                      <div style={{ display: 'flex', gap: 2 }}>
                        {ev.attendees.map((a, i) => (
                          <span key={i} className="member-avatar" style={{ width: 22, height: 22, fontSize: 9, background: COLORS[i % COLORS.length] }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowEventModal(false); }}>
          <form className="modal" onSubmit={e => { e.preventDefault(); handleAddEvent(); }}>
            <div className="modal-top">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', letterSpacing: 0.5 }}>NEW EVENT</span>
              <button type="button" onClick={() => setShowEventModal(false)}>✕</button>
            </div>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Add Calendar Event</h2>
            <label>
              Event Title
              <input required placeholder="e.g. Sprint Review" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
            </label>
            <label>
              Start Time
              <input placeholder="e.g. 10:00 AM" value={newEvent.start} onChange={e => setNewEvent({ ...newEvent, start: e.target.value })} />
            </label>
            <label>
              End Time
              <input placeholder="e.g. 11:00 AM" value={newEvent.end} onChange={e => setNewEvent({ ...newEvent, end: e.target.value })} />
            </label>
            <label>
              Location / Link
              <input placeholder="e.g. Google Meet, Zoom, Office Room 2" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
            </label>
            <label>
              Color
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {COLORS.map(c => (
                  <button type="button" key={c} onClick={() => setNewEvent({ ...newEvent, color: c })}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: newEvent.color === c ? '3px solid #0f172a' : '2px solid transparent', cursor: 'pointer' }}
                  />
                ))}
              </div>
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="btn secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
              <button type="submit" className="btn primary">Add Event</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
