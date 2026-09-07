const assert = require('assert');
const { classifyRound, decideNextLevel } = require('../src/ruleEngine');
const { resetState } = require('../src/sessionTracker');
const { submitRoundResult, getCurrentState } = require('../src/index');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

// ---------- classifyRound ----------

test('classifyRound: high accuracy + fast time = strong', () => {
  const { tag } = classifyRound({
    correctCount: 6, totalCount: 6, responseTimeSec: 20, timeLimitSeconds: 60,
  });
  assert.strictEqual(tag, 'strong');
});

test('classifyRound: low accuracy = weak', () => {
  const { tag } = classifyRound({
    correctCount: 1, totalCount: 6, responseTimeSec: 30, timeLimitSeconds: 60,
  });
  assert.strictEqual(tag, 'weak');
});

test('classifyRound: ran out of time = weak even if accuracy ok', () => {
  const { tag } = classifyRound({
    correctCount: 5, totalCount: 6, responseTimeSec: 65, timeLimitSeconds: 60,
  });
  assert.strictEqual(tag, 'weak');
});

test('classifyRound: mid accuracy, mid time = neutral', () => {
  const { tag } = classifyRound({
    correctCount: 4, totalCount: 6, responseTimeSec: 35, timeLimitSeconds: 60,
  });
  assert.strictEqual(tag, 'neutral');
});

// ---------- decideNextLevel ----------

test('decideNextLevel: single strong round does NOT level up (needs streak)', () => {
  const decision = decideNextLevel(
    { gameType: 'pattern_recall', level: 1, correctCount: 4, totalCount: 4, responseTimeSec: 20, timeLimitSeconds: 90 },
    { strongStreak: 0, weakStreak: 0 }
  );
  assert.strictEqual(decision.action, 'stay');
  assert.strictEqual(decision.nextLevel, 1);
});

test('decideNextLevel: second consecutive strong round levels up', () => {
  const decision = decideNextLevel(
    { gameType: 'pattern_recall', level: 1, correctCount: 4, totalCount: 4, responseTimeSec: 20, timeLimitSeconds: 90 },
    { strongStreak: 1, weakStreak: 0 }
  );
  assert.strictEqual(decision.action, 'level_up');
  assert.strictEqual(decision.nextLevel, 2);
});

test('decideNextLevel: cannot level up past MAX_LEVEL (4)', () => {
  const decision = decideNextLevel(
    { gameType: 'pattern_recall', level: 4, correctCount: 10, totalCount: 10, responseTimeSec: 10, timeLimitSeconds: 45 },
    { strongStreak: 1, weakStreak: 0 }
  );
  assert.strictEqual(decision.nextLevel, 4);
  assert.strictEqual(decision.action, 'stay');
});

test('decideNextLevel: second consecutive weak round levels down', () => {
  const decision = decideNextLevel(
    { gameType: 'pattern_recall', level: 3, correctCount: 1, totalCount: 8, responseTimeSec: 55, timeLimitSeconds: 60 },
    { strongStreak: 0, weakStreak: 1 }
  );
  assert.strictEqual(decision.action, 'level_down');
  assert.strictEqual(decision.nextLevel, 2);
});

test('decideNextLevel: cannot level down past MIN_LEVEL (1)', () => {
  const decision = decideNextLevel(
    { gameType: 'pattern_recall', level: 1, correctCount: 0, totalCount: 4, responseTimeSec: 90, timeLimitSeconds: 90 },
    { strongStreak: 0, weakStreak: 1 }
  );
  assert.strictEqual(decision.nextLevel, 1);
  assert.strictEqual(decision.action, 'stay');
});

// ---------- integration through index.js (with sessionTracker state) ----------

test('submitRoundResult: two strong rounds in a row levels the user up', () => {
  const userId = 'test_user_1';
  const gameType = 'sequencing';
  resetState(userId, gameType);

  submitRoundResult({ userId, gameType, level: 1, correctCount: 4, totalCount: 4, responseTimeSec: 20 });
  const second = submitRoundResult({ userId, gameType, level: 1, correctCount: 4, totalCount: 4, responseTimeSec: 20 });

  assert.strictEqual(second.action, 'level_up');
  assert.strictEqual(second.nextLevel, 2);

  const state = getCurrentState(userId, gameType);
  assert.strictEqual(state.level, 2);
});

test('submitRoundResult: rejects invalid gameType', () => {
  assert.throws(() => {
    submitRoundResult({
      userId: 'x', gameType: 'not_a_real_game', level: 1,
      correctCount: 1, totalCount: 1, responseTimeSec: 1,
    });
  }, /Invalid gameType/);
});

// ---------- summary ----------

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
