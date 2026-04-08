import React from 'react';

export default function ScoreGauge({ score, status }) {
  const color =
    status === 'NORMAL' ? '#00e5a0' :
    status === 'EARLY FATIGUE' ? '#ff8c42' : '#ff4560';

  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '180px', height: '100px' }}>
        <svg width="180" height="105" viewBox="0 0 180 105">
          {/* Background arc */}
          <path
            d="M 15 95 A 75 75 0 0 1 165 95"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 15 95 A 75 75 0 0 1 165 95"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
          {/* Score text */}
          <text
            x="90" y="82"
            textAnchor="middle"
            fill={color}
            fontSize="36"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
          >
            {score}
          </text>
          <text
            x="90" y="98"
            textAnchor="middle"
            fill="#445566"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="2"
          >
            /100
          </text>
        </svg>
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px', letterSpacing: '0.15em',
        color,
      }}>PERFORMANCE SCORE</span>
    </div>
  );
}
