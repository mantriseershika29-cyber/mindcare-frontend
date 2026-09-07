import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { completeGame } from "../utils/gameProgress";

import {
  createSession,
  savePerformance,
  getDifficulty,
  getNextLevel
} from "../utils/api";


const SYMBOLS = [
  "★",
  "◆",
  "●",
  "▲",
  "♥",
  "✚",
  "☀",
  "⬟"
];


const TOTAL_ROUNDS = 3;


function ObjectPlacement() {

  const navigate = useNavigate();


  /* =====================================================
     GAME SCREEN
  ===================================================== */

  const [screen, setScreen] =
    useState("start");


  /* =====================================================
     ROUND
  ===================================================== */

  const [round, setRound] =
    useState(1);


  /* =====================================================
     SYMBOL
  ===================================================== */

  const [symbol, setSymbol] =
    useState("");


  /* =====================================================
     CORRECT POSITION
  ===================================================== */

  const [correctPosition, setCorrectPosition] =
    useState(0);


  /* =====================================================
     SCORE
  ===================================================== */

  const [score, setScore] =
    useState(0);


  /* =====================================================
     SELECTED POSITION
  ===================================================== */

  const [selectedPosition, setSelectedPosition] =
    useState(null);


  /* =====================================================
     CURRENT ROUND RESULT
  ===================================================== */

  const [isCorrect, setIsCorrect] =
    useState(false);


  /* =====================================================
     FINAL ACCURACY
  ===================================================== */

  const [finalAccuracy, setFinalAccuracy] =
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
     ERROR
  ===================================================== */

  const [error, setError] =
    useState("");


  /* =====================================================
     SAVE STATUS
  ===================================================== */

  const [saveStatus, setSaveStatus] =
    useState("");


  /* =====================================================
     GAME START TIME
  ===================================================== */

  const [gameStartTime, setGameStartTime] =
    useState(null);


  /* =====================================================
     DIFFICULTY PARAMETERS
  ===================================================== */

  const [difficulty, setDifficulty] =
    useState(null);


  /* =====================================================
     NEXT ADAPTIVE LEVEL
  ===================================================== */

  const [nextLevel, setNextLevel] =
    useState(null);


  /* =====================================================
     GET SAFE LEVEL
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
     GET GRID SIZE
     
     Backend controls gridSize.
     Default is 4x4.
  ===================================================== */

  const getGridSize = () => {

    const backendGridSize =
      Number(
        difficulty?.gridSize
      );


    if (
      Number.isFinite(
        backendGridSize
      ) &&
      backendGridSize >= 2 &&
      backendGridSize <= 6
    ) {

      return backendGridSize;

    }


    return 4;

  };


  /* =====================================================
     CREATE ROUND
  ===================================================== */

  const createRound = () => {

    const randomSymbol =
      SYMBOLS[
        Math.floor(
          Math.random() *
          SYMBOLS.length
        )
      ];


    const gridSize =
      getGridSize();


    const totalCells =
      gridSize *
      gridSize;


    const randomPosition =
      Math.floor(
        Math.random() *
        totalCells
      );


    setSymbol(
      randomSymbol
    );


    setCorrectPosition(
      randomPosition
    );


    setSelectedPosition(
      null
    );


    setIsCorrect(
      false
    );


    setScreen(
      "memorize"
    );

  };


  /* =====================================================
     START GAME
     ===================================================== */

  const startGame = async () => {

    setError("");

    setSaveStatus("");

    setNextLevel(null);

    setDifficulty(null);

    setLoading(true);


    const currentLevel =
      getSafeLevel();


    try {

      /* ===============================================
         GET DIFFICULTY FROM BACKEND
      =============================================== */

      const difficultyResponse =
        await getDifficulty(
          "object_placement",
          currentLevel
        );


      console.log(
        "Object Placement Difficulty:",
        difficultyResponse
      );


      const difficultyParameters =
        difficultyResponse?.parameters || null;


      setDifficulty(
        difficultyParameters
      );


      /* ===============================================
         CREATE BACKEND SESSION
      =============================================== */

      const session =
        await createSession({

          gameType:
            "object_placement",

          level:
            currentLevel

        });


      /* ===============================================
         CHECK SESSION
      =============================================== */

      if (
        !session ||
        !session.sessionId
      ) {

        throw new Error(
          "Backend did not return a session ID."
        );

      }


      /* ===============================================
         SAVE SESSION ID
      =============================================== */

      setSessionId(
        session.sessionId
      );


      /* ===============================================
         RESET GAME STATE
      =============================================== */

      setRound(
        1
      );


      setScore(
        0
      );


      setFinalAccuracy(
        0
      );


      setEarnedXP(
        0
      );


      setLevel(
        currentLevel
      );


      setSelectedPosition(
        null
      );


      setIsCorrect(
        false
      );


      setSaveStatus(
        ""
      );


      /* ===============================================
         START TIMER
      =============================================== */

      setGameStartTime(
        performance.now()
      );


      /* ===============================================
         CREATE FIRST ROUND
      =============================================== */

      createRound();


    } catch (err) {

      console.error(
        "Object Placement start failed:",
        err
      );


      setError(
        "Unable to start the game. Please make sure you are logged in and try again."
      );


    } finally {

      setLoading(
        false
      );

    }

  };


  /* =====================================================
     MEMORY TIMER
     
     Existing faster-round behavior is preserved.
     Backend timeLimitSeconds is displayed separately.
  ===================================================== */

  useEffect(() => {

    if (
      screen !== "memorize"
    ) {

      return;

    }


    let displayTime =
      3000;


    if (
      round === 2
    ) {

      displayTime =
        2500;

    }


    if (
      round === 3
    ) {

      displayTime =
        2000;

    }


    const timer =
      setTimeout(
        () => {

          setScreen(
            "choose"
          );

        },
        displayTime
      );


    return () =>
      clearTimeout(
        timer
      );

  }, [
    screen,
    round
  ]);


  /* =====================================================
     SELECT POSITION
  ===================================================== */

  const handlePositionClick = (
    position
  ) => {

    if (
      screen !== "choose" ||
      loading
    ) {

      return;

    }


    const correct =
      position ===
      correctPosition;


    setSelectedPosition(
      position
    );


    setIsCorrect(
      correct
    );


    /*
     * React state updates are asynchronous,
     * so the final score is calculated explicitly
     * later in nextRound().
     */

    if (
      correct
    ) {

      setScore(
        previousScore =>
          previousScore + 1
      );

    }


    setScreen(
      "result"
    );

  };


  /* =====================================================
     SAVE FINAL PERFORMANCE
  ===================================================== */

  const saveObjectPlacementPerformance =
    async ({
      finalScore,
      calculatedAccuracy,
      responseTimeSeconds,
      finalErrors,
      finalLevel
    }) => {

      setLoading(
        true
      );


      setSaveStatus(
        "Saving your performance..."
      );


      try {

        /* =============================================
           CHECK SESSION
        ============================================= */

        if (
          !sessionId
        ) {

          throw new Error(
            "No active session was found."
          );

        }


        /* =============================================
           SAVE PERFORMANCE
        ============================================= */

        await savePerformance({

          sessionId:
            sessionId,

          gameType:
            "object_placement",

          level:
            finalLevel,

          score:
            finalScore,

          accuracy:
            calculatedAccuracy,

          errors:
            finalErrors,

          responseTimeSeconds:
            responseTimeSeconds

        });


        /* =============================================
           KEEP LOCAL XP / PROGRESS
        ============================================= */

        const result =
          completeGame({

            gameName:
              "Object Placement",

            score:
              finalScore,

            accuracy:
              calculatedAccuracy,

            responseTime:
              responseTimeSeconds

          });


        /* =============================================
           UPDATE XP
        ============================================= */

        setEarnedXP(
          result.earnedXP
        );


        /* =============================================
           ADAPTIVE DIFFICULTY
        ============================================= */

        try {

          const adaptiveResponse =
            await getNextLevel(
              "object_placement",
              finalLevel,
              calculatedAccuracy
            );


          console.log(
            "Object Placement Adaptive Response:",
            adaptiveResponse
          );


          const calculatedNextLevel =
            Math.min(
              4,
              Math.max(
                1,
                Number(
                  adaptiveResponse?.nextLevel
                ) || finalLevel
              )
            );


          setNextLevel(
            calculatedNextLevel
          );


          /* =========================================
             SAVE ADAPTIVE LEVEL
          ========================================= */

          localStorage.setItem(
            "mindcareLevel",
            String(
              calculatedNextLevel
            )
          );


          setLevel(
            calculatedNextLevel
          );


        } catch (adaptiveError) {

          console.error(
            "Object Placement adaptive difficulty failed:",
            adaptiveError
          );


          /*
           * Keep current level if adaptive API
           * is temporarily unavailable.
           */

          setNextLevel(
            finalLevel
          );


          localStorage.setItem(
            "mindcareLevel",
            String(
              finalLevel
            )
          );


          setLevel(
            finalLevel
          );

        }


        /* =============================================
           SAVE SUCCESS
        ============================================= */

        setSaveStatus(
          "Performance saved successfully."
        );


        setScreen(
          "final"
        );


      } catch (err) {

        console.error(
          "Object Placement performance save failed:",
          err
        );


        setSaveStatus(
          ""
        );


        setError(
          "Your game finished, but the performance could not be saved. Please try again."
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  /* =====================================================
     NEXT ROUND
  ===================================================== */

  const nextRound = () => {

    if (
      round < TOTAL_ROUNDS
    ) {

      const next =
        round + 1;


      setRound(
        next
      );


      createRound();


      return;

    }


    /* =================================================
       FINAL SCORE
    ================================================= */

    /*
     * The score state contains rounds 1 and 2.
     *
     * isCorrect contains the result of round 3.
     *
     * Therefore calculate the final score explicitly.
     */

    const finalScore =
      score +
      (
        isCorrect
          ? 1
          : 0
      );


    /* =================================================
       FINAL ACCURACY
    ================================================= */

    const calculatedAccuracy =
      Math.round(
        (
          finalScore /
          TOTAL_ROUNDS
        ) * 100
      );


    setFinalAccuracy(
      calculatedAccuracy
    );


    /* =================================================
       FINAL ERRORS
    ================================================= */

    const finalErrors =
      TOTAL_ROUNDS -
      finalScore;


    /* =================================================
       RESPONSE TIME
    ================================================= */

    const responseTimeSeconds =
      gameStartTime
        ? Number(
            (
              (
                performance.now() -
                gameStartTime
              ) / 1000
            ).toFixed(1)
          )
        : 0;


    /* =================================================
       SAVE PERFORMANCE
    ================================================= */

    saveObjectPlacementPerformance({

      finalScore:
        finalScore,

      calculatedAccuracy:
        calculatedAccuracy,

      responseTimeSeconds:
        responseTimeSeconds,

      finalErrors:
        finalErrors,

      finalLevel:
        getSafeLevel()

    });

  };


  /* =====================================================
     PLAY AGAIN
  ===================================================== */

  const playAgain = () => {

    setRound(
      1
    );


    setScore(
      0
    );


    setFinalAccuracy(
      0
    );


    setEarnedXP(
      0
    );


    setSelectedPosition(
      null
    );


    setIsCorrect(
      false
    );


    setSessionId(
      ""
    );


    setError(
      ""
    );


    setSaveStatus(
      ""
    );


    setGameStartTime(
      null
    );


    setDifficulty(
      null
    );


    setNextLevel(
      null
    );


    setSymbol(
      ""
    );


    setCorrectPosition(
      0
    );


    setScreen(
      "start"
    );

  };


  /* =====================================================
     BACK
  ===================================================== */

  const goBack = () => {

    navigate(
      "/games"
    );

  };


  /* =====================================================
     DASHBOARD
  ===================================================== */

  const goToDashboard = () => {

    navigate(
      "/dashboard"
    );

  };


  /* =====================================================
     GRID SIZE
  ===================================================== */

  const gridSize =
    getGridSize();


  const totalCells =
    gridSize *
    gridSize;


  /* =====================================================
     PAGE STYLE
  ===================================================== */

  const pageStyle = {

    minHeight:
      "100vh",

    width:
      "100%",

    position:
      "relative",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "50px 20px",

    boxSizing:
      "border-box",

    fontFamily:
      "Arial, Helvetica, sans-serif",

    color:
      "#ffffff",

    background:
      `
      radial-gradient(
        circle at 80% 8%,
        rgba(114, 47, 220, 0.23),
        transparent 28%
      ),
      radial-gradient(
        circle at 15% 85%,
        rgba(63, 48, 166, 0.16),
        transparent 30%
      ),
      #070918
      `
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

    padding:
      "9px 15px",

    border:
      "1px solid rgba(150,160,195,0.20)",

    borderRadius:
      "8px",

    background:
      "rgba(255,255,255,0.04)",

    color:
      "#bfc4d5",

    fontSize:
      "11px",

    cursor:
      "pointer"

  };


  /* =====================================================
     BOARD
  ===================================================== */

  const boardStyle = {

    width:
      "560px",

    maxWidth:
      "95vw",

    minHeight:
      "620px",

    padding:
      "35px",

    display:
      "flex",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

    background:
      "linear-gradient(145deg, #15182f, #0d1022)",

    border:
      "1px solid rgba(140,92,230,0.28)",

    borderRadius:
      "18px",

    boxShadow:
      "0 25px 70px rgba(0,0,0,0.45)"

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
      "1px"

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
      "center"

  };


  /* =====================================================
     PRIMARY BUTTON
  ===================================================== */

  const primaryButtonStyle = {

    width:
      "220px",

    height:
      "44px",

    marginTop:
      "10px",

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
      "0 8px 20px rgba(122,42,210,0.25)"

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
      "pointer"

  };


  /* =====================================================
     DIFFICULTY CARD
  ===================================================== */

  const difficultyCard = difficulty && (

    <div
      style={{
        width:
          "100%",

        maxWidth:
          "360px",

        marginBottom:
          "18px",

        padding:
          "12px 14px",

        border:
          "1px solid rgba(140,92,230,0.20)",

        borderRadius:
          "9px",

        background:
          "rgba(113,46,217,0.07)",

        color:
          "#aeb4c8",

        fontSize:
          "10px",

        lineHeight:
          "1.7",

        boxSizing:
          "border-box"
      }}
    >

      <div
        style={{
          color:
            "#c28cff",

          fontWeight:
            "700",

          marginBottom:
            "4px",

          letterSpacing:
            "0.5px"
        }}
      >
        BACKEND DIFFICULTY
      </div>


      <div>
        Grid Size:{" "}

        <strong
          style={{
            color:
              "#ffffff"
          }}
        >
          {gridSize} × {gridSize}
        </strong>
      </div>


      {difficulty.itemCount !== undefined && (

        <div>
          Item Count:{" "}

          <strong
            style={{
              color:
                "#ffffff"
            }}
          >
            {difficulty.itemCount}
          </strong>
        </div>

      )}


      {difficulty.timeLimitSeconds !== undefined && (

        <div>
          Time Limit:{" "}

          <strong
            style={{
              color:
                "#ffffff"
            }}
          >
            {difficulty.timeLimitSeconds}s
          </strong>
        </div>

      )}


      {difficulty.distractorCount !== undefined && (

        <div>
          Distractors:{" "}

          <strong
            style={{
              color:
                "#ffffff"
            }}
          >
            {difficulty.distractorCount}
          </strong>
        </div>

      )}

    </div>

  );


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
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            OBJECT PLACEMENT
          </h1>


          <div
            style={contentStyle}
          >

            <div
              style={{
                width:
                  "82px",

                height:
                  "82px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(137,64,222,0.13)",

                border:
                  "1px solid rgba(156,86,255,0.26)",

                color:
                  "#c18aff",

                fontSize:
                  "32px",

                marginBottom:
                  "22px"
              }}
            >
              ◆
            </div>


            <h2
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "20px",

                fontWeight:
                  "500",

                color:
                  "#ffffff"
              }}
            >
              Remember the position
            </h2>


            <p
              style={{
                maxWidth:
                  "340px",

                margin:
                  "0 0 12px",

                fontSize:
                  "13px",

                lineHeight:
                  "1.7",

                color:
                  "#9298ae"
              }}
            >
              A symbol will appear inside the grid.
              Remember exactly where it is and select
              the same position when the grid disappears.
            </p>


            <p
              style={{
                margin:
                  "0 0 20px",

                fontSize:
                  "11px",

                color:
                  "#747c95"
              }}
            >
              3 rounds • Faster each round
            </p>


            <p
              style={{
                margin:
                  "0 0 5px",

                fontSize:
                  "11px",

                color:
                  "#777f96"
              }}
            >
              Current Level
            </p>


            <strong
              style={{
                marginBottom:
                  "15px",

                fontSize:
                  "21px",

                color:
                  "#c18aff"
              }}
            >
              {level}
            </strong>


            {error && (

              <div
                style={{
                  marginBottom:
                    "14px",

                  padding:
                    "10px 14px",

                  maxWidth:
                    "340px",

                  border:
                    "1px solid rgba(255,92,109,0.22)",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(255,72,92,0.07)",

                  color:
                    "#ff9ba7",

                  fontSize:
                    "10px",

                  lineHeight:
                    "1.5"
                }}
              >
                ⚠ {error}
              </div>

            )}


            <button
              style={primaryButtonStyle}
              onClick={startGame}
              disabled={loading}
            >
              {loading
                ? "LOADING DIFFICULTY..."
                : "START"}
            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     MEMORY SCREEN
  ===================================================== */

  if (
    screen === "memorize"
  ) {

    return (

      <div style={pageStyle}>

        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>


        <div style={boardStyle}>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              paddingBottom:
                "18px",

              borderBottom:
                "1px solid rgba(255,255,255,0.08)"
            }}
          >

            <h1
              style={{
                ...titleStyle,

                borderBottom:
                  "none",

                paddingBottom:
                  0,

                textAlign:
                  "left"
              }}
            >
              OBJECT PLACEMENT
            </h1>


            <span
              style={{
                fontSize:
                  "10px",

                color:
                  "#888fa5",

                whiteSpace:
                  "nowrap"
              }}
            >
              ROUND {round} / {TOTAL_ROUNDS}
            </span>

          </div>


          <div style={contentStyle}>

            <h2
              style={{
                margin:
                  "0 0 8px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff"
              }}
            >
              REMEMBER THIS
            </h2>


            <p
              style={{
                margin:
                  "0 0 20px",

                color:
                  "#9399ad",

                fontSize:
                  "13px"
              }}
            >
              Remember the symbol and its exact position.
            </p>


            {difficultyCard}


            {/* =================================================
                DYNAMIC MEMORY GRID
            ================================================= */}

            <div
              style={{
                width:
                  gridSize <= 3
                    ? "300px"
                    : "360px",

                height:
                  gridSize <= 3
                    ? "300px"
                    : "360px",

                padding:
                  "6px",

                display:
                  "grid",

                gridTemplateColumns:
                  `repeat(${gridSize}, 1fr)`,

                gridTemplateRows:
                  `repeat(${gridSize}, 1fr)`,

                gap:
                  "6px",

                background:
                  "#080b1c",

                border:
                  "2px solid rgba(147,82,241,0.42)",

                borderRadius:
                  "12px",

                boxSizing:
                  "border-box",

                boxShadow:
                  "0 0 30px rgba(121,48,224,0.16)"
              }}
            >

              {Array.from({
                length:
                  totalCells
              }).map(
                (_, index) => (

                  <div
                    key={index}
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      border:
                        "1px solid rgba(112,120,151,0.32)",

                      borderRadius:
                        "5px",

                      background:
                        index === correctPosition
                          ? "linear-gradient(135deg, #8f42e7, #652cb8)"
                          : "#20253e",

                      boxShadow:
                        index === correctPosition
                          ? "0 0 18px rgba(158,74,244,0.55)"
                          : "none"
                    }}
                  >

                    {index ===
                      correctPosition && (

                      <span
                        style={{
                          fontSize:
                            gridSize >= 5
                              ? "38px"
                              : "56px",

                          color:
                            "#ffffff",

                          lineHeight:
                            1,

                          fontWeight:
                            "bold",

                          textShadow:
                            "0 0 12px rgba(255,255,255,0.22)"
                        }}
                      >
                        {symbol}
                      </span>

                    )}

                  </div>

                )
              )}

            </div>


            <p
              style={{
                marginTop:
                  "18px",

                color:
                  "#767e95",

                fontSize:
                  "10px"
              }}
            >
              Memorize carefully...
            </p>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     CHOOSE POSITION SCREEN
  ===================================================== */

  if (
    screen === "choose"
  ) {

    return (

      <div style={pageStyle}>

        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>


        <div style={boardStyle}>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              paddingBottom:
                "18px",

              borderBottom:
                "1px solid rgba(255,255,255,0.08)"
            }}
          >

            <h1
              style={{
                ...titleStyle,

                borderBottom:
                  "none",

                paddingBottom:
                  0,

                textAlign:
                  "left"
              }}
            >
              OBJECT PLACEMENT
            </h1>


            <span
              style={{
                fontSize:
                  "10px",

                color:
                  "#888fa5"
              }}
            >
              ROUND {round} / {TOTAL_ROUNDS}
            </span>

          </div>


          <div style={contentStyle}>

            <h2
              style={{
                margin:
                  "0 0 8px",

                fontSize:
                  "19px",

                fontWeight:
                  "500",

                color:
                  "#ffffff"
              }}
            >
              WHERE WAS IT?
            </h2>


            <p
              style={{
                margin:
                  "0 0 20px",

                color:
                  "#9298ad",

                fontSize:
                  "13px"
              }}
            >
              Select the exact square where
              the symbol appeared.
            </p>


            {/* =================================================
                LIVE SCORE
            ================================================= */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  "9px",

                marginBottom:
                  "18px"
              }}
            >

              <span
                style={{
                  padding:
                    "7px 12px",

                  border:
                    "1px solid rgba(148,156,188,0.18)",

                  borderRadius:
                    "7px",

                  background:
                    "rgba(255,255,255,0.035)",

                  color:
                    "#c1c5d4",

                  fontSize:
                    "10px"
                }}
              >
                Score: {score}
              </span>


              <span
                style={{
                  padding:
                    "7px 12px",

                  border:
                    "1px solid rgba(148,156,188,0.18)",

                  borderRadius:
                    "7px",

                  background:
                    "rgba(255,255,255,0.035)",

                  color:
                    "#c1c5d4",

                  fontSize:
                    "10px"
                }}
              >
                Round: {round}
              </span>

            </div>


            {/* =================================================
                DYNAMIC CLICKABLE GRID
            ================================================= */}

            <div
              style={{
                width:
                  gridSize <= 3
                    ? "300px"
                    : "360px",

                height:
                  gridSize <= 3
                    ? "300px"
                    : "360px",

                padding:
                  "6px",

                display:
                  "grid",

                gridTemplateColumns:
                  `repeat(${gridSize}, 1fr)`,

                gridTemplateRows:
                  `repeat(${gridSize}, 1fr)`,

                gap:
                  "6px",

                background:
                  "#080b1c",

                border:
                  "2px solid rgba(147,82,241,0.42)",

                borderRadius:
                  "12px",

                boxSizing:
                  "border-box",

                boxShadow:
                  "0 0 30px rgba(121,48,224,0.16)"
              }}
            >

              {Array.from({
                length:
                  totalCells
              }).map(
                (_, index) => (

                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      handlePositionClick(
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

                      border:
                        selectedPosition ===
                        index
                          ? "2px solid #bd86ff"
                          : "1px solid rgba(112,120,151,0.32)",

                      borderRadius:
                        "5px",

                      background:
                        selectedPosition ===
                        index
                          ? "rgba(133,61,220,0.30)"
                          : "#20253e",

                      cursor:
                        loading
                          ? "not-allowed"
                          : "pointer",

                      opacity:
                        loading
                          ? 0.65
                          : 1,

                      boxSizing:
                        "border-box",

                      transition:
                        "all 0.15s ease"
                    }}

                    onMouseEnter={(e) => {

                      if (
                        !loading
                      ) {

                        e.currentTarget.style.background =
                          "#4a2c76";

                      }

                    }}

                    onMouseLeave={(e) => {

                      if (
                        selectedPosition !==
                        index
                      ) {

                        e.currentTarget.style.background =
                          "#20253e";

                      }

                    }}
                  />

                )
              )}

            </div>


            <p
              style={{
                marginTop:
                  "18px",

                color:
                  "#767e95",

                fontSize:
                  "10px"
              }}
            >
              Choose one position
            </p>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     ROUND RESULT
  ===================================================== */

  if (
    screen === "result"
  ) {

    return (

      <div style={pageStyle}>

        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>


        <div style={boardStyle}>

          <h1
            style={titleStyle}
          >
            ROUND {round} RESULT
          </h1>


          <div
            style={contentStyle}
          >

            <div
              style={{
                width:
                  "75px",

                height:
                  "75px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "50%",

                background:
                  isCorrect
                    ? "rgba(29,178,123,0.13)"
                    : "rgba(213,91,109,0.11)",

                border:
                  isCorrect
                    ? "1px solid rgba(65,218,163,0.27)"
                    : "1px solid rgba(246,102,122,0.22)",

                color:
                  isCorrect
                    ? "#68dfa9"
                    : "#ff8b99",

                fontSize:
                  "30px",

                marginBottom:
                  "20px"
              }}
            >

              {isCorrect
                ? "✓"
                : "×"}

            </div>


            <h2
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "21px",

                fontWeight:
                  "500",

                color:
                  "#ffffff"
              }}
            >

              {isCorrect
                ? "CORRECT!"
                : "GOOD TRY!"}

            </h2>


            <p
              style={{
                margin:
                  "0 0 15px",

                color:
                  "#9097aa",

                fontSize:
                  "12px"
              }}
            >

              {isCorrect
                ? "You remembered the position correctly."
                : "The symbol was in a different position."}

            </p>


            {/* SCORE */}

            <div
              style={{
                width:
                  "240px",

                padding:
                  "14px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(142,149,181,0.16)",

                borderRadius:
                  "9px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                CURRENT SCORE
              </p>


              <strong
                style={{
                  color:
                    "#ffffff",

                  fontSize:
                    "25px"
                }}
              >
                {score} / {round}
              </strong>

            </div>


            <button
              style={primaryButtonStyle}
              onClick={nextRound}
              disabled={loading}
            >

              {loading
                ? "SAVING..."
                : round < TOTAL_ROUNDS
                  ? "NEXT ROUND"
                  : "VIEW RESULTS"}

            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     FINAL RESULT
  ===================================================== */

  if (
    screen === "final"
  ) {

    return (

      <div style={pageStyle}>

        <button
          style={backButtonStyle}
          onClick={goBack}
        >
          ← BACK
        </button>


        <div style={boardStyle}>

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
                  "68px",

                height:
                  "68px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(130,57,216,0.14)",

                border:
                  "1px solid rgba(155,82,255,0.27)",

                color:
                  "#c28aff",

                fontSize:
                  "29px",

                marginBottom:
                  "18px"
              }}
            >
              ★
            </div>


            {/* MESSAGE */}

            <h2
              style={{
                margin:
                  "0 0 20px",

                color:
                  "#ffffff",

                fontSize:
                  "21px",

                fontWeight:
                  "500"
              }}
            >

              {finalAccuracy === 100
                ? "EXCELLENT!"
                : finalAccuracy >= 67
                  ? "GOOD JOB!"
                  : "KEEP PRACTICING!"}

            </h2>


            {/* SCORE */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                SCORE
              </p>


              <strong
                style={{
                  color:
                    "#ffffff",

                  fontSize:
                    "28px"
                }}
              >
                {score} / {TOTAL_ROUNDS}
              </strong>

            </div>


            {/* ACCURACY */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                ACCURACY
              </p>


              <strong
                style={{
                  color:
                    "#68dda8",

                  fontSize:
                    "28px"
                }}
              >
                {finalAccuracy}%
              </strong>

            </div>


            {/* ERRORS */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                ERRORS
              </p>


              <strong
                style={{
                  color:
                    "#ff9ba7",

                  fontSize:
                    "28px"
                }}
              >
                {TOTAL_ROUNDS - score}
              </strong>

            </div>


            {/* RESPONSE TIME */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                RESPONSE TIME
              </p>


              <strong
                style={{
                  color:
                    "#74d9ff",

                  fontSize:
                    "28px"
                }}
              >
                {gameStartTime
                  ? Number(
                      (
                        (
                          performance.now() -
                          gameStartTime
                        ) / 1000
                      ).toFixed(1)
                    )
                  : 0}s
              </strong>

            </div>


            {/* XP */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "10px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                XP EARNED
              </p>


              <strong
                style={{
                  color:
                    "#6edaff",

                  fontSize:
                    "28px"
                }}
              >
                +{earnedXP} XP
              </strong>

            </div>


            {/* LEVEL */}

            <div
              style={{
                width:
                  "250px",

                padding:
                  "16px",

                marginBottom:
                  "12px",

                border:
                  "1px solid rgba(139,145,177,0.17)",

                borderRadius:
                  "10px",

                background:
                  "#171a31"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 5px",

                  color:
                    "#858ba1",

                  fontSize:
                    "9px",

                  letterSpacing:
                    "1px"
                }}
              >
                CURRENT LEVEL
              </p>


              <strong
                style={{
                  color:
                    "#c48aff",

                  fontSize:
                    "28px"
                }}
              >
                Level {level}
              </strong>

            </div>


            {/* NEXT ADAPTIVE LEVEL */}

            {nextLevel !== null && (

              <div
                style={{
                  width:
                    "250px",

                  padding:
                    "13px 16px",

                  marginBottom:
                    "12px",

                  border:
                    "1px solid rgba(140,92,230,0.20)",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(113,46,217,0.08)"
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 5px",

                    color:
                      "#858ba1",

                    fontSize:
                      "9px",

                    letterSpacing:
                      "1px"
                  }}
                >
                  NEXT ADAPTIVE LEVEL
                </p>


                <strong
                  style={{
                    color:
                      "#c48aff",

                    fontSize:
                      "20px"
                  }}
                >
                  Level {nextLevel}
                </strong>

              </div>

            )}


            {/* TOTAL XP */}

            <p
              style={{
                margin:
                  "4px 0 10px",

                color:
                  "#858ca0",

                fontSize:
                  "11px"
              }}
            >
              Total XP:{" "}

              <strong
                style={{
                  color:
                    "#b991ff"
                }}
              >
                {
                  Number(
                    localStorage.getItem(
                      "mindcareXP"
                    )
                  ) || 0
                }
              </strong>
            </p>


            {/* SAVE STATUS */}

            <p
              style={{
                margin:
                  "0 0 8px",

                color:
                  "#7ce0bb",

                fontSize:
                  "11px"
              }}
            >
              {saveStatus}
            </p>


            <p
              style={{
                margin:
                  "0 0 15px",

                color:
                  "#737b92",

                fontSize:
                  "10px"
              }}
            >
              Your progress has been saved.
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


export default ObjectPlacement;