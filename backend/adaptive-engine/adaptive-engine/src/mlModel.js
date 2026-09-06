/**
 * mlModel.js
 * -------------------------------------------------------------------------
 * STUB for the "if time permits" ML layer.
 *
 * Plan: train a lightweight classifier/regressor offline (Python,
 * scikit-learn) on features derived from OASIS/ADNI (or your own app's
 * collected session data), export it, and score it here — either via
 * a small ONNX/TF.js runtime in Node, or by calling a Python microservice.
 *
 * Until that's ready, predict() just defers to the rule engine's decision
 * so the rest of the app never needs to know whether ML is "on".
 * -------------------------------------------------------------------------
 */

const { decideNextLevel } = require('./ruleEngine');

const ML_ENABLED = false; // flip to true once a real model is wired in

/**
 * Same signature as ruleEngine.decideNextLevel, so index.js can swap
 * between rule-only and rule+ML without changing its own code.
 *
 * @param {import('./ruleEngine').RoundResult} round
 * @param {{ strongStreak: number, weakStreak: number }} streaks
 * @returns {import('./ruleEngine').DifficultyDecision}
 */
function predict(round, streaks) {
  if (!ML_ENABLED) {
    return decideNextLevel(round, streaks);
  }

  // --- Future real implementation sketch ---
  // const features = extractFeatures(round, streaks);
  // const mlScore = model.run(features); // e.g. probability patient is struggling
  // return blendWithRuleEngine(decideNextLevel(round, streaks), mlScore);

  return decideNextLevel(round, streaks);
}

/**
 * Feature extraction placeholder — this is where you'd map a round +
 * history into the same feature space your OASIS/ADNI-trained model expects
 * (e.g. normalized accuracy, response-time variance, error patterns).
 */
function extractFeatures(round, streaks) {
  return {
    accuracy: round.correctCount / round.totalCount,
    timeRatio: round.responseTimeSec / round.timeLimitSeconds,
    strongStreak: streaks.strongStreak,
    weakStreak: streaks.weakStreak,
    level: round.level,
  };
}

module.exports = {
  predict,
  extractFeatures,
  ML_ENABLED,
};
