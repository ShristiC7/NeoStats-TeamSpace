import React, { useState } from 'react';
import {
  MessageSquare, Search, Send, Phone, Video,
  MoreVertical, Smile, Paperclip, CheckCheck, Check, Circle
} from 'lucide-react';

const initials = s => (s || 'U').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const COLORS = [
  '#6d28d9','#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'
];
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return COLORS[Math.abs(h) % COLORS.length];
}

const fmtTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CONTACTS = [
  { id: 1, name: 'Avery Admin', role: 'Admin', online: true, lastMsg: 'Can you check the Kanban board?', time: '9:41 AM', unread: 2 },
  { id: 2, name: 'Morgan Manager', role: 'Project Manager', online: true, lastMsg: 'Great work on the UI!', time: '9:15 AM', unread: 0 },
  { id: 3, name: 'Taylor Member', role: 'Team Member', online: false, lastMsg: 'Task is now in review', time: 'Yesterday', unread: 0 },
  { id: 4, name: 'Val Viewer', role: 'Viewer', online: false, lastMsg: 'Looks good to me!', time: 'Mon', unread: 0 },
  { id: 5, name: 'Sam Spencer', role: 'Team Member', online: true, lastMsg: 'Starting on the backend.', time: '8:02 AM', unread: 1 },
];

const INITIAL_MESSAGES = {
  1: [
    { id: 1, from: 1, text: 'Hey, have you checked the new dashboard design?', time: new Date(Date.now() - 3600000) },
    { id: 2, from: 'me', text: 'Yes! It looks great. Really happy with the card layout.', time: new Date(Date.now() - 3500000) },
    { id: 3, from: 1, text: 'Can you check the Kanban board?', time: new Date(Date.now() - 1200000) },
  ],
  2: [
    { id: 1, from: 2, text: 'Great work on the UI!', time: new Date(Date.now() - 7200000) },
    { id: 2, from: 'me', text: 'Thanks! The new components are looking really clean.', time: new Date(Date.now() - 7000000) },
  ],
  3: [
    { id: 1, from: 3, text: 'Task is now in review', time: new Date(Date.now() - 86400000) },
  ],
  4: [{ id: 1, from: 4, text: 'Looks good to me!', time: new Date(Date.now() - 172800000) }],
  5: [
    { id: 1, from: 5, text: 'Starting on the backend.', time: new Date(Date.now() - 28800000) },
    { id: 2, from: 'me', text: 'Great! Ping me when the API is ready.', time: new Date(Date.now() - 28700000) },
  ],
};

export default function MessagesView({ user }) {
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeMessages = messages[activeContact.id] || [];

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), from: 'me', text: input.trim(), time: new Date() };
    setMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="messages-layout">
      {/* Sidebar */}
      <div className="messages-sidebar">
        <div className="messages-sidebar-head">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Messages</h2>
          <button className="zendo-more-btn" title="New message">
            <MessageSquare size={18} />
          </button>
        </div>
        <div className="searchbox" style={{ margin: '12px 16px' }}>
          <Search size={14} />
          <input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="messages-contact-list">
          {filteredContacts.map(c => (
            <div
              key={c.id}
              className={`messages-contact-item ${activeContact.id === c.id ? 'active' : ''}`}
              onClick={() => { setActiveContact(c); }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="member-avatar" style={{ width: 40, height: 40, fontSize: 14, background: colorFor(c.name) }}>
                  {initials(c.name)}
                </div>
                {c.online && <span className="online-dot" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{c.lastMsg}</span>
                  {c.unread > 0 && (
                    <span style={{ background: '#6d28d9', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 4 }}>{c.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="messages-chat">
        {/* Header */}
        <div className="messages-chat-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <div className="member-avatar" style={{ width: 38, height: 38, fontSize: 13, background: colorFor(activeContact.name) }}>
                {initials(activeContact.name)}
              </div>
              {activeContact.online && <span className="online-dot" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{activeContact.name}</div>
              <div style={{ fontSize: 11, color: activeContact.online ? '#059669' : '#94a3b8' }}>
                {activeContact.online ? '● Online' : '● Offline'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" title="Voice call"><Phone size={17} /></button>
            <button className="icon-btn" title="Video call"><Video size={17} /></button>
            <button className="icon-btn" title="More options"><MoreVertical size={17} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-body">
          {activeMessages.map(msg => {
            const isMe = msg.from === 'me';
            return (
              <div key={msg.id} className={`msg-row ${isMe ? 'msg-me' : 'msg-them'}`}>
                {!isMe && (
                  <div className="member-avatar" style={{ width: 30, height: 30, fontSize: 11, background: colorFor(activeContact.name), alignSelf: 'flex-end', flexShrink: 0 }}>
                    {initials(activeContact.name)}
                  </div>
                )}
                <div className={`msg-bubble ${isMe ? 'msg-bubble-me' : 'msg-bubble-them'}`}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{fmtTime(msg.time)}</span>
                    {isMe && <CheckCheck size={12} color="rgba(255,255,255,0.8)" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="messages-input-bar">
          <button className="icon-btn" title="Attach file"><Paperclip size={17} /></button>
          <input
            className="messages-input"
            placeholder={`Message ${activeContact.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="icon-btn" title="Emoji"><Smile size={17} /></button>
          <button
            className="btn primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
