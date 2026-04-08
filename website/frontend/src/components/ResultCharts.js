import React, { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

function buildChartData(snapshot, activations) {
  if (!snapshot || !snapshot.time) return [];
  return snapshot.time.map((t, i) => ({
    t: parseFloat((t / 1000).toFixed(2)),
    filtered: parseFloat((snapshot.filtered[i] || 0).toFixed(4)),
    rms: parseFloat((snapshot.rms[i] || 0).toFixed(4)),
  }));
}

export default function ResultCharts({ snapshot, activations }) {
  const data = useMemo(
    () => buildChartData(snapshot, activations),
    [snapshot, activations]
  );

  const tooltipStyle = {
    contentStyle: {
      background: '#0d1420',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      fontFamily: 'JetBrains Mono',
      fontSize: '11px',
      color: '#e8f0fe',
    },
    labelStyle: { color: '#00c8ff' },
  };

  const axisProps = {
    tick: { fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#445566' },
    tickLine: false,
    axisLine: false,
  };

  if (data.length === 0) return null;

  // Mark activation zones as reference areas
  const activationLines = (activations || []).flatMap((a, i) => {
    const startT = data[a.start]?.t;
    const endT = data[Math.min(a.end, data.length - 1)]?.t;
    if (startT == null || endT == null) return [];
    return [
      <ReferenceLine key={`as-${i}`} x={startT} stroke="rgba(0,200,255,0.3)" strokeDasharray="3 3" />,
      <ReferenceLine key={`ae-${i}`} x={endT} stroke="rgba(0,200,255,0.15)" strokeDasharray="3 3" />,
    ];
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* EMG Signal */}
      <div className="card">
        <p className="label" style={{ marginBottom: '16px' }}>
          EMG Signal — Normalized with Activation Zones
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
            <XAxis dataKey="t" {...axisProps}
              label={{ value: 'time (s)', position: 'insideBottomRight', offset: 0,
                fill: '#445566', fontSize: 10 }}
            />
            <YAxis {...axisProps} domain={[0, 1]} />
            <Tooltip {...tooltipStyle}
              formatter={(v, name) => [v.toFixed(4), name === 'filtered' ? 'EMG' : 'RMS']}
              labelFormatter={(l) => `t = ${l}s`}
            />
            {activationLines}
            <Line
              type="monotone" dataKey="filtered"
              stroke="#00c8ff" strokeWidth={1.2}
              dot={false} isAnimationActive={false}
              name="EMG"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RMS Envelope */}
      <div className="card">
        <p className="label" style={{ marginBottom: '16px' }}>
          RMS Envelope — Fatigue Trend
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
            <XAxis dataKey="t" {...axisProps}
              label={{ value: 'time (s)', position: 'insideBottomRight', offset: 0,
                fill: '#445566', fontSize: 10 }}
            />
            <YAxis {...axisProps} domain={[0, 'dataMax + 0.05']} />
            <Tooltip {...tooltipStyle}
              formatter={(v) => [v.toFixed(4), 'RMS']}
              labelFormatter={(l) => `t = ${l}s`}
            />
            <Area
              type="monotone" dataKey="rms"
              stroke="#00e5a0" fill="rgba(0,229,160,0.12)"
              strokeWidth={2} dot={false} isAnimationActive={false}
              name="RMS"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
