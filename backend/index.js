const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/verifyToken');
require('dotenv').config();
const { submitRoundResult } = require('./adaptive-engine/src');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
// Middleware
app.use(express.json());

// Firebase initialization
const { db } = require('./config/firebase');

console.log('Firebase Admin connected!');

 //===============================
// HOME
// ===============================

app.get('/', (req, res) => {
  res.json({
    message: 'Dementia Backend API is running'
  });
});

// ===============================
// DIFFICULTY API
// ===============================

app.get('/difficulty/:gameType/:level', async (req, res) => {
  try {
    const { gameType, level } = req.params;

    const id = `${gameType}_level_${level}`;

    const doc = await db.collection('difficultyLevels').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        message: 'Difficulty level not found'
      });
    }

    res.json(doc.data());

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

// ===============================
// USERS API
// ===============================

// Create a user
app.post('/sessions', verifyToken, async (req, res) => {
  try {
   const { gameType, level } = req.body;
const userId = req.user.uid;

    const validGameTypes = [
      'pattern_recall',
      'sequencing',
      'face_name_matching',
      'object_placement'
    ];

    // Required fields
    if (!gameType || level === undefined) {
      return res.status(400).json({
        error: 'userId, gameType and level are required'
      });
    }

    // Validate game type
    if (!validGameTypes.includes(gameType)) {
      return res.status(400).json({
        error: 'Invalid gameType'
      });
    }

    // Validate level
    if (!Number.isInteger(Number(level)) || Number(level) < 1 || Number(level) > 4) {
      return res.status(400).json({
        error: 'level must be between 1 and 4'
      });
    }

    const sessionData = {
      userId,
      gameType,
      level: Number(level),
      startedAt: new Date()
    };

    const docRef = await db.collection('sessions').add(sessionData);

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: docRef.id
    });

  } catch (error) {
    console.error('Error creating session:', error);

    res.status(500).json({
      error: 'Failed to create session'
    });
  }
});

// Get a session
app.get('/sessions/:id', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const doc = await db.collection('sessions').doc(sessionId).get();

    if (!doc.exists) {
      return res.status(404).json({
        message: 'Session not found'
      });
    }

    res.json({
      sessionId: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to get session'
    });
  }
});
// ===============================
// PERFORMANCE API
// ===============================

// Create performance record
app.post('/performance', verifyToken, async (req, res) => {
  try {
    const {
  sessionId,
  gameType,
  level,
  score,
  accuracy,
  errors,
  responseTimeSeconds
} = req.body;

const userId = req.user.uid;

    // Validate required fields
    if (
  !sessionId ||
  !gameType ||
  level === undefined ||
  score === undefined ||
  accuracy === undefined
){
      return res.status(400).json({
        message: 'userId, sessionId, gameType, level, score and accuracy are required'
      });
    }
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();

if (!sessionDoc.exists) {
  return res.status(404).json({
    message: 'Session not found'
  });
}

const sessionData = sessionDoc.data();

if (sessionData.userId !== userId) {
  return res.status(403).json({
    message: 'Session does not belong to this user'
  });
}
    const validGameTypes = [
  'pattern_recall',
  'sequencing',
  'face_name_matching',
  'object_placement'
];

if (!validGameTypes.includes(gameType)) {
  return res.status(400).json({
    message: 'Invalid gameType'
  });
}

if (Number(accuracy) < 0 || Number(accuracy) > 100 || isNaN(Number(accuracy))) {
  return res.status(400).json({
    message: 'accuracy must be a number between 0 and 100'
  });
}
if (
  !Number.isInteger(Number(level)) ||
  Number(level) < 1 ||
  Number(level) > 4
) {
  return res.status(400).json({
    message: 'level must be an integer between 1 and 4'
  });
}
if (Number(score) < 0 || isNaN(Number(score))) {
  return res.status(400).json({
    message: 'score must be a non-negative number'
  });
}

if (errors !== undefined && (Number(errors) < 0 || isNaN(Number(errors)))) {
  return res.status(400).json({
    message: 'errors must be a non-negative number'
  });
}
if (
  responseTimeSeconds !== undefined &&
  (Number(responseTimeSeconds) < 0 || isNaN(Number(responseTimeSeconds)))
) {
  return res.status(400).json({
    message: 'responseTimeSeconds must be a non-negative number'
  });
}
    const performanceRef = await db.collection('performance').add({
      userId: userId,
      sessionId: sessionId,
      gameType: gameType,
      level: level,
      score: score,
      accuracy: accuracy,
      errors: errors || 0,
      responseTimeSeconds: responseTimeSeconds || 0,
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'Performance recorded successfully',
      performanceId: performanceRef.id
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to record performance'
    });
  }
});


// Get performance records for a user
app.get('/performance/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.uid !== userId) {
  return res.status(403).json({
    message: 'You can only access your own progress'
  });
}
    


    const snapshot = await db
      .collection('performance')
      .where('userId', '==', userId)
      .get();

    const performances = [];

    snapshot.forEach(doc => {
      performances.push({
        performanceId: doc.id,
        ...doc.data()
      });
    });

    res.json({
      userId: userId,
      count: performances.length,
      performances: performances
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to get performance records'
    });
  }
});
// ===============================
// PROGRESS API
// ===============================

// Get user progress
app.get('/progress/:userId', verifyToken, async (req, res) => { try {
    const userId = req.params.userId;

    const snapshot = await db
      .collection('performance')
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return res.json({
        userId: userId,
        totalGames: 0,
        averageAccuracy: 0,
        gameTypeBreakdown: {},
        currentLevel: {}
      });
    }

    let totalAccuracy = 0;
    const gameTypeBreakdown = {};
    const currentLevel = {};

    snapshot.forEach(doc => {
      const data = doc.data();

      totalAccuracy += Number(data.accuracy) || 0;

      if (!gameTypeBreakdown[data.gameType]) {
        gameTypeBreakdown[data.gameType] = 0;
      }

      gameTypeBreakdown[data.gameType]++;

      if (
        !currentLevel[data.gameType] ||
        data.level > currentLevel[data.gameType]
      ) {
        currentLevel[data.gameType] = data.level;
      }
    });

    const totalGames = snapshot.size;
    const averageAccuracy = totalAccuracy / totalGames;

    res.json({
      userId: userId,
      totalGames: totalGames,
      averageAccuracy: Number(averageAccuracy.toFixed(2)),
      gameTypeBreakdown: gameTypeBreakdown,
      currentLevel: currentLevel
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to get user progress'
    });
  }
});

console.log('Progress route registered');

// ===============================
// ADAPTIVE DIFFICULTY API
// ===============================

app.post('/adaptive/next-level', verifyToken, async (req, res) => {
  try {
    const { gameType, currentLevel, accuracy } = req.body;
    const userId = req.user.uid;

    console.log('Adaptive request:', {
      gameType,
      currentLevel,
      accuracy,
      userId
    });

    const validGameTypes = [
      'pattern_recall',
      'sequencing',
      'face_name_matching',
      'object_placement'
    ];

    if (!validGameTypes.includes(gameType)) {
      return res.status(400).json({
        message: 'Invalid gameType'
      });
    }

    const level = Number(currentLevel);
    const accuracyPercent = Number(accuracy);

    if (!Number.isInteger(level) || level < 1 || level > 4) {
      return res.status(400).json({
        message: 'currentLevel must be an integer between 1 and 4'
      });
    }

    if (
      !Number.isFinite(accuracyPercent) ||
      accuracyPercent < 0 ||
      accuracyPercent > 100
    ) {
      return res.status(400).json({
        message: 'accuracy must be a number between 0 and 100'
      });
    }

    // Get the user's performance records
const snapshot = await db
  .collection('performance')
  .where('userId', '==', userId)
  .get();

const matchingPerformances = [];

snapshot.forEach(doc => {
  const data = doc.data();

  if (
    data.gameType === gameType &&
    Number(data.level) === level
  ) {
    matchingPerformances.push(data);
  }
});

let correctCount;
let totalCount;
let responseTimeSec;

if (matchingPerformances.length > 0) {

  // Sort newest performance first
  matchingPerformances.sort((a, b) => {
    const timeA = a.createdAt?.toDate
      ? a.createdAt.toDate().getTime()
      : new Date(a.createdAt).getTime();

    const timeB = b.createdAt?.toDate
      ? b.createdAt.toDate().getTime()
      : new Date(b.createdAt).getTime();

    return timeB - timeA;
  });

  const latest = matchingPerformances[0];

  correctCount = Number(latest.score) || 0;

  const errors = Number(latest.errors) || 0;

  totalCount = correctCount + errors;

  responseTimeSec =
    Number(latest.responseTimeSeconds) || 0;

} else {

  // Fallback when no matching performance exists
  totalCount = 100;
  correctCount = accuracyPercent;
  responseTimeSec = 10;
}

// Prevent invalid total count
if (totalCount <= 0) {
  totalCount = 100;
  correctCount = accuracyPercent;
}

    console.log('Sending real performance to adaptive engine:', {
      userId,
      gameType,
      level,
      correctCount,
      totalCount,
      responseTimeSec
    });

    // Trayee's Adaptive Engine
    const adaptiveResult = submitRoundResult({
      userId,
      gameType,
      level,
      correctCount,
      totalCount,
      responseTimeSec
    });

    console.log('Adaptive engine result:', adaptiveResult);

    return res.json({
      gameType,
      currentLevel: level,
      accuracy: Number(
        (adaptiveResult.accuracy * 100).toFixed(2)
      ),
      nextLevel: adaptiveResult.nextLevel,
      reason: adaptiveResult.reason,
      action: adaptiveResult.action,
      nextTemplate: adaptiveResult.nextTemplate,
      timeRatio: adaptiveResult.timeRatio,
      performanceTag: adaptiveResult.performanceTag
    });

  } catch (error) {
    console.error('================ ADAPTIVE ERROR ================');
console.error(error);
console.error(error.stack);
console.error('=================================================');

    return res.status(500).json({
      message: 'Failed to calculate next level',
      error: error.message
    });
  }
});
// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});