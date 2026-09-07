const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const verifyToken = require('../middleware/verifyToken');

// Create a session
router.post('/', verifyToken, async (req, res) => {
  const { gameType, difficultyLevel } = req.body;
  try {
    const sessionRef = await db.collection('Sessions').add({
      userId: req.user.uid,
      gameType,
      difficultyLevel,
      startTime: new Date().toISOString(),
      endTime: null
    });
    res.status(201).json({ sessionId: sessionRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions for a user
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('Sessions')
      .where('userId', '==', req.params.userId)
      .orderBy('startTime', 'desc')
      .get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;