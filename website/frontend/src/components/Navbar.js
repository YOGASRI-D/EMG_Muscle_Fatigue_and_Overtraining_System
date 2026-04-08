import React from 'react';

export default function Navbar({ page, setPage, connected }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(8, 12, 18, 0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 32px',
      height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #00c8ff, #00e5a0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>⚡</div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700, fontSize: '20px', letterSpacing: '0.08em',
          color: 'var(--text-primary)',
        }}>
          EMG<span style={{ color: 'var(--accent-cyan)' }}>MONITOR</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {['monitor', 'history'].map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: '6px 18px',
              borderRadius: '8px',
              border: page === p ? '1px solid rgba(0,200,255,0.4)' : '1px solid transparent',
              background: page === p ? 'rgba(0,200,255,0.1)' : 'transparent',
              color: page === p ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
              letterSpacing: '0.05em',
            }}
          >
            {p === 'monitor' ? '⚡ Monitor' : '📋 History'}
          </button>
        ))}
      </div>

      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: connected ? 'var(--accent-green)' : 'var(--text-muted)',
          boxShadow: connected ? '0 0 8px var(--accent-green)' : 'none',
          animation: connected ? 'blink 2s infinite' : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: connected ? 'var(--accent-green)' : 'var(--text-muted)',
        }}>
          {connected ? 'WEBSOCKET LIVE' : 'DISCONNECTED'}
        </span>
      </div>
    </nav>
  );
}
