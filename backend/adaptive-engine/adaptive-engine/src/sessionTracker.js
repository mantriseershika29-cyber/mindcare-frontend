/**
 * sessionTracker.js
 * -------------------------------------------------------------------------
 * Keeps a rolling streak (strong/weak) per (userId, gameType) so the
 * rule engine can make streak-based decisions without needing a database.
 *
 * In production, the backend dev will likely persist this in Postgres
 * (one row per user+gameType with current level, strongStreak, weakStreak,
 * history). This in-memory version is a drop-in stand-in with the SAME
 * shape, so swapping storage later is just swapping this file's internals.
 * -------------------------------------------------------------------------
 */

const { MIN_LEVEL } = require('./config');

/** @type {Map<string, {level:number, strongStreak:number, weakStreak:number, history:object[]}>} */
const store = new Map();

function keyFor(userId, gameType) {
  return `${userId}::${gameType}`;
}

/**
 * Get (or lazily create) the current session state for a user+game.
 */
function getState(userId, gameType) {
  const key = keyFor(userId, gameType);
  if (!store.has(key)) {
    store.set(key, {
      level: MIN_LEVEL,
      strongStreak: 0,
      weakStreak: 0,
      history: [],
    });
  }
  return store.get(key);
}

/**
 * Record a decision from ruleEngine.decideNextLevel and update streaks
 * for the NEXT call.
 *
 * @param {string} userId
 * @param {string} gameType
 * @param {import('./ruleEngine').DifficultyDecision} decision
 */
function applyDecision(userId, gameType, decision) {
  const state = getState(userId, gameType);

  state.strongStreak = decision.performanceTag === 'strong' ? state.strongStreak + 1 : 0;
  state.weakStreak = decision.performanceTag === 'weak' ? state.weakStreak + 1 : 0;
  state.level = decision.nextLevel;
  state.history.push({
    timestamp: new Date().toISOString(),
    ...decision,
  });

  return state;
}

/**
 * Reset a user's progress on a given game (e.g. "start fresh" button).
 */
function resetState(userId, gameType) {
  store.delete(keyFor(userId, gameType));
}

module.exports = {
  getState,
  applyDecision,
  resetState,
};
