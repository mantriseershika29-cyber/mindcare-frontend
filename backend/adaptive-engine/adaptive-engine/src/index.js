/**
 * index.js
 * -------------------------------------------------------------------------
 * Public entry point for the Adaptive Engine.
 * This is the ONLY file the backend dev needs to import from.
 *
 * Usage (backend side):
 *
 *   const { submitRoundResult } = require('./adaptive-engine/src/index');
 *
 *   const result = submitRoundResult({
 *     userId: 'patient_123',
 *     gameType: 'pattern_recall',
 *     level: 2,
 *     correctCount: 5,
 *     totalCount: 6,
 *     responseTimeSec: 40,
 *   });
 *
 *   // result.nextLevel        -> 3
 *   // result.nextTemplate     -> { level:3, label:'Moderate', gridSize:4, ... }
 *   // result.action           -> 'level_up'
 *   // result.reason           -> human-readable explanation
 * -------------------------------------------------------------------------
 */

const { GAME_TYPES, LEVEL_TEMPLATES } = require('./config');
const { getTemplateForLevel } = require('./ruleEngine');
const { getState, applyDecision } = require('./sessionTracker');
const { predict } = require('./mlModel');

/**
 * @param {Object} input
 * @param {string} input.userId
 * @param {string} input.gameType         - must be one of GAME_TYPES
 * @param {number} input.level            - level just played
 * @param {number} input.correctCount
 * @param {number} input.totalCount
 * @param {number} input.responseTimeSec
 * @param {number} [input.timeLimitSeconds] - optional override; else looked up from LEVEL_TEMPLATES
 */
function submitRoundResult(input) {
  const { userId, gameType, level, correctCount, totalCount, responseTimeSec } = input;

  if (!userId) throw new Error('userId is required');
  if (!GAME_TYPES.includes(gameType)) {
    throw new Error(`Invalid gameType "${gameType}". Must be one of: ${GAME_TYPES.join(', ')}`);
  }

  const template = getTemplateForLevel(level);
  const timeLimitSeconds = input.timeLimitSeconds || template.timeLimitSeconds;

  const round = {
    gameType,
    level,
    correctCount,
    totalCount,
    responseTimeSec,
    timeLimitSeconds,
  };

  const state = getState(userId, gameType);
  const decision = predict(round, {
    strongStreak: state.strongStreak,
    weakStreak: state.weakStreak,
  });

  applyDecision(userId, gameType, decision);

  return {
    userId,
    gameType,
    previousLevel: decision.previousLevel,
    nextLevel: decision.nextLevel,
    nextTemplate: getTemplateForLevel(decision.nextLevel),
    action: decision.action,
    reason: decision.reason,
    accuracy: decision.accuracy,
    timeRatio: decision.timeRatio,
    performanceTag: decision.performanceTag,
  };
}

/**
 * Read-only helper: get a user's current level/state for a game
 * (useful for the frontend to know where to resume).
 */
function getCurrentState(userId, gameType) {
  const state = getState(userId, gameType);
  return {
    userId,
    gameType,
    level: state.level,
    template: getTemplateForLevel(state.level),
    strongStreak: state.strongStreak,
    weakStreak: state.weakStreak,
  };
}

module.exports = {
  submitRoundResult,
  getCurrentState,
  GAME_TYPES,
  LEVEL_TEMPLATES,
};
