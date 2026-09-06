const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const verifyToken = require('../middleware/verifyToken');

// Log a performance record for a session
router.post('/:sessionId', verifyToken, async (req, res) => {
  const { accuracy, responseTimeMs, attempts } = req.body;
  try {
    const perfRef = await db.collection('Performance').add({
      sessionId: req.params.sessionId,
      accuracy: Number(accuracy),
      responseTimeMs: Number(responseTimeMs),
      attempts: Number(attempts),
      timestamp: new Date().toISOString()
    });
    res.status(201).json({ performanceId: perfRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get performance history for a session
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('Performance')
      .where('sessionId', '==', req.params.sessionId)
      .orderBy('timestamp', 'asc')
      .get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;