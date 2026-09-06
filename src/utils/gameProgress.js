const GAME_CONFIG = {
  "Pattern Recall": {
    accuracyKey: "patternAccuracy",
  },

  "Sequencing": {
    accuracyKey: "sequencingAccuracy",
  },

  "Face–Name Matching": {
    accuracyKey: "faceAccuracy",
  },

  "Object Placement": {
    accuracyKey: "objectAccuracy",
  },
};


/* =========================================================
   GET TODAY
========================================================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   GET DAILY HISTORY
========================================================= */

function getDailyHistory() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "mindcareDailyHistory"
      ) || "{}"
    );

  } catch {

    return {};

  }

}


/* =========================================================
   SAVE DAILY ACCURACY
========================================================= */

function saveDailyAccuracy(accuracy) {

  const history =
    getDailyHistory();

  const today =
    getToday();


  if (!history[today]) {

    history[today] = {
      scores: [],
      accuracies: [],
      sessions: 0,
    };

  }


  history[today].accuracies.push(
    Number(accuracy)
  );


  history[today].sessions += 1;


  localStorage.setItem(
    "mindcareDailyHistory",
    JSON.stringify(history)
  );

}


/* =========================================================
   SAVE DAILY SCORE
========================================================= */

function saveDailyScore(score) {

  const history =
    getDailyHistory();

  const today =
    getToday();


  if (!history[today]) {

    history[today] = {
      scores: [],
      accuracies: [],
      sessions: 0,
    };

  }


  history[today].scores.push(
    Number(score)
  );


  localStorage.setItem(
    "mindcareDailyHistory",
    JSON.stringify(history)
  );

}


/* =========================================================
   COMPLETE GAME
========================================================= */

export function completeGame({

  gameName,

  score,

  accuracy,

  responseTime = 0

}) {

  const safeScore =
    Number(score) || 0;


  const safeAccuracy =
    Math.max(
      0,
      Math.min(
        100,
        Number(accuracy) || 0
      )
    );


  const safeResponseTime =
    Number(responseTime) || 0;


  /* =====================================================
     OLD PROGRESS
  ===================================================== */

  const oldXP =
    Number(
      localStorage.getItem(
        "mindcareXP"
      )
    ) || 0;


  const oldSessions =
    Number(
      localStorage.getItem(
        "totalSessions"
      )
    ) || 0;


  const oldGames =
    Number(
      localStorage.getItem(
        "gamesCompleted"
      )
    ) || 0;


  /* =====================================================
     XP
  ===================================================== */

  let earnedXP =
    50 +
    Math.round(
      safeAccuracy * 1.2
    );


  earnedXP +=
    Math.round(
      safeScore * 5
    );


  /* =====================================================
     ACCURACY BONUS
  ===================================================== */

  if (
    safeAccuracy >= 90
  ) {

    earnedXP += 30;

  } else if (
    safeAccuracy >= 80
  ) {

    earnedXP += 15;

  }


  earnedXP =
    Math.max(
      25,
      earnedXP
    );


  /* =====================================================
     TOTAL XP
  ===================================================== */

  const newXP =
    oldXP + earnedXP;


  /* =====================================================
     LEVEL
  ===================================================== */

  const newLevel =
    Math.floor(
      newXP / 500
    ) + 1;


  /* =====================================================
     SAVE PLAYER PROGRESS
  ===================================================== */

  localStorage.setItem(
    "mindcareXP",
    String(newXP)
  );


  localStorage.setItem(
    "mindcareLevel",
    String(newLevel)
  );


  localStorage.setItem(
    "totalSessions",
    String(
      oldSessions + 1
    )
  );


  localStorage.setItem(
    "gamesCompleted",
    String(
      oldGames + 1
    )
  );


  /* =====================================================
     SAVE GAME ACCURACY
  ===================================================== */

  const config =
    GAME_CONFIG[gameName];


  if (config) {

    localStorage.setItem(
      config.accuracyKey,
      String(
        Math.round(
          safeAccuracy
        )
      )
    );

  }


  /* =====================================================
     SAVE DAILY TREND DATA
  ===================================================== */

  const dailyHistory =
    getDailyHistory();

  const today =
    getToday();


  if (!dailyHistory[today]) {

    dailyHistory[today] = {
      scores: [],
      accuracies: [],
      sessions: 0,
    };

  }


  dailyHistory[today].scores.push(
    safeScore
  );


  dailyHistory[today].accuracies.push(
    safeAccuracy
  );


  dailyHistory[today].sessions += 1;


  localStorage.setItem(
    "mindcareDailyHistory",
    JSON.stringify(
      dailyHistory
    )
  );


  /* =====================================================
     RESULT OBJECT
  ===================================================== */

  const result = {

    gameName,

    score:
      safeScore,

    accuracy:
      Math.round(
        safeAccuracy
      ),

    responseTime:
      safeResponseTime,

    earnedXP,

    totalXP:
      newXP,

    level:
      newLevel,

    date:
      today,

    completedAt:
      new Date().toISOString()

  };


  /* =====================================================
     LAST RESULT
  ===================================================== */

  localStorage.setItem(
    "lastGameResult",
    JSON.stringify(
      result
    )
  );


  /* =====================================================
     GAME HISTORY
  ===================================================== */

  let history = [];


  try {

    history =
      JSON.parse(
        localStorage.getItem(
          "gameHistory"
        ) || "[]"
      );

  } catch {

    history = [];

  }


  history.push(
    result
  );


  localStorage.setItem(
    "gameHistory",
    JSON.stringify(
      history
    )
  );


  /* =====================================================
     UPDATE DASHBOARD
  ===================================================== */

  window.dispatchEvent(
    new Event(
      "mindcareProgressUpdated"
    )
  );


  return result;

}


/* =========================================================
   GET LAST 7 DAYS
========================================================= */

export function getLast7Days() {

  const history =
    getDailyHistory();

  const days = [];


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const date =
      new Date();


    date.setDate(
      date.getDate() - i
    );


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");


    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    const dateKey =
      `${year}-${month}-${day}`;


    const dayData =
      history[dateKey];


    let accuracy = 0;


    if (
      dayData &&
      dayData.accuracies &&
      dayData.accuracies.length > 0
    ) {

      accuracy =
        Math.round(
          dayData.accuracies.reduce(
            (
              total,
              value
            ) =>
              total + value,
            0
          ) /
          dayData.accuracies.length
        );

    }


    const dayName =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      );


    days.push({

      date:
        dateKey,

      label:
        dayName,

      accuracy,

      sessions:
        dayData?.sessions || 0

    });

  }


  return days;

}