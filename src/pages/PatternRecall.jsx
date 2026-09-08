import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { completeGame } from "../utils/gameProgress";

import {
  createSession,
  savePerformance,
  getDifficulty,
  getNextLevel,
} from "../utils/api";

function PatternRecall() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState("start");

  // Dynamic pattern generated from backend difficulty
  const [pattern, setPattern] = useState([]);

  // Dynamic user answer
  const [userPattern, setUserPattern] = useState([]);

  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const [level, setLevel] = useState(
    Number(localStorage.getItem("mindcareLevel")) || 1
  );

  const [difficulty, setDifficulty] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");

  const patternTimerRef = useRef(null);

  // Clean up the 3-second timer when leaving the page
  useEffect(() => {
    return () => {
      if (patternTimerRef.current) {
        clearTimeout(patternTimerRef.current);
      }
    };
  }, []);

  /* =====================================================
     FRIENDLY ERROR
  ===================================================== */

  const getFriendlyError = (err, fallback) => {
    const message = String(err?.message || "").toLowerCase();

    if (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("load failed")
    ) {
      return "Unable to connect to the training server. Please try again.";
    }

    if (
      message.includes("401") ||
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("token")
    ) {
      return "Your login session is no longer valid. Please login again.";
    }

    if (
      message.includes("403") ||
      message.includes("forbidden")
    ) {
      return "You do not have permission to continue. Please login again.";
    }

    return fallback;
  };

  /* =====================================================
     SAFE LEVEL
  ===================================================== */

  const getSafeLevel = () => {
    const storedLevel =
      Number(localStorage.getItem("mindcareLevel")) || 1;

    return Math.min(4, Math.max(1, storedLevel));
  };

  /* =====================================================
     SAVE ADAPTIVE LEVEL
  ===================================================== */

  const saveAdaptiveLevel = (nextLevel) => {
    const safeNextLevel = Math.min(
      4,
      Math.max(1, Number(nextLevel) || 1)
    );

    localStorage.setItem(
      "mindcareLevel",
      String(safeNextLevel)
    );

    setLevel(safeNextLevel);

    return safeNextLevel;
  };

  /* =====================================================
     DEFAULT DIFFICULTY
     
     Used only if backend parameters are missing.
  ===================================================== */

  const getDefaultDifficulty = (currentLevel) => {
    const defaults = {
      1: {
        gridSize: 2,
        itemCount: 4,
        timeLimitSeconds: 90,
        distractorCount: 0,
      },

      2: {
        gridSize: 3,
        itemCount: 6,
        timeLimitSeconds: 75,
        distractorCount: 1,
      },

      3: {
        gridSize: 4,
        itemCount: 8,
        timeLimitSeconds: 60,
        distractorCount: 2,
      },

      4: {
        gridSize: 5,
        itemCount: 10,
        timeLimitSeconds: 45,
        distractorCount: 3,
      },
    };

    return defaults[currentLevel] || defaults[1];
  };

  /* =====================================================
     GENERATE RANDOM PATTERN
  ===================================================== */

  const generatePattern = (gridSize, itemCount) => {
    const totalCells = gridSize * gridSize;

    const safeItemCount = Math.min(
      totalCells,
      Math.max(1, itemCount)
    );

    const newPattern = Array(totalCells).fill(0);

    const positions = new Set();

    while (positions.size < safeItemCount) {
      const randomIndex = Math.floor(
        Math.random() * totalCells
      );

      positions.add(randomIndex);
    }

    positions.forEach((index) => {
      newPattern[index] = 1;
    });

    return newPattern;
  };

  /* =====================================================
     CALCULATE RESULTS
     
     Only highlighted cells selected correctly count
     as correct.

     Errors =
       wrong selections + missed highlighted cells
  ===================================================== */

  const calculatePatternResults = (answer) => {
    let correct = 0;
    let wrong = 0;
    let missed = 0;

    for (let i = 0; i < pattern.length; i++) {
      const correctCell = pattern[i] === 1;
      const selectedCell = answer[i] === 1;

      if (correctCell && selectedCell) {
        correct++;
      }

      if (!correctCell && selectedCell) {
        wrong++;
      }

      if (correctCell && !selectedCell) {
        missed++;
      }
    }

    const errors = wrong + missed;

    const totalRelevant = correct + errors;

    const calculatedAccuracy =
      totalRelevant > 0
        ? Math.round(
            (correct / totalRelevant) * 100
          )
        : 0;

    return {
      correct,
      wrong,
      missed,
      errors,
      accuracy: calculatedAccuracy,
    };
  };

  /* =====================================================
     START GAME
  ===================================================== */

  const startGame = async () => {
    setError("");
    setSaveStatus("");
    setLoading(true);

    const currentLevel = getSafeLevel();

    try {
      /* =================================================
         GET BACKEND DIFFICULTY
      ================================================= */

      const difficultyResponse =
        await getDifficulty(
          "pattern_recall",
          currentLevel
        );

      console.log(
        "Pattern Recall Difficulty:",
        difficultyResponse
      );

      const backendParameters =
        difficultyResponse?.parameters || {};

      const defaultParameters =
        getDefaultDifficulty(currentLevel);

      const rawGridSize =
        Number(
          backendParameters.gridSize
        ) || defaultParameters.gridSize;

      const rawItemCount =
        Number(
          backendParameters.itemCount
        ) || defaultParameters.itemCount;

      const safeGridSize = Math.min(
        5,
        Math.max(2, rawGridSize)
      );

      const totalCells =
        safeGridSize * safeGridSize;

      const safeItemCount = Math.min(
        totalCells,
        Math.max(1, rawItemCount)
      );

      const safeParameters = {
        ...defaultParameters,
        ...backendParameters,

        gridSize: safeGridSize,
        itemCount: safeItemCount,
      };

      setDifficulty(
        safeParameters
      );

      /* =================================================
         GENERATE RANDOM PATTERN
      ================================================= */

      const newPattern =
        generatePattern(
          safeGridSize,
          safeItemCount
        );

      setPattern(
        newPattern
      );

      setUserPattern(
        Array(totalCells).fill(0)
      );

      /* =================================================
         CREATE BACKEND SESSION
      ================================================= */

      const session =
        await createSession({
          gameType: "pattern_recall",
          level: currentLevel,
        });

      if (
        !session ||
        !session.sessionId
      ) {
        throw new Error(
          "Backend did not return a session ID."
        );
      }

      setSessionId(
        session.sessionId
      );

      /* =================================================
         RESET SCORE
      ================================================= */

      setScore(0);
      setAccuracy(0);
      setEarnedXP(0);
      setAttempts(0);
      setLevel(currentLevel);

      /* =================================================
         INSTRUCTIONS
      ================================================= */

      setScreen(
        "instructions"
      );

    } catch (err) {
      console.error(
        "Pattern Recall start error:",
        err
      );

      setError(
        getFriendlyError(
          err,
          "Unable to start the game. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     SHOW PATTERN
  ===================================================== */

  const showPattern = () => {
    setError("");

    if (!pattern.length) {
      setError(
        "Unable to generate the pattern. Please start again."
      );
      return;
    }

    setScreen("pattern");

    if (patternTimerRef.current) {
      clearTimeout(
        patternTimerRef.current
      );
    }

    patternTimerRef.current =
      setTimeout(() => {
        setScreen("recall");
      }, 3000);
  };

  /* =====================================================
     SELECT CELL
  ===================================================== */

  const selectCell = (index) => {
    if (screen !== "recall" || loading) {
      return;
    }

    setUserPattern((previous) => {
      const updated = [...previous];

      updated[index] =
        updated[index] === 0
          ? 1
          : 0;

      return updated;
    });
  };

  /* =====================================================
     SUBMIT PATTERN
  ===================================================== */

  const submitPattern = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSaveStatus(
      "Saving your performance..."
    );

    const currentLevel =
      getSafeLevel();

    const results =
      calculatePatternResults(
        userPattern
      );

    const {
      correct,
      errors,
      accuracy: calculatedAccuracy,
    } = results;

    const newAttempts =
      attempts + 1;

    const responseTimeSeconds = 3;

    /* =================================================
       UPDATE UI
    ================================================= */

    setScore(correct);
    setAccuracy(
      calculatedAccuracy
    );
    setAttempts(
      newAttempts
    );

    try {
      /* =================================================
         SESSION CHECK
      ================================================= */

      if (!sessionId) {
        throw new Error(
          "No active backend session was found."
        );
      }

      /* =================================================
         SAVE PERFORMANCE
      ================================================= */

      await savePerformance({
        sessionId,
        gameType: "pattern_recall",
        level: currentLevel,
        score: correct,
        accuracy: calculatedAccuracy,
        errors,
        responseTimeSeconds,
      });

      /* =================================================
         ADAPTIVE DIFFICULTY
      ================================================= */

      let nextLevel =
        currentLevel;

      try {
        const adaptiveResponse =
          await getNextLevel(
            "pattern_recall",
            currentLevel,
            calculatedAccuracy
          );

        console.log(
          "Adaptive Difficulty Response:",
          adaptiveResponse
        );

        if (
          adaptiveResponse &&
          adaptiveResponse.nextLevel !==
            undefined &&
          adaptiveResponse.nextLevel !==
            null
        ) {
          nextLevel = Math.min(
            4,
            Math.max(
              1,
              Number(
                adaptiveResponse.nextLevel
              )
            )
          );
        }

        saveAdaptiveLevel(
          nextLevel
        );

        if (
          nextLevel >
          currentLevel
        ) {
          setSaveStatus(
            `Performance saved. Difficulty increased to Level ${nextLevel}.`
          );
        } else if (
          nextLevel <
          currentLevel
        ) {
          setSaveStatus(
            `Performance saved. Difficulty adjusted to Level ${nextLevel}.`
          );
        } else {
          setSaveStatus(
            `Performance saved. You will continue at Level ${nextLevel}.`
          );
        }
      } catch (adaptiveError) {
        console.warn(
          "Adaptive difficulty unavailable:",
          adaptiveError
        );

        setSaveStatus(
          "Performance saved successfully."
        );
      }

      /* =================================================
         LOCAL PROGRESS
      ================================================= */

      const result =
        completeGame({
          gameName: "Pattern Recall",
          score: correct,
          accuracy: calculatedAccuracy,
          responseTime:
            responseTimeSeconds,
        });

      setEarnedXP(
        result.earnedXP
      );

      /* =================================================
         KEEP ADAPTIVE LEVEL
      ================================================= */

      const storedAdaptiveLevel =
        getSafeLevel();

      setLevel(
        storedAdaptiveLevel
      );

      /* =================================================
         SHOW RESULTS
      ================================================= */

      setScreen(
        "results"
      );
    } catch (err) {
      console.error(
        "Pattern Recall performance error:",
        err
      );

      setSaveStatus("");

      setError(
        getFriendlyError(
          err,
          "Your game finished, but the result could not be saved. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     PLAY AGAIN
  ===================================================== */

  const playAgain = () => {
    if (patternTimerRef.current) {
      clearTimeout(
        patternTimerRef.current
      );
    }

    setPattern([]);
    setUserPattern([]);

    setScore(0);
    setAccuracy(0);
    setEarnedXP(0);
    setAttempts(0);

    setError("");
    setSaveStatus("");
    setSessionId("");
    setDifficulty(null);

    setLevel(
      getSafeLevel()
    );

    setScreen(
      "start"
    );
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const goBack = () => {
    if (patternTimerRef.current) {
      clearTimeout(
        patternTimerRef.current
      );
    }

    navigate("/games");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  /* =====================================================
     STYLES
  ===================================================== */

  const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    background: `
      radial-gradient(
        circle at 75% 10%,
        rgba(104, 41, 205, 0.22),
        transparent 30%
      ),
      radial-gradient(
        circle at 20% 85%,
        rgba(56, 42, 155, 0.15),
        transparent 30%
      ),
      #070918
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "50px 20px",
    position: "relative",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const backButtonStyle = {
    position: "absolute",
    top: "22px",
    left: "30px",
    border:
      "1px solid rgba(150,160,195,0.20)",
    borderRadius: "8px",
    background:
      "rgba(255,255,255,0.04)",
    color: "#bfc4d5",
    padding: "9px 15px",
    fontSize: "11px",
    cursor: "pointer",
  };

  const boardStyle = {
    width: "520px",
    maxWidth: "95vw",
    minHeight: "580px",
    background:
      "linear-gradient(145deg, #15182f, #0d1022)",
    border:
      "1px solid rgba(140,92,230,0.28)",
    borderRadius: "18px",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.45)",
    padding: "35px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  };

  const titleStyle = {
    margin: 0,
    paddingBottom: "18px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    textAlign: "center",
    color: "#ffffff",
    fontSize: "23px",
    fontWeight: "600",
    letterSpacing: "1px",
  };

  const contentStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };

  const primaryButtonStyle = {
    width: "220px",
    height: "44px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #712ad0, #9345e2)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor:
      loading
        ? "not-allowed"
        : "pointer",
    opacity:
      loading
        ? 0.6
        : 1,
    boxShadow:
      "0 8px 20px rgba(122,42,210,0.25)",
  };

  const secondaryButtonStyle = {
    width: "220px",
    height: "42px",
    marginTop: "10px",
    border:
      "1px solid rgba(145,151,180,0.20)",
    borderRadius: "9px",
    background:
      "rgba(255,255,255,0.035)",
    color: "#aeb3c5",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  };

  const errorStyle = {
    width: "100%",
    maxWidth: "330px",
    boxSizing: "border-box",
    marginBottom: "18px",
    padding: "12px 14px",
    border:
      "1px solid rgba(255,90,120,0.28)",
    borderRadius: "9px",
    background:
      "rgba(255,70,100,0.08)",
    color: "#ff9dad",
    fontSize: "11px",
    lineHeight: "1.5",
  };

  const statusStyle = {
    marginTop: "12px",
    color: "#91e1c7",
    fontSize: "11px",
  };

  const levelBadgeStyle = {
    marginBottom: "18px",
    padding: "7px 13px",
    border:
      "1px solid rgba(163,91,255,0.25)",
    borderRadius: "20px",
    background:
      "rgba(126,48,215,0.10)",
    color: "#bd94ff",
    fontSize: "11px",
    fontWeight: "600",
  };

  const difficultyStyle = {
    marginBottom: "18px",
    padding: "10px 14px",
    border:
      "1px solid rgba(163,91,255,0.20)",
    borderRadius: "10px",
    background:
      "rgba(126,48,215,0.07)",
    color: "#aaa0c4",
    fontSize: "10px",
    lineHeight: "1.6",
  };

  /* =====================================================
     CURRENT GRID SIZE
  ===================================================== */

  const currentGridSize =
    Math.min(
      5,
      Math.max(
        2,
        Number(
          difficulty?.gridSize
        ) || 3
      )
    );

  const gridStyle = {
    width: "270px",
    height: "270px",
    display: "grid",
    gridTemplateColumns:
      `repeat(${currentGridSize}, 1fr)`,
    gridTemplateRows:
      `repeat(${currentGridSize}, 1fr)`,
    gap: "7px",
    padding: "7px",
    background: "#090c1e",
    border:
      "2px solid rgba(151,84,255,0.45)",
    borderRadius: "12px",
    boxSizing: "border-box",
    boxShadow:
      "0 0 30px rgba(119,48,214,0.16)",
  };

  /* =====================================================
     START SCREEN
  ===================================================== */

  if (screen === "start") {
    const previewPattern = [
      1, 0, 1,
      0, 1, 0,
      0, 1, 0,
    ];

    return (
      <div style={pageStyle}>
        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>

        <div style={boardStyle}>
          <h1 style={titleStyle}>
            PATTERN RECALL
          </h1>

          <div style={contentStyle}>
            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <div style={levelBadgeStyle}>
              CURRENT LEVEL{" "}
              {getSafeLevel()}
            </div>

            <div
              style={{
                width: "82px",
                height: "82px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "5px",
                padding: "6px",
                marginBottom: "25px",
                background: "#0a0d1e",
                border:
                  "1px solid rgba(153,81,255,0.25)",
                borderRadius: "12px",
              }}
            >
              {previewPattern.map(
                (cell, index) => (
                  <div
                    key={index}
                    style={{
                      background:
                        cell
                          ? "#9551ff"
                          : "#242844",
                      borderRadius: "3px",
                    }}
                  />
                )
              )}
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "19px",
                fontWeight: "500",
                color: "#ffffff",
              }}
            >
              Remember the pattern
            </h2>

            <p
              style={{
                maxWidth: "320px",
                margin: "0 0 25px",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "#9298ae",
              }}
            >
              A pattern will appear for
              3 seconds. Remember which
              squares are highlighted.
            </p>

            <button
              style={primaryButtonStyle}
              onClick={startGame}
              disabled={loading}
            >
              {loading
                ? "LOADING..."
                : "START"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     INSTRUCTIONS
  ===================================================== */

  if (screen === "instructions") {
    return (
      <div style={pageStyle}>
        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>

        <div style={boardStyle}>
          <h1 style={titleStyle}>
            PATTERN RECALL
          </h1>

          <div style={contentStyle}>
            <div style={levelBadgeStyle}>
              LEVEL {level}
            </div>

            {difficulty && (
              <div style={difficultyStyle}>
                <strong
                  style={{
                    color: "#c8a5ff",
                  }}
                >
                  Backend Difficulty
                </strong>

                <br />

                Grid:{" "}
                {difficulty.gridSize} ×{" "}
                {difficulty.gridSize}

                {" • "}

                Items:{" "}
                {difficulty.itemCount}

                {" • "}

                Time:{" "}
                {difficulty.timeLimitSeconds}s

                {" • "}

                Distractors:{" "}
                {difficulty.distractorCount ?? 0}
              </div>
            )}

            <div
              style={{
                width: "75px",
                height: "75px",
                borderRadius: "50%",
                background:
                  "rgba(132,59,215,0.14)",
                border:
                  "1px solid rgba(155,81,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                marginBottom: "22px",
              }}
            >
              ✦
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "19px",
                fontWeight: "500",
              }}
            >
              Get ready
            </h2>

            <p
              style={{
                maxWidth: "320px",
                margin: "0 0 25px",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "#9298ad",
              }}
            >
              Study the highlighted squares
              carefully. You will need to
              recreate exactly what you see.
            </p>

            <button
              style={primaryButtonStyle}
              onClick={showPattern}
            >
              GOT IT
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     SHOW PATTERN
  ===================================================== */

  if (screen === "pattern") {
    return (
      <div style={pageStyle}>
        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>

        <div style={boardStyle}>
          <h1 style={titleStyle}>
            ROUND 1
          </h1>

          <div style={contentStyle}>
            <div style={levelBadgeStyle}>
              LEVEL {level}
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "19px",
                fontWeight: "500",
              }}
            >
              LOOK CAREFULLY
            </h2>

            <p
              style={{
                margin: "0 0 22px",
                fontSize: "13px",
                color: "#9298ad",
              }}
            >
              Remember the highlighted
              squares.
            </p>

            <div style={gridStyle}>
              {pattern.map(
                (cell, index) => (
                  <div
                    key={index}
                    style={{
                      background:
                        cell
                          ? "linear-gradient(135deg, #a24cff, #7033d4)"
                          : "#242844",

                      border:
                        cell
                          ? "1px solid #c99aff"
                          : "1px solid #363b5b",

                      borderRadius: "6px",

                      boxShadow:
                        cell
                          ? "0 0 14px rgba(165,80,255,0.45)"
                          : "none",
                    }}
                  />
                )
              )}
            </div>

            <p
              style={{
                marginTop: "20px",
                fontSize: "11px",
                color: "#777f98",
              }}
            >
              Pattern will disappear
              in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RECALL
  ===================================================== */

  if (screen === "recall") {
    const liveResults =
      calculatePatternResults(
        userPattern
      );

    return (
      <div style={pageStyle}>
        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>

        <div style={boardStyle}>
          <h1 style={titleStyle}>
            ROUND 1
          </h1>

          <div style={contentStyle}>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "19px",
                fontWeight: "500",
              }}
            >
              Recreate the pattern
            </h2>

            <p
              style={{
                margin: "0 0 20px",
                fontSize: "13px",
                color: "#9399ae",
              }}
            >
              Select the squares that
              were highlighted.
            </p>

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <div style={gridStyle}>
              {userPattern.map(
                (cell, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      selectCell(index)
                    }
                    disabled={loading}
                    style={{
                      width: "100%",
                      height: "100%",
                      padding: 0,
                      margin: 0,

                      border:
                        cell
                          ? "2px solid #be88ff"
                          : "1px solid #363b5b",

                      borderRadius: "6px",

                      background:
                        cell
                          ? "linear-gradient(135deg, #9b45f4, #6f31c8)"
                          : "#242844",

                      cursor:
                        loading
                          ? "not-allowed"
                          : "pointer",

                      boxShadow:
                        cell
                          ? "0 0 17px rgba(155,69,244,0.55)"
                          : "none",

                      transition:
                        "all 0.15s ease",

                      boxSizing:
                        "border-box",

                      opacity:
                        loading
                          ? 0.7
                          : 1,
                    }}
                  />
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "9px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  padding: "8px 13px",
                  border:
                    "1px solid rgba(150,158,190,0.18)",
                  borderRadius: "7px",
                  background:
                    "rgba(255,255,255,0.035)",
                  color: "#c0c5d5",
                  fontSize: "11px",
                }}
              >
                Score: {liveResults.correct}
              </div>

              <div
                style={{
                  padding: "8px 13px",
                  border:
                    "1px solid rgba(150,158,190,0.18)",
                  borderRadius: "7px",
                  background:
                    "rgba(255,255,255,0.035)",
                  color: "#c0c5d5",
                  fontSize: "11px",
                }}
              >
                Accuracy:{" "}
                {liveResults.accuracy}%
              </div>
            </div>

            <button
              style={{
                ...primaryButtonStyle,
                marginTop: "18px",
              }}
              onClick={submitPattern}
              disabled={loading}
            >
              {loading
                ? "SAVING..."
                : "I REMEMBER"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RESULTS
  ===================================================== */

  if (screen === "results") {
    const itemCount =
      Number(
        difficulty?.itemCount
      ) ||
      pattern.filter(
        (cell) => cell === 1
      ).length;

    return (
      <div style={pageStyle}>
        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>

        <div style={boardStyle}>
          <h1 style={titleStyle}>
            RESULTS
          </h1>

          <div style={contentStyle}>
            <div
              style={{
                width: "65px",
                height: "65px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background:
                  "rgba(135,58,220,0.14)",
                border:
                  "1px solid rgba(154,82,255,0.26)",
                fontSize: "27px",
                marginBottom: "18px",
              }}
            >
              {accuracy >= 70
                ? "✓"
                : "↻"}
            </div>

            <h2
              style={{
                margin: "0 0 18px",
                fontSize: "20px",
                color: "#ffffff",
              }}
            >
              {accuracy === 100
                ? "EXCELLENT!"
                : accuracy >= 70
                ? "GREAT JOB!"
                : "GOOD TRY!"}
            </h2>

            <div
              style={{
                width: "250px",
                padding: "17px",
                marginBottom: "10px",
                background: "#171a31",
                border:
                  "1px solid rgba(137,143,176,0.18)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#858ba1",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                SCORE
              </p>

              <strong
                style={{
                  fontSize: "27px",
                  color: "#ffffff",
                }}
              >
                {score} / {itemCount}
              </strong>
            </div>

            <div
              style={{
                width: "250px",
                padding: "17px",
                marginBottom: "10px",
                background: "#171a31",
                border:
                  "1px solid rgba(137,143,176,0.18)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#858ba1",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                ACCURACY
              </p>

              <strong
                style={{
                  fontSize: "27px",
                  color: "#c48aff",
                }}
              >
                {accuracy}%
              </strong>
            </div>

            <div
              style={{
                width: "250px",
                padding: "17px",
                marginBottom: "10px",
                background: "#171a31",
                border:
                  "1px solid rgba(137,143,176,0.18)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#858ba1",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                XP EARNED
              </p>

              <strong
                style={{
                  fontSize: "27px",
                  color: "#72d8ff",
                }}
              >
                +{earnedXP} XP
              </strong>
            </div>

            <div
              style={{
                width: "250px",
                padding: "17px",
                marginBottom: "8px",
                background: "#171a31",
                border:
                  "1px solid rgba(137,143,176,0.18)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#858ba1",
                  fontSize: "9px",
                  letterSpacing: "1px",
                }}
              >
                NEXT LEVEL
              </p>

              <strong
                style={{
                  fontSize: "27px",
                  color: "#c48aff",
                }}
              >
                Level {level}
              </strong>
            </div>

            {difficulty && (
              <div
                style={{
                  width: "250px",
                  boxSizing: "border-box",
                  marginTop: "8px",
                  padding: "10px",
                  border:
                    "1px solid rgba(163,91,255,0.18)",
                  borderRadius: "9px",
                  background:
                    "rgba(126,48,215,0.06)",
                  color: "#aaa0c4",
                  fontSize: "10px",
                  lineHeight: "1.6",
                }}
              >
                Backend difficulty applied:
                {" "}
                {difficulty.gridSize}
                ×
                {difficulty.gridSize}
                {" • "}
                {difficulty.itemCount}
                {" items"}
              </div>
            )}

            <p
              style={{
                marginTop: "10px",
                marginBottom: "2px",
                color: "#bb9af0",
                fontSize: "11px",
              }}
            >
              Difficulty adjusted based on
              your performance.
            </p>

            <p style={statusStyle}>
              {saveStatus ||
                "Your game progress has been saved."}
            </p>

            <button
              style={primaryButtonStyle}
              onClick={goToDashboard}
            >
              VIEW DASHBOARD
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={playAgain}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PatternRecall;