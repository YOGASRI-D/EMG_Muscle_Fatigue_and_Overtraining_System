import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import LiveChart from '../components/LiveChart';
import ReportDashboard from '../components/ReportDashboard';

const DURATION = 30;

const STATUS_CONFIG = {
  idle: { label: 'READY', color: 'var(--text-secondary)', dot: '#445566' },
  connecting: { label: 'CONNECTING TO ESP32...', color: 'var(--accent-cyan)', dot: '#00c8ff' },
  connected: { label: 'CONNECTED — WAITING FOR STREAM', color: 'var(--accent-cyan)', dot: '#00c8ff' },
  recording: { label: 'RECORDING', color: 'var(--accent-green)', dot: '#00e5a0' },
  processing: { label: 'PROCESSING SIGNAL...', color: 'var(--accent-orange)', dot: '#ff8c42' },
  complete: { label: 'ANALYSIS COMPLETE', color: 'var(--accent-green)', dot: '#00e5a0' },
  error: { label: 'ERROR', color: 'var(--accent-red)', dot: '#ff4560' },
};

export default function MonitorPage() {
  const { connected, emit, on, off } = useSocket();

  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [samples, setSamples] = useState([]);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const samplesRef = useRef([]);

  // Attach socket listeners
  useEffect(() => {
    const removeStatus = on('recording:status', ({ status, message }) => {
      setRecordingStatus(status);
      if (status === 'error') {
        setErrorMsg(message || 'Unknown error');
      }
    });

    const removeSample = on('recording:sample', (sample) => {
      samplesRef.current = [...samplesRef.current, sample].slice(-600);
      setSamples([...samplesRef.current]);
      setProgress(sample.progress);
      setElapsed(parseFloat(sample.elapsed));
    });

    const removeComplete = on('recording:complete', (data) => {
      setRecordingStatus('complete');
      setResult(data);
      setProgress(100);
    });

    const removeError = on('recording:error', ({ message }) => {
      setRecordingStatus('error');
      setErrorMsg(message);
    });

    return () => {
      removeStatus();
      removeSample();
      removeComplete();
      removeError();
    };
  }, [on]);

  const startRecording = useCallback(() => {
    samplesRef.current = [];
    setSamples([]);
    setResult(null);
    setProgress(0);
    setElapsed(0);
    setErrorMsg('');
    setRecordingStatus('connecting');
    emit('recording:start');
  }, [emit]);

  const stopRecording = useCallback(() => {
    emit('recording:stop');
    setRecordingStatus('idle');
  }, [emit]);

  const reset = () => {
    samplesRef.current = [];
    setSamples([]);
    setResult(null);
    setProgress(0);
    setElapsed(0);
    setRecordingStatus('idle');
    setErrorMsg('');
  };

  const isRecording = recordingStatus === 'recording';
  const isActive = ['connecting', 'connected', 'recording', 'processing'].includes(recordingStatus);
  const cfg = STATUS_CONFIG[recordingStatus] || STATUS_CONFIG.idle;

  const timerStr = `${Math.floor(elapsed).toString().padStart(2, '0')}:${
    Math.floor((elapsed % 1) * 10)
  }`;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '90px 24px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '42px', fontWeight: '700', letterSpacing: '0.04em',
          lineHeight: 1.1,
        }}>
          EMG <span style={{ color: 'var(--accent-cyan)' }}>REAL-TIME</span>
          <br />MONITOR
        </h1>
        <p style={{
          color: 'var(--text-secondary)', fontSize: '14px',
          marginTop: '8px', fontFamily: 'var(--font-body)',
        }}>
          Connect your ESP32 sensor and start a 30-second muscle activity recording session.
        </p>
      </div>

      {/* Recording card */}
      {!result && (
        <div className="card" style={{ marginBottom: '24px' }}>
          {/* Status row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '20px',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: cfg.dot,
                boxShadow: isRecording ? `0 0 10px ${cfg.dot}` : 'none',
                animation: isActive ? 'blink 1.2s infinite' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                letterSpacing: '0.12em', color: cfg.color,
              }}>
                {cfg.label}
              </span>
            </div>

            {/* Timer */}
            {isRecording && (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px', fontWeight: '700',
                color: elapsed >= DURATION * 0.8 ? 'var(--accent-orange)' : 'var(--accent-cyan)',
              }}>
                {Math.floor(elapsed).toString().padStart(2, '0')}
                <span style={{ fontSize: '16px', opacity: 0.6 }}>s</span>
                {' / '}
                {DURATION}
                <span style={{ fontSize: '16px', opacity: 0.6 }}>s</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px', marginBottom: '20px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px rgba(0,200,255,0.4)',
            }} />
          </div>

          {/* Live chart */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px 8px 8px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
          }}>
            <p className="label" style={{ marginBottom: '10px', paddingLeft: '8px' }}>
              LIVE EMG SIGNAL — FILTERED
            </p>
            <LiveChart samples={samples} />
          </div>

          {/* Sample counter */}
          {samples.length > 0 && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--text-muted)', marginBottom: '16px',
            }}>
              {samples.length} samples received in buffer
            </p>
          )}

          {/* Error */}
          {recordingStatus === 'error' && (
            <div style={{
              background: 'var(--overtraining-dim)',
              border: '1px solid rgba(255,69,96,0.3)',
              borderRadius: '8px', padding: '14px 16px',
              marginBottom: '16px',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                color: 'var(--accent-red)',
              }}>
                ⚠ {errorMsg}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Check that ESP32 is powered, connected to WiFi, and IP is set correctly in .env
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isActive && (
              <button
                onClick={startRecording}
                disabled={!connected}
                style={{
                  padding: '12px 32px',
                  background: connected
                    ? 'linear-gradient(135deg, var(--accent-cyan), #0088cc)'
                    : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: connected ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px', fontWeight: '700', letterSpacing: '0.06em',
                  cursor: connected ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: connected ? '0 4px 20px rgba(0,200,255,0.3)' : 'none',
                }}
              >
                ▶ START RECORDING
              </button>
            )}

            {isActive && (
              <button
                onClick={stopRecording}
                style={{
                  padding: '12px 28px',
                  background: 'rgba(255,69,96,0.15)',
                  border: '1px solid rgba(255,69,96,0.4)',
                  borderRadius: '8px',
                  color: 'var(--accent-red)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px', fontWeight: '700', letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ⏹ STOP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result dashboard */}
      {result && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px', fontWeight: '700', letterSpacing: '0.04em',
            }}>
              SESSION <span style={{ color: 'var(--accent-cyan)' }}>REPORT</span>
            </h2>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: 'rgba(0,200,255,0.1)',
                border: '1px solid rgba(0,200,255,0.3)',
                borderRadius: '8px',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-display)',
                fontSize: '14px', fontWeight: '600', letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              + NEW SESSION
            </button>
          </div>
          <ReportDashboard result={result} />
        </div>
      )}
    </div>
  );
}
