const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');

// Create user (email/password) and a matching Firestore profile doc
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection('Users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ uid: userRecord.uid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify a client-side-obtained ID token (login itself happens client-side via Firebase SDK)
router.post('/verify', async (req, res) => {
  const { idToken } = req.body;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    res.json({ uid: decoded.uid, email: decoded.email });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;