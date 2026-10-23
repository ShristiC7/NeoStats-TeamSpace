import React, { useState, useEffect } from 'react';
import {
  X, Mail, ExternalLink, RefreshCw, CheckCircle2,
  Clock, Send, Inbox, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const fmtRelative = d => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
};

export default function RecentEmailsModal({ isOpen, onClose, token }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/system/recent-emails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setEmails(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to load emails');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 740, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 16 }}>
        {/* Header */}
        <div className="modal-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Mail size={20} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 0.8, color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                AUTOMATED EMAIL NOTIFICATIONS (FEATURE 1)
              </div>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700, color: '#0f172a' }}>
                Dispatched Email Log
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="icon-btn"
              onClick={fetchEmails}
              disabled={loading}
              title="Refresh emails"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Subtitle Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px 0', fontSize: 13, color: '#64748b' }}>
          <span>
            Real-time audit log of emails generated and sent via Nodemailer for task assignments and completions.
          </span>
          <span style={{
            background: '#ecfdf5', color: '#059669', fontWeight: 700,
            padding: '3px 10px', borderRadius: 12, fontSize: 12
          }}>
            {emails.length} Dispatched
          </span>
        </div>

        {error && (
          <div className="alert" style={{ marginBottom: 12 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Email List */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, marginTop: 8 }}>
          {loading && emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <div>Fetching dispatched emails...</div>
            </div>
          ) : emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
              <Inbox size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>No dispatched emails yet</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Assign a task to any user (e.g. shristi70525@gmail.com) to trigger an automated notification.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((em, idx) => {
                const isExpanded = expandedId === (em.id || idx);
                return (
                  <div
                    key={em.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 14,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: em.subject.includes('Assigned') ? '#eff6ff' : '#ecfdf5',
                            color: em.subject.includes('Assigned') ? '#2563eb' : '#059669',
                            padding: '2px 8px', borderRadius: 6
                          }}>
                            {em.subject.includes('Assigned') ? 'TASK ASSIGNED' : 'TASK COMPLETED'}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {fmtRelative(em.timestamp)}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                          {em.subject}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                          <strong>To:</strong> <code>{em.to}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {em.previewUrl && (
                          <a
                            href={em.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn secondary"
                            style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, color: '#2563eb' }}
                            title="Open email in Ethereal web preview"
                          >
                            <ExternalLink size={13} /> View Preview
                          </a>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setExpandedId(isExpanded ? null : (em.id || idx))}
                          title={isExpanded ? 'Collapse' : 'Expand full content'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        color: '#334155',
                        lineHeight: 1.5
                      }}>
                        {em.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 14, marginTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
