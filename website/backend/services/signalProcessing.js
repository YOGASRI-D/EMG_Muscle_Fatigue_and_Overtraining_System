/**
 * EMG Signal Processing Service
 * Mirrors analyze.py logic exactly:
 *  - Normalize signal
 *  - RMS envelope (rolling window)
 *  - Activation zone detection (threshold = 0.35)
 *  - Fatigue Index = RMS(second half) / RMS(first half)
 *  - Peak Drop %
 *  - Scoring (0-100) + classification
 */

const ACTIVATION_THRESHOLD = 0.35;
const RMS_WINDOW = 50; // ~100ms at 500Hz

/**
 * Normalize array to [0, 1]
 */
function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min;
  if (range === 0) return arr.map(() => 0);
  return arr.map((v) => (v - min) / range);
}

/**
 * Compute RMS over a rolling window
 */
function rollingRMS(arr, windowSize) {
  const result = new Array(arr.length).fill(0);
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = arr.slice(start, i + 1);
    const meanSq = window.reduce((sum, v) => sum + v * v, 0) / window.length;
    result[i] = Math.sqrt(meanSq);
  }
  return result;
}

/**
 * Detect activation zones where normalized signal > threshold
 * Returns array of {start, end} indices
 */
function detectActivations(normalizedArr, threshold) {
  const activations = [];
  let inActivation = false;
  let start = 0;

  for (let i = 0; i < normalizedArr.length; i++) {
    if (!inActivation && normalizedArr[i] > threshold) {
      inActivation = true;
      start = i;
    } else if (inActivation && normalizedArr[i] <= threshold) {
      inActivation = false;
      activations.push({ start, end: i });
    }
  }
  if (inActivation) {
    activations.push({ start, end: normalizedArr.length - 1 });
  }
  return activations;
}

/**
 * RMS of a sub-array
 */
function rmsOf(arr) {
  if (arr.length === 0) return 0;
  const meanSq = arr.reduce((sum, v) => sum + v * v, 0) / arr.length;
  return Math.sqrt(meanSq);
}

/**
 * Generate score, status and advice from metrics
 */
function classify(fatigueIndex, peakDropPercent, activationCount) {
  // Score starts at 100, deductions applied
  let score = 100;

  // Fatigue index deduction (ideal = 1.0, higher = worse)
  if (fatigueIndex > 1.5) score -= 40;
  else if (fatigueIndex > 1.2) score -= 20;
  else if (fatigueIndex > 1.0) score -= 10;

  // Peak drop deduction
  if (peakDropPercent > 40) score -= 30;
  else if (peakDropPercent > 20) score -= 15;
  else if (peakDropPercent > 10) score -= 7;

  // Very low activation — possible bad signal
  if (activationCount < 2) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let status, advice;

  if (score >= 70) {
    status = 'NORMAL';
    advice =
      'Excellent session! Your muscle activity is healthy and well-distributed. ' +
      'Continue your current training routine. Maintain hydration and allow 24h recovery before next high-intensity session.';
  } else if (score >= 40) {
    status = 'EARLY FATIGUE';
    advice =
      'Early signs of muscle fatigue detected. Consider reducing load by 15–20% next session. ' +
      'Incorporate active recovery: light stretching, foam rolling. Ensure 7–8 hours of sleep for optimal muscle repair.';
  } else {
    status = 'OVERTRAINING DETECTED';
    advice =
      'Significant muscle fatigue and overtraining indicators present. ' +
      'Rest for 48–72 hours before next session. Prioritize protein intake (1.6–2.2g/kg body weight). ' +
      'Consider consulting a sports physiotherapist if fatigue persists.';
  }

  return { score, status, advice };
}

/**
 * Main analysis function
 * @param {Array} data - Array of { time_ms, raw, filtered }
 * @returns {Object} Full analysis result
 */
// function analyzeEMG(data) {
//   if (!data || data.length < 10) {
//     throw new Error('Insufficient data for analysis (need at least 10 samples)');
//   }

//   const filtered = data.map((d) => d.filtered);

//   // 1. Normalize
//   const normalized = normalize(filtered);

//   // 2. RMS envelope
//   const rmsEnvelope = rollingRMS(normalized, RMS_WINDOW);

//   // 3. Detect activations
//   const activations = detectActivations(normalized, ACTIVATION_THRESHOLD);

//   // 4. Fatigue index: RMS second half / first half
//   const mid = Math.floor(normalized.length / 2);
//   const firstHalf = normalized.slice(0, mid);
//   const secondHalf = normalized.slice(mid);
//   const rmsFirst = rmsOf(firstHalf);
//   const rmsSecond = rmsOf(secondHalf);
//   const fatigueIndex = rmsFirst > 0 ? rmsSecond / rmsFirst : 1.0;

//   // 5. Peak Drop %: compare peak of first quarter vs last quarter
//   const q = Math.floor(normalized.length / 4);
//   const firstQ = normalized.slice(0, q);
//   const lastQ = normalized.slice(normalized.length - q);
//   const peakFirst = firstQ.length > 0 ? Math.max(...firstQ) : 0;
//   const peakLast = lastQ.length > 0 ? Math.max(...lastQ) : 0;
//   const peakDropPercent =
//     peakFirst > 0 ? ((peakFirst - peakLast) / peakFirst) * 100 : 0;

//   // 6. Classify
//   const { score, status, advice } = classify(
//     fatigueIndex,
//     peakDropPercent,
//     activations.length
//   );

//   // 7. Downsample signal for storage/display (max 500 points)
//   const step = Math.max(1, Math.floor(data.length / 500));
//   const snapshot = {
//     time: [],
//     filtered: [],
//     rms: [],
//   };
//   for (let i = 0; i < data.length; i += step) {
//     snapshot.time.push(data[i].time_ms);
//     snapshot.filtered.push(normalized[i]);
//     snapshot.rms.push(rmsEnvelope[i]);
//   }

//   return {
//     metrics: {
//       fatigueIndex: parseFloat(fatigueIndex.toFixed(4)),
//       peakDropPercent: parseFloat(peakDropPercent.toFixed(2)),
//       activationCount: activations.length,
//       rmsFirst: parseFloat(rmsFirst.toFixed(4)),
//       rmsSecond: parseFloat(rmsSecond.toFixed(4)),
//       meanFiltered: parseFloat(
//         (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(2)
//       ),
//       maxFiltered: parseFloat(Math.max(...filtered).toFixed(2)),
//     },
//     score,
//     status,
//     advice,
//     activations,
//     snapshot,
//     rowsRecorded: data.length,
//   };
// }
function analyzeEMG(data) {
  if (!data || data.length < 10) {
    throw new Error('Insufficient data for analysis (need at least 10 samples)');
  }

  const time = data.map((d) => d.time_ms);
  const filtered = data.map((d) => d.filtered);

  // ── convert time ─────────────────────────────
  const time_s = time.map((t) => t / 1000);
  const totalDur = Math.max(...time_s);

  // ── baseline skip (same as Python) ───────────
  const skip = Math.min(3.0, totalDur * 0.10);
  const validIdx = time_s.map((t, i) => (t > skip ? i : -1)).filter(i => i !== -1);

  const f2 = validIdx.map(i => filtered[i]);
  const t2 = validIdx.map(i => time_s[i]);

  if (f2.length === 0) {
    throw new Error('No data after baseline skip');
  }

  // ── normalize ────────────────────────────────
  const min = Math.min(...f2);
  const max = Math.max(...f2);
  const range = max - min;

  const norm = range === 0 ? f2.map(() => 0) : f2.map(v => (v - min) / range);

  // ── RMS envelope (same logic as Python) ─────
  const window = Math.max(10, Math.min(100, Math.floor(norm.length / 20)));

  const rms = norm.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = norm.slice(start, i + 1);
    const meanSq = slice.reduce((a, b) => a + b * b, 0) / slice.length;
    return Math.sqrt(meanSq);
  });

  // ── activation ───────────────────────────────
  const active = norm.map(v => v > ACTIVATION_THRESHOLD);

  let activations = 0;
  for (let i = 1; i < active.length; i++) {
    if (active[i] && !active[i - 1]) activations++;
  }

  // ── fatigue index (FIXED) ───────────────────
  const mid = Math.floor(rms.length / 2);
  const rmsFirst = rms.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const rmsSecond = rms.slice(mid).reduce((a, b) => a + b, 0) / (rms.length - mid);

  const fatigueIndex = rmsFirst > 0 ? rmsSecond / rmsFirst : 1.0;

  // ── peak drop (FIXED) ───────────────────────
  const peakFirst = Math.max(...norm.slice(0, mid));
  const peakSecond = Math.max(...norm.slice(mid));

  const peakDropPercent =
    peakFirst > 0 ? ((peakFirst - peakSecond) / peakFirst) * 100 : 0;

  // ── scoring (MATCHES PYTHON) ────────────────
  let score = 0;

  if (fatigueIndex < 0.75) score += 40;
  else if (fatigueIndex < 0.90) score += 20;

  if (peakDropPercent > 30) score += 30;
  else if (peakDropPercent > 15) score += 15;

  if (activations > 60) score += 30;
  else if (activations > 40) score += 15;

  let status, advice;

  if (score >= 60) {
    status = "OVERTRAINING DETECTED";
    advice = "Rest 48–72 hrs. Reduce load by 40%. Focus on recovery.";
  } else if (score >= 30) {
    status = "EARLY FATIGUE";
    advice = "Reduce intensity. Add rest day. Monitor next session.";
  } else {
    status = "MUSCLE CONDITION: NORMAL";
    advice = "Good recovery. Safe to train next session.";
  }

  // ── snapshot (same as before) ───────────────
  const step = Math.max(1, Math.floor(norm.length / 500));
  const snapshot = { time: [], filtered: [], rms: [] };

  for (let i = 0; i < norm.length; i += step) {
    snapshot.time.push(t2[i] * 1000);
    snapshot.filtered.push(norm[i]);
    snapshot.rms.push(rms[i]);
  }

  return {
    metrics: {
      fatigueIndex: +fatigueIndex.toFixed(4),
      peakDropPercent: +peakDropPercent.toFixed(2),
      activationCount: activations,
      rmsFirst: +rmsFirst.toFixed(4),
      rmsSecond: +rmsSecond.toFixed(4),
      meanFiltered: +(f2.reduce((a, b) => a + b, 0) / f2.length).toFixed(2),
      maxFiltered: +Math.max(...f2).toFixed(2),
    },
    score,
    status,
    advice,
    activations: [], // keep structure (frontend safe)
    snapshot,
    rowsRecorded: data.length,
  };
}

module.exports = { analyzeEMG, normalize, rollingRMS, detectActivations };
