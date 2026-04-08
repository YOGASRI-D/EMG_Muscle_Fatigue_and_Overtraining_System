import React from 'react';
import ScoreGauge from './ScoreGauge';
import ResultCharts from './ResultCharts';

function MetricCard({ label, value, unit, color = 'var(--accent-cyan)' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <p className="label" style={{ marginBottom: '10px' }}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '32px', fontWeight: '700',
        color,
        lineHeight: 1,
      }}>
        {value}
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
          {unit}
        </span>
      </p>
    </div>
  );
}

export default function ReportDashboard({ result }) {
  if (!result) return null;

  const { metrics, score, status, advice, activations, snapshot, rowsRecorded } = result;

  const statusColor =
    status === 'NORMAL' ? 'var(--normal)' :
    status === 'EARLY FATIGUE' ? 'var(--early-fatigue)' : 'var(--overtraining)';

  const statusBg =
    status === 'NORMAL' ? 'var(--normal-dim)' :
    status === 'EARLY FATIGUE' ? 'var(--early-fatigue-dim)' : 'var(--overtraining-dim)';

  const statusEmoji =
    status === 'NORMAL' ? '✅' :
    status === 'EARLY FATIGUE' ? '⚠️' : '🔴';

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
      {/* Status banner */}
      <div style={{
        background: statusBg,
        border: `1px solid ${statusColor}`,
        borderRadius: '12px',
        padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '28px' }}>{statusEmoji}</span>
          <div>
            <p className="label">ASSESSMENT RESULT</p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px', fontWeight: '700', letterSpacing: '0.05em',
              color: statusColor, marginTop: '2px',
            }}>
              {status}
            </h2>
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          {rowsRecorded.toLocaleString()} samples · {(rowsRecorded / 30).toFixed(0)} Hz avg
        </div>
      </div>

      {/* Score + metrics row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
        gap: '20px',
        marginBottom: '24px',
        alignItems: 'start',
      }}>
        {/* Gauge */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <ScoreGauge score={score} status={status} />
        </div>

        {/* 3 metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          <MetricCard
            label="FATIGUE INDEX"
            value={metrics.fatigueIndex?.toFixed(3)}
            color={metrics.fatigueIndex > 1.2 ? 'var(--accent-orange)' : 'var(--accent-cyan)'}
          />
          <MetricCard
            label="PEAK DROP"
            value={metrics.peakDropPercent?.toFixed(1)}
            unit="%"
            color={metrics.peakDropPercent > 20 ? 'var(--accent-orange)' : 'var(--accent-green)'}
          />
          <MetricCard
            label="ACTIVATIONS"
            value={metrics.activationCount}
            color="var(--accent-cyan)"
          />
        </div>
      </div>

      {/* Advice box */}
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${statusColor}44`,
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <p className="label" style={{ marginBottom: '8px' }}>💡 RECOVERY ADVICE</p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px', lineHeight: '1.7',
          color: 'var(--text-primary)',
        }}>
          {advice}
        </p>
      </div>

      {/* Signal graphs */}
      <ResultCharts snapshot={snapshot} activations={activations} />

      {/* Extra metrics row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginTop: '20px',
      }}>
        <MetricCard label="RMS FIRST HALF" value={metrics.rmsFirst?.toFixed(3)} color="var(--accent-cyan)" />
        <MetricCard label="RMS SECOND HALF" value={metrics.rmsSecond?.toFixed(3)} color="var(--accent-cyan)" />
        <MetricCard label="MEAN FILTERED" value={metrics.meanFiltered?.toFixed(1)} color="var(--text-secondary)" />
        <MetricCard label="PEAK RAW" value={metrics.maxFiltered?.toFixed(0)} color="var(--text-secondary)" />
      </div>
    </div>
  );
}
