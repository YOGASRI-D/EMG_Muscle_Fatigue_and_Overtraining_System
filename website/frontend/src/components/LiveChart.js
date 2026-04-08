import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip,
} from 'recharts';

const MAX_DISPLAY_POINTS = 300;

export default function LiveChart({ samples }) {
  const displayData = useMemo(() => {
    if (!samples || samples.length === 0) return [];
    const start = Math.max(0, samples.length - MAX_DISPLAY_POINTS);
    return samples.slice(start).map((s) => ({
      t: (s.time_ms / 1000).toFixed(2),
      filtered: s.filtered,
    }));
  }, [samples]);

  if (displayData.length === 0) {
    return (
      <div style={{
        height: '220px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{
          width: '40px', height: '40px', border: '2px solid var(--accent-cyan)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          AWAITING SIGNAL...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={displayData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
        <XAxis
          dataKey="t"
          tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#445566' }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'time (s)', position: 'insideBottomRight', offset: 0,
            fill: '#445566', fontSize: 10 }}
        />
        <YAxis
          tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#445566' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px',
            color: 'var(--text-primary)',
          }}
          labelStyle={{ color: 'var(--accent-cyan)' }}
          formatter={(v) => [v, 'EMG']}
          labelFormatter={(l) => `t = ${l}s`}
        />
        <Line
          type="monotone"
          dataKey="filtered"
          stroke="#00c8ff"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
