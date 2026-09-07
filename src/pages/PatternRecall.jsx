import { useState } from "react";
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


  /* =====================================================
     GAME SCREENS
  ===================================================== */

  const [screen, setScreen] =
    useState("start");


  /* =====================================================
     FIXED PATTERN
  ===================================================== */

 const [pattern, setPattern] = useState([]);


  /* =====================================================
     PLAYER PATTERN
  ===================================================== */

  const [userPattern, setUserPattern] =
    useState(
      Array(
        (Number(difficulty?.gridSize) || 3) ** 2
      ).fill(0)
    );


  /* =====================================================
     SCORE
  ===================================================== */

  const [score, setScore] =
    useState(0);


  /* =====================================================
     ACCURACY
  ===================================================== */

  const [accuracy, setAccuracy] =
    useState(0);


  /* =====================================================
     ATTEMPTS
  ===================================================== */

  const [attempts, setAttempts] =
    useState(0);


  /* =====================================================
     XP
  ===================================================== */

  const [earnedXP, setEarnedXP] =
    useState(0);


  /* =====================================================
     LEVEL
  ===================================================== */

  const [level, setLevel] =
    useState(
      Number(
        localStorage.getItem(
          "mindcareLevel"
        )
      ) || 1
    );


  /* =====================================================
     DIFFICULTY
  ===================================================== */

  const [difficulty, setDifficulty] =
    useState(null);


  /* =====================================================
     BACKEND SESSION
  ===================================================== */

  const [sessionId, setSessionId] =
    useState("");


  /* =====================================================
     LOADING
  ===================================================== */

  const [loading, setLoading] =
    useState(false);


  /* =====================================================
     SAVE STATUS
  ===================================================== */

  const [saveStatus, setSaveStatus] =
    useState("");


  /* =====================================================
     ERROR
  ===================================================== */

  const [error, setError] =
    useState("");


  /* =====================================================
     FRIENDLY ERROR MESSAGE
     
     Prevent raw "Failed to fetch" from appearing.
  ===================================================== */

  const getFriendlyError = (
    err,
    fallback
  ) => {

    const message =
      String(
        err?.message || ""
      ).toLowerCase();


    if (
      message.includes(
        "failed to fetch"
      ) ||
      message.includes(
        "network"
      ) ||
      message.includes(
        "load failed"
      )
    ) {

      return (
        "Unable to connect to the training server. Please try again."
      );

    }


    if (
      message.includes(
        "401"
      ) ||
      message.includes(
        "unauthorized"
      ) ||
      message.includes(
        "authentication"
      ) ||
      message.includes(
        "token"
      )
    ) {

      return (
        "Your login session is no longer valid. Please login again."
      );

    }


    if (
      message.includes(
        "403"
      ) ||
      message.includes(
        "forbidden"
      )
    ) {

      return (
        "You do not have permission to continue. Please login again."
      );

    }


    return fallback;

  };


  /* =====================================================
     GET SAFE LEVEL
     Backend supports levels 1–4
  ===================================================== */

  const getSafeLevel = () => {

    const storedLevel =
      Number(
        localStorage.getItem(
          "mindcareLevel"
        )
      ) || 1;


    return Math.min(
      4,
      Math.max(
        1,
        storedLevel
      )
    );

  };


  /* =====================================================
     SAVE ADAPTIVE LEVEL
  ===================================================== */

  const saveAdaptiveLevel = (
    nextLevel
  ) => {

    const safeNextLevel =
      Math.min(
        4,
        Math.max(
          1,
          Number(
            nextLevel
          ) || 1
        )
      );


    localStorage.setItem(
      "mindcareLevel",
      String(
        safeNextLevel
      )
    );


    setLevel(
      safeNextLevel
    );


    return safeNextLevel;

  };


  /* =====================================================
     START GAME
  ===================================================== */

  const startGame =
    async () => {

      setError("");

      setSaveStatus("");

      setDifficulty(null);

      setLoading(true);


      const currentLevel =
        getSafeLevel();


      try {

        /* =================================================
           GET DIFFICULTY FROM BACKEND
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


        /*
         * Store only the parameters object.
         *
         * Example:
         *
         * {
         *   gridSize: 2,
         *   itemCount: 4,
         *   timeLimitSeconds: 90,
         *   distractorCount: 0
         * }
         */

        const parameters =
          difficultyResponse?.parameters ||
          null;


        setDifficulty(
          parameters
        );
const gridSize = Number(parameters?.gridSize) || 3;
const totalCells = gridSize * gridSize;

const itemCount = Math.min(
  totalCells,
  Number(parameters?.itemCount) || 4
);

const newPattern = Array(totalCells).fill(0);
const positions = [];

while (positions.length < itemCount) {
  const randomIndex = Math.floor(
    Math.random() * totalCells
  );

  if (!positions.includes(randomIndex)) {
    positions.push(randomIndex);
  }
}

positions.forEach((index) => {
  newPattern[index] = 1;
});

setPattern(newPattern);

        /* =================================================
           CREATE BACKEND SESSION
        ================================================= */

        const session =
          await createSession({

            gameType:
              "pattern_recall",

            level:
              currentLevel,

          });


        if (
          !session ||
          !session.sessionId
        ) {

          throw new Error(
            "Backend did not return a session ID."
          );

        }


        /* =================================================
           SAVE SESSION ID
        ================================================= */

        setSessionId(
          session.sessionId
        );


        /* =================================================
           RESET GAME STATE
        ================================================= */

        setUserPattern(
          Array(totalCells).fill(0)
        );


        setScore(0);

        setAccuracy(0);

        setEarnedXP(0);

        setAttempts(0);

        setLevel(
          currentLevel
        );


        /* =================================================
           MOVE TO INSTRUCTIONS
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

  const showPattern =
    () => {

      setError("");

      setScreen(
        "pattern"
      );


      /*
       * Use the backend time limit when available.
       * The API provides time in seconds.
       *
       * For now we keep the original 3-second
       * display as the minimum/default.
       */

      const backendTime =
        Number(
          difficulty?.timeLimitSeconds
        );


      /*
       * IMPORTANT:
       *
       * The backend timeLimitSeconds represents
       * the overall game time, not the display time.
       *
       * Therefore the pattern remains visible
       * for 5 seconds in this version.
       */

      const displayTime =
        3000;


      setTimeout(
        () => {

          setScreen(
            "recall"
          );

        },
        displayTime
      );

    };


  /* =====================================================
     SELECT CELL
  ===================================================== */

  const selectCell =
    (index) => {

      if (
        screen !==
        "recall"
      ) {

        return;

      }


      const updatedPattern =
        [
          ...userPattern
        ];


      updatedPattern[index] =
        updatedPattern[index] === 0
          ? 1
          : 0;


      setUserPattern(
        updatedPattern
      );

    };


  /* =====================================================
     SUBMIT PATTERN
  ===================================================== */

  const submitPattern =
    async () => {

      if (
        loading
      ) {

        return;

      }


      setLoading(
        true
      );

      setError("");

      setSaveStatus(
        "Saving your performance..."
      );


      /* =================================================
         CURRENT LEVEL
      ================================================= */

      const currentLevel =
        getSafeLevel();


      /* =================================================
         CALCULATE CORRECT CELLS
      ================================================= */

      let correctCells =
        0;


      for (
        let i = 0;
        i < pattern.length;
        i++
      ) {

        if (
          pattern[i] ===
          userPattern[i]
        ) {

          correctCells++;

        }

      }


      /* =================================================
         ACCURACY
      ================================================= */

      const calculatedAccuracy =
        Math.round(
          (
            correctCells /
            pattern.length
          ) * 100
        );


      /* =================================================
         ATTEMPTS
      ================================================= */

      const newAttempts =
        attempts + 1;


      /* =================================================
         ERRORS
      ================================================= */

      const errors =
        pattern.length -
        correctCells;


      /* =================================================
         RESPONSE TIME
      ================================================= */

      const responseTimeSeconds =
        3;


      /* =================================================
         UPDATE UI
      ================================================= */

      setScore(
        correctCells
      );


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

        if (
          !sessionId
        ) {

          throw new Error(
            "No active backend session was found."
          );

        }


        /* =================================================
           SAVE PERFORMANCE
        ================================================= */

        await savePerformance({

          sessionId:
            sessionId,

          gameType:
            "pattern_recall",

          level:
            currentLevel,

          score:
            correctCells,

          accuracy:
            calculatedAccuracy,

          errors:
            errors,

          responseTimeSeconds:
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

            nextLevel =
              Math.min(
                4,
                Math.max(
                  1,
                  Number(
                    adaptiveResponse.nextLevel
                  )
                )
              );

          }


          /* =================================================
             SAVE NEXT LEVEL
          ================================================= */

          saveAdaptiveLevel(
            nextLevel
          );


          /* =================================================
             ADAPTIVE MESSAGE
          ================================================= */

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


        } catch (
          adaptiveError
        ) {

          console.warn(
            "Adaptive difficulty unavailable:",
            adaptiveError
          );


          /*
           * The performance has already been
           * successfully saved.
           */

          setSaveStatus(
            "Performance saved successfully."
          );

        }


        /* =================================================
           LOCAL PROGRESS
        ================================================= */

        const result =
          completeGame({

            gameName:
              "Pattern Recall",

            score:
              correctCells,

            accuracy:
              calculatedAccuracy,

            responseTime:
              responseTimeSeconds,

          });


        /* =================================================
           XP
        ================================================= */

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

        setLoading(
          false
        );

      }

    };


  /* =====================================================
     PLAY AGAIN
  ===================================================== */

  const playAgain =
    () => {

      setUserPattern(
        Array(gridSize * gridSize).fill(0)
      );


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
     BACK
  ===================================================== */

  const goBack =
    () => {

      navigate(
        "/games"
      );

    };


  /* =====================================================
     DASHBOARD
  ===================================================== */

  const goToDashboard =
    () => {

      navigate(
        "/dashboard"
      );

    };


  /* =====================================================
     PAGE STYLE
  ===================================================== */

  const pageStyle = {

    minHeight:
      "100vh",

    width:
      "100%",

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

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "50px 20px",

    position:
      "relative",

    fontFamily:
      "Arial, Helvetica, sans-serif",

    color:
      "#ffffff",

    boxSizing:
      "border-box",

  };


  /* =====================================================
     BACK BUTTON
  ===================================================== */

  const backButtonStyle = {

    position:
      "absolute",

    top:
      "22px",

    left:
      "30px",

    border:
      "1px solid rgba(150,160,195,0.20)",

    borderRadius:
      "8px",

    background:
      "rgba(255,255,255,0.04)",

    color:
      "#bfc4d5",

    padding:
      "9px 15px",

    fontSize:
      "11px",

    cursor:
      "pointer",

  };


  /* =====================================================
     BOARD
  ===================================================== */

  const boardStyle = {

    width:
      "520px",

    maxWidth:
      "95vw",

    minHeight:
      "580px",

    background:
      "linear-gradient(145deg, #15182f, #0d1022)",

    border:
      "1px solid rgba(140,92,230,0.28)",

    borderRadius:
      "18px",

    boxShadow:
      "0 25px 70px rgba(0,0,0,0.45)",

    padding:
      "35px",

    display:
      "flex",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

  };


  /* =====================================================
     TITLE
  ===================================================== */

  const titleStyle = {

    margin:
      0,

    paddingBottom:
      "18px",

    borderBottom:
      "1px solid rgba(255,255,255,0.08)",

    textAlign:
      "center",

    color:
      "#ffffff",

    fontSize:
      "23px",

    fontWeight:
      "600",

    letterSpacing:
      "1px",

  };


  /* =====================================================
     CONTENT
  ===================================================== */

  const contentStyle = {

    flex:
      1,

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    textAlign:
      "center",

  };


  /* =====================================================
     PRIMARY BUTTON
  ===================================================== */

  const primaryButtonStyle = {

    width:
      "220px",

    height:
      "44px",

    border:
      "none",

    borderRadius:
      "9px",

    background:
      "linear-gradient(135deg, #712ad0, #9345e2)",

    color:
      "#ffffff",

    fontSize:
      "11px",

    fontWeight:
      "700",

    letterSpacing:
      "1px",

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


  /* =====================================================
     SECONDARY BUTTON
  ===================================================== */

  const secondaryButtonStyle = {

    width:
      "220px",

    height:
      "42px",

    marginTop:
      "10px",

    border:
      "1px solid rgba(145,151,180,0.20)",

    borderRadius:
      "9px",

    background:
      "rgba(255,255,255,0.035)",

    color:
      "#aeb3c5",

    fontSize:
      "11px",

    fontWeight:
      "600",

    cursor:
      "pointer",

  };


  /* =====================================================
     ERROR
  ===================================================== */

  const errorStyle = {

    width:
      "100%",

    maxWidth:
      "330px",

    boxSizing:
      "border-box",

    marginBottom:
      "18px",

    padding:
      "12px 14px",

    border:
      "1px solid rgba(255,90,120,0.28)",

    borderRadius:
      "9px",

    background:
      "rgba(255,70,100,0.08)",

    color:
      "#ff9dad",

    fontSize:
      "11px",

    lineHeight:
      "1.5",

  };


  /* =====================================================
     STATUS
  ===================================================== */

  const statusStyle = {

    marginTop:
      "12px",

    color:
      "#91e1c7",

    fontSize:
      "11px",

  };


  /* =====================================================
     LEVEL BADGE
  ===================================================== */

  const levelBadgeStyle = {

    marginBottom:
      "18px",

    padding:
      "7px 13px",

    border:
      "1px solid rgba(163,91,255,0.25)",

    borderRadius:
      "20px",

    background:
      "rgba(126,48,215,0.10)",

    color:
      "#bd94ff",

    fontSize:
      "11px",

    fontWeight:
      "600",

  };


  /* =====================================================
     DIFFICULTY DETAILS
  ===================================================== */

  const difficultyStyle = {

    marginBottom:
      "18px",

    padding:
      "10px 14px",

    border:
      "1px solid rgba(163,91,255,0.20)",

    borderRadius:
      "10px",

    background:
      "rgba(126,48,215,0.07)",

    color:
      "#aaa0c4",

    fontSize:
      "10px",

    lineHeight:
      "1.6",

  };


  /* =====================================================
     START SCREEN
  ===================================================== */

  if (
    screen === "start"
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={
            backButtonStyle
          }

          onClick={
            goBack
          }
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            PATTERN RECALL
          </h1>


          <div
            style={contentStyle}
          >


            {error && (

              <div
                style={errorStyle}
              >
                {error}
              </div>

            )}


            <div
              style={
                levelBadgeStyle
              }
            >

              CURRENT LEVEL{" "}
              {getSafeLevel()}

            </div>


            <div
              style={{

                width:
                  "82px",

                height:
                  "82px",

                display:
                  "grid",

                gridTemplateColumns:
                  `repeat(${gridSize}, 1fr)`,

                gap:
                  "5px",

                padding:
                  "6px",

                marginBottom:
                  "25px",

                background:
                  "#0a0d1e",

                border:
                  "1px solid rgba(153,81,255,0.25)",

                borderRadius:
                  "12px",

              }}
            >

              {pattern.map(
                (
                  cell,
                  index
                ) => (

                  <div
                    key={
                      index
                    }

                    style={{
                      background:
                        cell
                          ? "#9551ff"
                          : "#242844",

                      borderRadius:
                        "3px",

                    }}
                  />

                )
              )}

            </div>


            <h2
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff",

              }}
            >

              Remember the pattern

            </h2>


            <p
              style={{
                maxWidth:
                  "320px",

                margin:
                  "0 0 25px",

                fontSize:
                  "13px",

                lineHeight:
                  "1.7",

                color:
                  "#9298ae",

              }}
            >

              A pattern will appear for a few
              seconds. Remember which squares
              are highlighted.

            </p>


            <button
              style={
                primaryButtonStyle
              }

              onClick={
                startGame
              }

              disabled={
                loading
              }
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

  if (
    screen === "instructions"
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={
            backButtonStyle
          }

          onClick={
            goBack
          }
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            PATTERN RECALL
          </h1>


          <div
            style={contentStyle}
          >

            <div
              style={
                levelBadgeStyle
              }
            >

              LEVEL {level}

            </div>


            {difficulty && (

              <div
                style={difficultyStyle}
              >

                <strong
                  style={{
                    color:
                      "#c8a5ff",
                  }}
                >
                  Backend Difficulty
                </strong>

                <br />

                Grid:{" "}
                {difficulty.gridSize ||
                  "—"}
                {" × "}
                {difficulty.gridSize ||
                  "—"}

                {" • "}

                Items:{" "}
                {difficulty.itemCount ||
                  "—"}

                {" • "}

                Time:{" "}
                {difficulty.timeLimitSeconds ||
                  "—"}
                s

                {" • "}

                Distractors:{" "}
                {difficulty.distractorCount ??
                  0}

              </div>

            )}


            <div
              style={{
                width:
                  "75px",

                height:
                  "75px",

                borderRadius:
                  "50%",

                background:
                  "rgba(132,59,215,0.14)",

                border:
                  "1px solid rgba(155,81,255,0.25)",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontSize:
                  "30px",

                marginBottom:
                  "22px",

              }}
            >
              ✦
            </div>


            <h2
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff",

              }}
            >
              Get ready
            </h2>


            <p
              style={{
                maxWidth:
                  "320px",

                margin:
                  "0 0 25px",

                fontSize:
                  "13px",

                lineHeight:
                  "1.7",

                color:
                  "#9298ad",

              }}
            >

              Study the highlighted squares
              carefully. You will need to
              recreate exactly what you see.

            </p>


            <button
              style={
                primaryButtonStyle
              }

              onClick={
                showPattern
              }
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

  if (
    screen === "pattern"
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={
            backButtonStyle
          }

          onClick={
            goBack
          }
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            ROUND 1
          </h1>


          <div
            style={contentStyle}
          >

            <div
              style={
                levelBadgeStyle
              }
            >

              LEVEL {level}

            </div>


            <h2
              style={{
                margin:
                  "0 0 8px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff",

              }}
            >
              LOOK CAREFULLY
            </h2>


            <p
              style={{
                margin:
                  "0 0 22px",

                fontSize:
                  "13px",

                color:
                  "#9298ad",

              }}
            >
              Remember the highlighted squares.
            </p>


            <div
              style={{

                width:
                  "270px",

                height:
                  "270px",

                display:
                  "grid",

                gridTemplateColumns:
                  `repeat(${gridSize}, 1fr)`,

                gridTemplateRows:
                  `repeat(${gridSize}, 1fr)`,

                gap:
                  "7px",

                padding:
                  "7px",

                background:
                  "#090c1e",

                border:
                  "2px solid rgba(151,84,255,0.45)",

                borderRadius:
                  "12px",

                boxSizing:
                  "border-box",

                boxShadow:
                  "0 0 30px rgba(119,48,214,0.16)",

              }}
            >

              {pattern.map(
                (
                  cell,
                  index
                ) => (

                  <div
                    key={
                      index
                    }

                    style={{

                      background:
                        cell
                          ? "linear-gradient(135deg, #a24cff, #7033d4)"
                          : "#242844",

                      border:
                        cell
                          ? "1px solid #c99aff"
                          : "1px solid #363b5b",

                      borderRadius:
                        "6px",

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
                marginTop:
                  "20px",

                fontSize:
                  "11px",

                color:
                  "#777f98",

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
     RECALL SCREEN
  ===================================================== */

  if (
    screen === "recall"
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={
            backButtonStyle
          }

          onClick={
            goBack
          }
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            ROUND 1
          </h1>


          <div
            style={contentStyle}
          >

            <h2
              style={{
                margin:
                  "0 0 8px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff",

              }}
            >
              Recreate the pattern
            </h2>


            <p
              style={{
                margin:
                  "0 0 20px",

                fontSize:
                  "13px",

                color:
                  "#9399ae",

              }}
            >
              Select the squares that
              were highlighted.
            </p>


            {error && (

              <div
                style={errorStyle}
              >
                {error}
              </div>

            )}


            <div
              style={{
                width:
                  "270px",

                height:
                  "270px",

                display:
                  "grid",

                gridTemplateColumns:
                  `repeat(${gridSize}, 1fr)`,

                gridTemplateRows:
                  `repeat(${gridSize}, 1fr)`,

                gap:
                  "7px",

                padding:
                  "7px",

                background:
                  "#090c1e",

                border:
                  "2px solid rgba(151,84,255,0.45)",

                borderRadius:
                  "12px",

                boxSizing:
                  "border-box",

                boxShadow:
                  "0 0 30px rgba(119,48,214,0.16)",

              }}
            >

              {userPattern.map(
                (
                  cell,
                  index
                ) => (

                  <button
                    key={
                      index
                    }

                    type="button"

                    onClick={() =>
                      selectCell(
                        index
                      )
                    }

                    disabled={
                      loading
                    }

                    style={{

                      width:
                        "100%",

                      height:
                        "100%",

                      padding:
                        0,

                      margin:
                        0,

                      border:
                        cell
                          ? "2px solid #be88ff"
                          : "1px solid #363b5b",

                      borderRadius:
                        "6px",

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


            {/* LIVE SCORE */}

            <div
              style={{

                display:
                  "flex",

                gap:
                  "9px",

                marginTop:
                  "20px",

              }}
            >

              <div
                style={{
                  padding:
                    "8px 13px",

                  border:
                    "1px solid rgba(150,158,190,0.18)",

                  borderRadius:
                    "7px",

                  background:
                    "rgba(255,255,255,0.035)",

                  color:
                    "#c0c5d5",

                  fontSize:
                    "11px",

                }}
              >

                Score: {score}

              </div>


              <div
                style={{
                  padding:
                    "8px 13px",

                  border:
                    "1px solid rgba(150,158,190,0.18)",

                  borderRadius:
                    "7px",

                  background:
                    "rgba(255,255,255,0.035)",

                  color:
                    "#c0c5d5",

                  fontSize:
                    "11px",

                }}
              >

                Accuracy: {accuracy}%

              </div>

            </div>


            {/* SUBMIT */}

            <button
              style={{
                ...primaryButtonStyle,

                marginTop:
                  "18px",
              }}

              onClick={
                submitPattern
              }

              disabled={
                loading
              }
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

  if (
    screen === "results"
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={
            backButtonStyle
          }

          onClick={
            goBack
          }
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            RESULTS
          </h1>


          <div
            style={contentStyle}
          >

            {/* RESULT ICON */}

            <div
              style={{

                width:
                  "65px",

                height:
                  "65px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "50%",

                background:
                  "rgba(135,58,220,0.14)",

                border:
                  "1px solid rgba(154,82,255,0.26)",

                fontSize:
                  "27px",

                marginBottom:
                  "18px",

              }}
            >

              {accuracy >= 70
                ? "✓"
                : "↻"}

            </div>


            <h2
              style={{
                margin:
                  "0 0 18px",

                fontSize:
                  "20px",

                color:
                  "#ffffff",

              }}
            >

              {accuracy === 100

                ? "EXCELLENT!"

                : accuracy >= 70

                ? "GREAT JOB!"

                : "GOOD TRY!"}

            </h2>


            {/* SCORE */}

            <div
              style={{

                width:
                  "250px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px",

              }}
            >

              <p
                style={{
                  margin:
                    "0 0 6px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px",

                }}
              >
                SCORE
              </p>


              <strong
                style={{
                  fontSize:
                    "27px",

                  color:
                    "#ffffff",

                }}
              >

                {score} / {pattern.length}

              </strong>

            </div>


            {/* ACCURACY */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px",

              }}
            >

              <p
                style={{
                  margin:
                    "0 0 6px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px",

                }}
              >
                ACCURACY
              </p>


              <strong
                style={{
                  fontSize:
                    "27px",

                  color:
                    "#c48aff",

                }}
              >

                {accuracy}%

              </strong>

            </div>


            {/* XP */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px",

              }}
            >

              <p
                style={{
                  margin:
                    "0 0 6px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px",

                }}
              >
                XP EARNED
              </p>


              <strong
                style={{
                  fontSize:
                    "27px",

                  color:
                    "#72d8ff",

                }}
              >

                +{earnedXP} XP

              </strong>

            </div>


            {/* NEXT LEVEL */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "17px",

                marginBottom:
                  "8px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px",

              }}
            >

              <p
                style={{
                  margin:
                    "0 0 6px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px",

                }}
              >
                NEXT LEVEL
              </p>


              <strong
                style={{
                  fontSize:
                    "27px",

                  color:
                    "#c48aff",

                }}
              >

                Level {level}

              </strong>

            </div>


            {/* DIFFICULTY DETAILS */}

            {difficulty && (

              <div
                style={{
                  width:
                    "250px",

                  boxSizing:
                    "border-box",

                  marginTop:
                    "8px",

                  padding:
                    "10px",

                  border:
                    "1px solid rgba(163,91,255,0.18)",

                  borderRadius:
                    "9px",

                  background:
                    "rgba(126,48,215,0.06)",

                  color:
                    "#aaa0c4",

                  fontSize:
                    "10px",

                  lineHeight:
                    "1.6",

                }}
              >

                Backend difficulty applied:
                {" "}
                {difficulty.gridSize || "—"}
                ×
                {difficulty.gridSize || "—"}
                {" • "}
                {difficulty.itemCount || "—"}
                {" items"}

              </div>

            )}


            {/* ADAPTIVE MESSAGE */}

            <p
              style={{
                marginTop:
                  "10px",

                marginBottom:
                  "2px",

                color:
                  "#bb9af0",

                fontSize:
                  "11px",

              }}
            >

              Difficulty adjusted based on
              your performance.

            </p>


            {/* SAVE STATUS */}

            <p
              style={statusStyle}
            >

              {saveStatus ||
                "Your game progress has been saved."}

            </p>


            {/* DASHBOARD */}

            <button
              style={
                primaryButtonStyle
              }

              onClick={
                goToDashboard
              }
            >
              VIEW DASHBOARD
            </button>


            {/* PLAY AGAIN */}

            <button
              style={
                secondaryButtonStyle
              }

              onClick={
                playAgain
              }
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