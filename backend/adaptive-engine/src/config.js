/**
 * config.js
 * -------------------------------------------------------------------------
 * This MUST stay in sync with the backend dev's constants. Treat this file
 * as the "contract" between your adaptive engine and their game engine.
 * If they change GAME_TYPES or LEVEL_TEMPLATES, update this file to match.
 * -------------------------------------------------------------------------
 */

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

const MIN_LEVEL = LEVEL_TEMPLATES[0].level;
const MAX_LEVEL = LEVEL_TEMPLATES[LEVEL_TEMPLATES.length - 1].level;

/**
 * Thresholds that drive the rule-based engine.
 * Tune these during playtesting — they are the "knobs" of your difficulty logic.
 */
const ADAPTIVE_THRESHOLDS = {
  // Accuracy (0-1) above which the round counts as "strong"
  HIGH_ACCURACY: 0.85,
  // Accuracy (0-1) below which the round counts as "weak"
  LOW_ACCURACY: 0.5,
  // Response time as a fraction of timeLimitSeconds. Faster than this = "fast"
  FAST_TIME_RATIO: 0.5,
  // Slower than this fraction of the time limit = "slow"
  SLOW_TIME_RATIO: 0.85,
  // How many consecutive "strong" rounds before we level up
  STREAK_TO_LEVEL_UP: 2,
  // How many consecutive "weak" rounds before we level down
  STREAK_TO_LEVEL_DOWN: 2,
};

module.exports = {
  GAME_TYPES,
  LEVEL_TEMPLATES,
  MIN_LEVEL,
  MAX_LEVEL,
  ADAPTIVE_THRESHOLDS,
};
