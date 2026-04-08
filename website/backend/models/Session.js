const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number,
    default: 30,
  },
  rowsRecorded: {
    type: Number,
    required: true,
  },
  metrics: {
    fatigueIndex: Number,
    peakDropPercent: Number,
    activationCount: Number,
    rmsFirst: Number,
    rmsSecond: Number,
    meanFiltered: Number,
    maxFiltered: Number,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['NORMAL', 'EARLY FATIGUE', 'OVERTRAINING DETECTED'],
    required: true,
  },
  advice: {
    type: String,
    required: true,
  },
  // Store downsampled signal for history view (max 500 points)
  signalSnapshot: {
    time: [Number],
    filtered: [Number],
    rms: [Number],
  },
});

module.exports = mongoose.model('Session', sessionSchema);
