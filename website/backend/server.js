require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const sessionRoutes = require('./routes/sessions');
const { startRecording, stopRecording, getIsRecording } = require('./services/esp32Service');
const { analyzeEMG } = require('./services/signalProcessing');
const Session = require('./models/Session');

const app = express();
const server = http.createServer(app);

// ── Socket.IO setup ────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ── REST Routes ────────────────────────────────────────────────────────────────
app.use('/api/sessions', sessionRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    recording: getIsRecording(),
    esp32: { ip: process.env.ESP32_IP, port: process.env.ESP32_PORT },
  });
});

// ── MongoDB connection ─────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ── Socket.IO events ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('recording:start', async () => {
    if (getIsRecording()) {
      socket.emit('recording:error', { message: 'Recording already in progress' });
      return;
    }

    console.log(`▶ Starting recording for socket ${socket.id}`);

    try {
      // startRecording streams data to frontend and resolves when done
      const rawData = await startRecording(io, socket.id);

      if (!rawData || rawData.length < 10) {
        socket.emit('recording:error', {
          message: `Insufficient data collected (${rawData?.length ?? 0} rows). Check sensor connection.`,
        });
        return;
      }

      console.log(`📊 Analyzing ${rawData.length} samples...`);

      // Analyze signal
      const analysis = analyzeEMG(rawData);

      // Save to MongoDB
      const session = await Session.create({
        rowsRecorded: analysis.rowsRecorded,
        metrics: analysis.metrics,
        score: analysis.score,
        status: analysis.status,
        advice: analysis.advice,
        signalSnapshot: analysis.snapshot,
      });

      console.log(`💾 Session saved: ${session._id} | Score: ${analysis.score} | ${analysis.status}`);

      // Send complete result to frontend
      socket.emit('recording:complete', {
        sessionId: session._id,
        metrics: analysis.metrics,
        score: analysis.score,
        status: analysis.status,
        advice: analysis.advice,
        activations: analysis.activations,
        snapshot: analysis.snapshot,
        rowsRecorded: analysis.rowsRecorded,
      });
    } catch (err) {
      console.error('Recording error:', err.message);
      socket.emit('recording:error', { message: err.message });
    }
  });

  socket.on('recording:stop', () => {
    console.log(`⏹ Stop requested by ${socket.id}`);
    stopRecording();
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    // Don't stop recording on disconnect — user may refresh
  });
});

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 EMG Monitor Backend running on http://localhost:${PORT}`);
  console.log(`📡 ESP32 target: ${process.env.ESP32_IP}:${process.env.ESP32_PORT}`);
  console.log(`⏱  Recording duration: ${process.env.RECORDING_DURATION}s\n`);
});
