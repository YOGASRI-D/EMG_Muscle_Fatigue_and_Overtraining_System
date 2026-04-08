import React, { useState, useEffect } from 'react';

function statusColor(s) {
  if (s === 'NORMAL') return 'var(--normal)';
  if (s === 'EARLY FATIGUE') return 'var(--early-fatigue)';
  return 'var(--overtraining)';
}

function statusBg(s) {
  if (s === 'NORMAL') return 'var(--normal-dim)';
  if (s === 'EARLY FATIGUE') return 'var(--early-fatigue-dim)';
  return 'var(--overtraining-dim)';
}

function statusEmoji(s) {
  if (s === 'NORMAL') return '✅';
  if (s === 'EARLY FATIGUE') return '⚠️';
  return '🔴';
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      setLoading(true);
      const res = await fetch('/api/sessions');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSessions(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id) {
    if (!window.confirm('Delete this session?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '90px 24px 48px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '2px solid var(--accent-cyan)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
            LOADING SESSIONS...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 24px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px', fontWeight: '700', letterSpacing: '0.04em',
          }}>
            SESSION <span style={{ color: 'var(--accent-cyan)' }}>HISTORY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            {sessions.length} recorded session{sessions.length !== 1 ? 's' : ''} in database
          </p>
        </div>
        <button
          onClick={fetchSessions}
          style={{
            padding: '8px 20px',
            background: 'rgba(0,200,255,0.08)',
            border: '1px solid rgba(0,200,255,0.2)',
            borderRadius: '8px', color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            letterSpacing: '0.1em', cursor: 'pointer',
          }}
        >
          ↺ REFRESH
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--overtraining-dim)',
          border: '1px solid rgba(255,69,96,0.3)',
          borderRadius: '8px', padding: '16px', marginBottom: '24px',
          color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '12px',
        }}>
          ⚠ {error}
        </div>
      )}

      {sessions.length === 0 && !error ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '0.05em' }}>
            NO SESSIONS YET
          </p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            Complete a recording session to see it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((s, idx) => {
            const col = statusColor(s.status);
            const bg = statusBg(s.status);
            const date = new Date(s.timestamp);

            return (
              <div
                key={s._id}
                className="card"
                style={{
                  borderLeft: `3px solid ${col}`,
                  animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto auto',
                  gap: '24px', alignItems: 'center',
                  flexWrap: 'wrap',
                }}>
                  {/* Date / time */}
                  <div>
                    <p className="label" style={{ marginBottom: '4px' }}>SESSION</p>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px', fontWeight: '600',
                      color: 'var(--text-primary)',
                    }}>
                      {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}>
                      {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    background: bg,
                    border: `1px solid ${col}44`,
                    borderRadius: '6px', padding: '6px 12px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '10px',
                      letterSpacing: '0.1em', color: col, whiteSpace: 'nowrap',
                    }}>
                      {statusEmoji(s.status)} {s.status}
                    </p>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center' }}>
                    <p className="label">SCORE</p>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: '28px',
                      fontWeight: '700', color: col,
                    }}>{s.score}</p>
                  </div>

                  {/* Fatigue index */}
                  <div style={{ textAlign: 'center' }}>
                    <p className="label">FATIGUE IDX</p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '16px',
                      color: 'var(--text-primary)',
                    }}>{s.metrics?.fatigueIndex?.toFixed(3)}</p>
                  </div>

                  {/* Activations */}
                  <div style={{ textAlign: 'center' }}>
                    <p className="label">ACTIVATIONS</p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '16px',
                      color: 'var(--text-primary)',
                    }}>{s.metrics?.activationCount}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSession(s._id)}
                    disabled={deleting === s._id}
                    style={{
                      background: 'rgba(255,69,96,0.08)',
                      border: '1px solid rgba(255,69,96,0.2)',
                      borderRadius: '6px', padding: '6px 12px',
                      color: 'var(--accent-red)', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: '11px',
                      opacity: deleting === s._id ? 0.5 : 1,
                    }}
                  >
                    {deleting === s._id ? '...' : 'DELETE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
