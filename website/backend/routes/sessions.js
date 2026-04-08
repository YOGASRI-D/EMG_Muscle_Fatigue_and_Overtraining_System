const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// GET all sessions (list view, no signal snapshot for performance)
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find(
      {},
      '-signalSnapshot' // exclude heavy signal data from list
    ).sort({ timestamp: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single session with full signal snapshot
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
