/**
 * ESP32 TCP Service
 * Mirrors record.py:
 *  - Connect via TCP socket to ESP32
 *  - Parse "time_ms,raw,filtered\n" stream at ~500Hz
 *  - Emit data to frontend via Socket.IO in real time
 *  - Stop after DURATION seconds
 *  - Return collected data for analysis
 */

const net = require('net');

const ESP32_IP = process.env.ESP32_IP || '10.166.78.237';
const ESP32_PORT = parseInt(process.env.ESP32_PORT) || 5000;
const DURATION = parseInt(process.env.RECORDING_DURATION) || 30;

let activeSocket = null;
let isRecording = false;

/**
 * Parse a single CSV line: "time_ms,raw,filtered"
 */
function parseLine(line) {
  if (!line || !line.includes(',')) return null;
  const parts = line.split(',');
  if (parts.length !== 3) return null;
  const time_ms = parseInt(parts[0]);
  const raw = parseFloat(parts[1]);
  const filtered = parseFloat(parts[2]);
  if (isNaN(time_ms) || isNaN(raw) || isNaN(filtered)) return null;
  return { time_ms, raw, filtered };
}

/**
 * Start recording from ESP32
 * @param {Object} io - Socket.IO server instance
 * @param {string} socketId - The client socket ID to emit to
 * @returns {Promise<Array>} Resolves with collected data after DURATION seconds
 */
function startRecording(io, socketId) {
  return new Promise((resolve, reject) => {
    if (isRecording) {
      return reject(new Error('Recording already in progress'));
    }

    const data = [];
    let buffer = '';
    let arduinoStart = null;
    let recordingStartTime = null;
    let streamConfirmed = false;
    isRecording = true;

    const emitStatus = (status, payload = {}) => {
      io.to(socketId).emit('recording:status', { status, ...payload });
    };

    const emitSample = (sample) => {
      io.to(socketId).emit('recording:sample', sample);
    };

    emitStatus('connecting');

    const sock = net.createConnection(
      { host: ESP32_IP, port: ESP32_PORT },
      () => {
        emitStatus('connected');
        activeSocket = sock;
      }
    );

    sock.setTimeout(10000);

    sock.on('error', (err) => {
      isRecording = false;
      activeSocket = null;
      emitStatus('error', { message: err.message });
      reject(err);
    });

    sock.on('timeout', () => {
      if (!streamConfirmed) {
        sock.destroy();
        isRecording = false;
        activeSocket = null;
        emitStatus('error', { message: 'Connection timed out. Check ESP32 IP and WiFi.' });
        reject(new Error('Connection timeout'));
      }
    });

    sock.on('data', (chunk) => {
      buffer += chunk.toString('utf8', 0, chunk.length);

      // Process all complete lines in buffer
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer
          .slice(0, newlineIdx)
          .trim()
          .replace(/\r/g, '')
          .replace(/\x00/g, '');
        buffer = buffer.slice(newlineIdx + 1);

        const parsed = parseLine(line);
        if (!parsed) continue;

        // First valid line: begin recording
        if (!streamConfirmed) {
          streamConfirmed = true;
          sock.setTimeout(0); // clear timeout once stream confirmed
          emitStatus('recording');
          recordingStartTime = Date.now();
          arduinoStart = parsed.time_ms;
        }

        const elapsed = (Date.now() - recordingStartTime) / 1000;
        if (elapsed >= DURATION) continue; // already past duration, ignore

        const normalizedTime = parsed.time_ms - arduinoStart;
        const sample = {
          time_ms: normalizedTime,
          raw: Math.round(parsed.raw),
          filtered: Math.round(parsed.filtered),
          elapsed: parseFloat(elapsed.toFixed(2)),
          progress: parseFloat(Math.min((elapsed / DURATION) * 100, 100).toFixed(1)),
        };

        data.push({
          time_ms: normalizedTime,
          raw: sample.raw,
          filtered: sample.filtered,
        });

        // Emit every sample to frontend
        emitSample(sample);

        // Auto-stop at DURATION
        if (elapsed >= DURATION) {
          finishRecording();
        }
      }
    });

    sock.on('close', () => {
      if (isRecording) {
        finishRecording();
      }
    });

    // Fallback timer - force stop at DURATION + 1s buffer
    const stopTimer = setTimeout(() => {
      finishRecording();
    }, (DURATION + 1) * 1000);

    function finishRecording() {
      if (!isRecording) return;
      isRecording = false;
      activeSocket = null;
      clearTimeout(stopTimer);
      sock.destroy();
      emitStatus('processing');
      resolve(data);
    }
  });
}

/**
 * Stop recording early
 */
function stopRecording() {
  if (activeSocket) {
    activeSocket.destroy();
    activeSocket = null;
  }
  isRecording = false;
}

function getIsRecording() {
  return isRecording;
}

module.exports = { startRecording, stopRecording, getIsRecording };
