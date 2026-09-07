/**
 * ruleEngine.js
 * -------------------------------------------------------------------------
 * Rule-based difficulty adjustment.
 *
 * Input:  a "round result" describing how the patient just performed
 * Output: a "decision" telling the app what to do next
 *
 * Kept deliberately pure (no DB calls, no state mutation) so it can be
 * unit tested in isolation and later swapped/augmented with an ML model
 * without touching any other layer.
 * -------------------------------------------------------------------------
 */

const { LEVEL_TEMPLATES, MIN_LEVEL, MAX_LEVEL, ADAPTIVE_THRESHOLDS } = require('./config');

/**
 * @typedef {Object} RoundResult
 * @property {string} gameType         - one of GAME_TYPES
 * @property {number} level            - level the round was played at (1-4)
 * @property {number} correctCount     - number of correct responses
 * @property {number} totalCount       - total items/questions in the round
 * @property {number} responseTimeSec  - time taken to complete the round
 * @property {number} timeLimitSeconds - the level's time limit (from template)
 * @property {number} [hintsUsed]      - optional, number of hints used
 */

/**
 * @typedef {Object} DifficultyDecision
 * @property {number} previousLevel
 * @property {number} nextLevel
 * @property {'level_up'|'level_down'|'stay'} action
 * @property {string} reason           - human-readable explanation (useful for logs/UI/debugging)
 * @property {number} accuracy         - 0-1
 * @property {number} timeRatio        - responseTime / timeLimit, 0-1+
 * @property {'strong'|'weak'|'neutral'} performanceTag
 */

function clampLevel(level) {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
}

function getTemplateForLevel(level) {
  const tpl = LEVEL_TEMPLATES.find((t) => t.level === level);
  if (!tpl) {
    throw new Error(`No level template found for level=${level}`);
  }
  return tpl;
}

/**
 * Classify a single round as strong / weak / neutral based on
 * accuracy AND response time together (not either alone — a fast
 * wrong answer is not "strong", and a slow correct answer is not
 * automatically "weak", which matters a lot for a dementia-care
 * context where processing speed varies widely per patient).
 *
 * @param {RoundResult} round
 * @returns {{accuracy:number, timeRatio:number, tag:'strong'|'weak'|'neutral'}}
 */
function classifyRound(round) {
  const { correctCount, totalCount, responseTimeSec, timeLimitSeconds } = round;

  if (totalCount <= 0) {
    throw new Error('totalCount must be > 0');
  }

  const accuracy = correctCount / totalCount;
  const timeRatio = timeLimitSeconds > 0 ? responseTimeSec / timeLimitSeconds : 1;

  const { HIGH_ACCURACY, LOW_ACCURACY, FAST_TIME_RATIO, SLOW_TIME_RATIO } = ADAPTIVE_THRESHOLDS;

  let tag = 'neutral';

  if (accuracy >= HIGH_ACCURACY && timeRatio <= SLOW_TIME_RATIO) {
    // Got it right, and didn't take forever doing it.
    tag = 'strong';
  } else if (accuracy <= LOW_ACCURACY || timeRatio > 1) {
    // Got it mostly wrong, OR ran out of time entirely.
    tag = 'weak';
  } else if (accuracy >= HIGH_ACCURACY && timeRatio <= FAST_TIME_RATIO) {
    // Redundant safety net for very fast + very accurate
    tag = 'strong';
  }

  return { accuracy, timeRatio, tag };
}

/**
 * Decide the next level given the CURRENT round and the recent streak
 * of same-tagged rounds (passed in by the caller via sessionTracker).
 *
 * @param {RoundResult} round
 * @param {{ strongStreak: number, weakStreak: number }} streaks - counts BEFORE this round is applied
 * @returns {DifficultyDecision}
 */
function decideNextLevel(round, streaks = { strongStreak: 0, weakStreak: 0 }) {
  const { level } = round;
  const { accuracy, timeRatio, tag } = classifyRound(round);
  const { STREAK_TO_LEVEL_UP, STREAK_TO_LEVEL_DOWN } = ADAPTIVE_THRESHOLDS;

  let action = 'stay';
  let nextLevel = level;
  let reason = `Performance was ${tag} (accuracy=${(accuracy * 100).toFixed(0)}%, timeRatio=${timeRatio.toFixed(2)}); staying at level ${level}.`;

  // Projected streaks INCLUDING this round
  const projectedStrongStreak = tag === 'strong' ? streaks.strongStreak + 1 : 0;
  const projectedWeakStreak = tag === 'weak' ? streaks.weakStreak + 1 : 0;

  if (tag === 'strong' && projectedStrongStreak >= STREAK_TO_LEVEL_UP) {
    nextLevel = clampLevel(level + 1);
    action = nextLevel === level ? 'stay' : 'level_up';
    reason = nextLevel === level
      ? `Strong streak of ${projectedStrongStreak}, but already at max level ${MAX_LEVEL}.`
      : `Strong streak of ${projectedStrongStreak} consecutive rounds (accuracy=${(accuracy * 100).toFixed(0)}%) → leveling up to ${nextLevel}.`;
  } else if (tag === 'weak' && projectedWeakStreak >= STREAK_TO_LEVEL_DOWN) {
    nextLevel = clampLevel(level - 1);
    action = nextLevel === level ? 'stay' : 'level_down';
    reason = nextLevel === level
      ? `Weak streak of ${projectedWeakStreak}, but already at min level ${MIN_LEVEL}.`
      : `Weak streak of ${projectedWeakStreak} consecutive rounds (accuracy=${(accuracy * 100).toFixed(0)}%) → leveling down to ${nextLevel} for confidence-building.`;
  }

  return {
    previousLevel: level,
    nextLevel,
    action,
    reason,
    accuracy,
    timeRatio,
    performanceTag: tag,
  };
}

/**
 * Convenience: given a decision, return the full level template the
 * app should load next (grid size, item count, time limit, distractors).
 *
 * @param {DifficultyDecision} decision
 * @returns {object} level template
 */
function resolveNextTemplate(decision) {
  return getTemplateForLevel(decision.nextLevel);
}

module.exports = {
  classifyRound,
  decideNextLevel,
  resolveNextTemplate,
  clampLevel,
  getTemplateForLevel,
};
