// seedFirestore.js
// Run with: npm run seed

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const GAME_TYPES = [
  'pattern_recall',
  'sequencing',
  'face_name_matching',
  'object_placement',
];

const LEVEL_TEMPLATES = [
  {
    level: 1,
    label: 'Beginner',
    gridSize: 2,
    itemCount: 4,
    timeLimitSeconds: 90,
    distractorCount: 0,
  },
  {
    level: 2,
    label: 'Easy',
    gridSize: 3,
    itemCount: 6,
    timeLimitSeconds: 75,
    distractorCount: 1,
  },
  {
    level: 3,
    label: 'Moderate',
    gridSize: 4,
    itemCount: 8,
    timeLimitSeconds: 60,
    distractorCount: 2,
  },
  {
    level: 4,
    label: 'Challenging',
    gridSize: 5,
    itemCount: 10,
    timeLimitSeconds: 45,
    distractorCount: 3,
  },
];

async function seed() {
  const batch = db.batch();
  const collection = db.collection('difficultyLevels');

  for (const gameType of GAME_TYPES) {
    for (const tpl of LEVEL_TEMPLATES) {
      const id = `${gameType}_level_${tpl.level}`;
      const ref = collection.doc(id);

      batch.set(ref, {
        difficultyId: id,
        label: tpl.label,
        level: tpl.level,
        gameType,
        parameters: {
          gridSize: tpl.gridSize,
          itemCount: tpl.itemCount,
          timeLimitSeconds: tpl.timeLimitSeconds,
          distractorCount: tpl.distractorCount,
        },
        adaptiveRules: {
          promoteIfAccuracyAbove: 85,
          demoteIfAccuracyBelow: 50,
        },
      });
    }
  }

  await batch.commit();

  console.log(
    `Seeded ${GAME_TYPES.length * LEVEL_TEMPLATES.length} difficulty level documents.`
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});