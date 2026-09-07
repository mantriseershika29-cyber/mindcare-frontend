import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { completeGame } from "../utils/gameProgress";

import {
  createSession,
  savePerformance,
  getDifficulty,
  getNextLevel
} from "../utils/api";


function Sequencing() {

  const navigate = useNavigate();


  /* =====================================================
     GAME SCREEN
  ===================================================== */

  const [screen, setScreen] =
    useState("start");


  /* =====================================================
     SEQUENCE
  ===================================================== */

  const [sequence, setSequence] =
    useState([]);


  /* =====================================================
     USER SEQUENCE
  ===================================================== */

  const [userSequence, setUserSequence] =
    useState([]);


  /* =====================================================
     CURRENT STEP
  ===================================================== */

  const [currentStep, setCurrentStep] =
    useState(0);


  /* =====================================================
     SCORE
  ===================================================== */

  const [score, setScore] =
    useState(0);


  /* =====================================================
     TOTAL CLICKS
  ===================================================== */

  const [totalClicks, setTotalClicks] =
    useState(0);


  /* =====================================================
     WRONG CLICKS
  ===================================================== */

  const [wrongClicks, setWrongClicks] =
    useState(0);


  /* =====================================================
     ACCURACY
  ===================================================== */

  const [accuracy, setAccuracy] =
    useState(0);


  /* =====================================================
     MESSAGE
  ===================================================== */

  const [message, setMessage] =
    useState("");


  /* =====================================================
     ERROR
  ===================================================== */

  const [error, setError] =
    useState("");


  /* =====================================================
     XP EARNED
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
     RESPONSE TIME
  ===================================================== */

  const [responseTime, setResponseTime] =
    useState(0);


  /* =====================================================
     GAME START TIME
  ===================================================== */

  const [gameStartTime, setGameStartTime] =
    useState(null);


  /* =====================================================
     BACKEND SESSION ID
  ===================================================== */

  const [sessionId, setSessionId] =
    useState("");


  /* =====================================================
     BACKEND LOADING
  ===================================================== */

  const [loading, setLoading] =
    useState(false);


  /* =====================================================
     SAVE STATUS
  ===================================================== */

  const [saveStatus, setSaveStatus] =
    useState("");


  /* =====================================================
     DIFFICULTY
  ===================================================== */

  const [difficulty, setDifficulty] =
    useState(null);


  /* =====================================================
     NEXT LEVEL
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
     CREATE RANDOM SEQUENCE
     
     Difficulty API controls itemCount.
     If backend does not provide itemCount,
     default to 4.
  ===================================================== */

  const createSequence = (
    itemCount = 4
  ) => {

    const safeItemCount =
      Math.min(
        5,
        Math.max(
          2,
          Number(itemCount) || 4
        )
      );


    const numbers = [
      1,
      2,
      3,
      4,
      5
    ];


    const shuffled = [
      ...numbers
    ].sort(
      () =>
        Math.random() - 0.5
    );


    return shuffled.slice(
      0,
      safeItemCount
    );

  };


  /* =====================================================
     START GAME
  ===================================================== */

  const startGame = async () => {

    setError("");

    setMessage("");

    setSaveStatus("");

    setNextLevel(null);

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
          "sequencing",
          currentLevel
        );


      console.log(
        "Sequencing Difficulty:",
        difficultyResponse
      );


      const difficultyParameters =
        difficultyResponse?.parameters || null;


      setDifficulty(
        difficultyParameters
      );


      /* =================================================
         CREATE BACKEND SESSION
      ================================================= */

      const session =
        await createSession({

          gameType:
            "sequencing",

          level:
            currentLevel

        });


      /* =================================================
         CHECK SESSION ID
      ================================================= */

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
         GET SEQUENCE LENGTH
         
         Backend itemCount controls difficulty.
         Default remains 4 if unavailable.
      ================================================= */

      const itemCount =
        difficultyParameters?.itemCount ||
        4;


      /* =================================================
         CREATE NEW SEQUENCE
      ================================================= */

      const newSequence =
        createSequence(
          itemCount
        );


      setSequence(
        newSequence
      );


      setUserSequence(
        []
      );


      setCurrentStep(
        0
      );


      setScore(
        0
      );


      setTotalClicks(
        0
      );


      setWrongClicks(
        0
      );


      setAccuracy(
        0
      );


      setEarnedXP(
        0
      );


      setResponseTime(
        0
      );


      setLevel(
        currentLevel
      );


      /* =================================================
         START GAME TIMER
      ================================================= */

      setGameStartTime(
        performance.now()
      );


      /* =================================================
         SHOW SEQUENCE
      ================================================= */

      setScreen(
        "showing"
      );


    } catch (err) {

      console.error(
        "Sequencing start failed:",
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
     SHOW SEQUENCE
  ===================================================== */

  useEffect(() => {

    if (
      screen !== "showing"
    ) {

      return;

    }


    const timer =
      setTimeout(() => {

        setScreen(
          "playing"
        );

      }, 3000);


    return () =>
      clearTimeout(
        timer
      );

  }, [screen]);


  /* =====================================================
     SAVE PERFORMANCE TO BACKEND
  ===================================================== */

  const saveSequencingPerformance =
    async ({
      finalScore,
      finalAccuracy,
      finalErrors,
      finalResponseTime,
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
           SEND PERFORMANCE TO BACKEND
        ============================================= */

        await savePerformance({

          sessionId:
            sessionId,

          gameType:
            "sequencing",

          level:
            finalLevel,

          score:
            finalScore,

          accuracy:
            finalAccuracy,

          errors:
            finalErrors,

          responseTimeSeconds:
            finalResponseTime

        });


        /* =============================================
           LOCAL PROGRESS
        ============================================= */

        const result =
          completeGame({

            gameName:
              "Sequencing",

            score:
              finalScore,

            accuracy:
              finalAccuracy,

            responseTime:
              finalResponseTime

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
              "sequencing",
              finalLevel,
              finalAccuracy
            );


          console.log(
            "Sequencing Adaptive Response:",
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
             SAVE BACKEND LEVEL
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
            "Adaptive difficulty failed:",
            adaptiveError
          );


          /*
            Keep the current level when adaptive API
            is temporarily unavailable.
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


        /* =============================================
           FINAL MESSAGE
        ============================================= */

        if (
          finalAccuracy === 100
        ) {

          setMessage(
            "Perfect! You remembered the complete sequence."
          );

        } else if (
          finalAccuracy >= 80
        ) {

          setMessage(
            "Excellent work! You remembered the sequence very well."
          );

        } else if (
          finalAccuracy >= 60
        ) {

          setMessage(
            "Good effort! Keep practicing your sequence recall."
          );

        } else {

          setMessage(
            "Keep practicing. Your recall will improve."
          );

        }


        /* =============================================
           SHOW RESULTS
        ============================================= */

        setScreen(
          "results"
        );


      } catch (err) {

        console.error(
          "Performance save failed:",
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
     SELECT NUMBER
  ===================================================== */

  const selectNumber = (
    number
  ) => {

    if (
      screen !== "playing" ||
      loading
    ) {

      return;

    }


    const correctNumber =
      sequence[
        currentStep
      ];


    /* =================================================
       TOTAL CLICKS
    ================================================= */

    const updatedClicks =
      totalClicks + 1;


    setTotalClicks(
      updatedClicks
    );


    /* =================================================
       WRONG NUMBER
    ================================================= */

    if (
      number !== correctNumber
    ) {

      const updatedWrongClicks =
        wrongClicks + 1;


      setWrongClicks(
        updatedWrongClicks
      );


      const liveAccuracy =
        Math.round(
          (
            score /
            updatedClicks
          ) * 100
        );


      setAccuracy(
        liveAccuracy
      );


      setError(
        `Not quite. Select ${correctNumber}.`
      );


      setMessage(
        "Try again."
      );


      return;

    }


    /* =================================================
       CORRECT NUMBER
    ================================================= */

    setError(
      ""
    );


    const updatedUserSequence = [
      ...userSequence,
      number
    ];


    setUserSequence(
      updatedUserSequence
    );


    /* =================================================
       NEW SCORE
    ================================================= */

    const newScore =
      score + 1;


    setScore(
      newScore
    );


    /* =================================================
       LIVE ACCURACY
    ================================================= */

    const liveAccuracy =
      Math.round(
        (
          newScore /
          updatedClicks
        ) * 100
      );


    setAccuracy(
      liveAccuracy
    );


    setMessage(
      "Correct!"
    );


    const nextStep =
      currentStep + 1;


    /* =================================================
       SEQUENCE COMPLETE
    ================================================= */

    if (
      nextStep ===
      sequence.length
    ) {

      /* ===============================================
         FINAL ACCURACY
      =============================================== */

      const finishedAccuracy =
        Math.round(
          (
            newScore /
            updatedClicks
          ) * 100
        );


      setAccuracy(
        finishedAccuracy
      );


      setCurrentStep(
        nextStep
      );


      /* ===============================================
         FINAL RESPONSE TIME
      =============================================== */

      const finishedResponseTime =
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


      setResponseTime(
        finishedResponseTime
      );


      /* ===============================================
         FINAL ERRORS
      =============================================== */

      const finalErrors =
        wrongClicks;


      /* ===============================================
         SAVE PERFORMANCE
      =============================================== */

      saveSequencingPerformance({

        finalScore:
          newScore,

        finalAccuracy:
          finishedAccuracy,

        finalErrors:
          finalErrors,

        finalResponseTime:
          finishedResponseTime,

        finalLevel:
          getSafeLevel()

      });


      return;

    }


    /* =================================================
       MOVE TO NEXT NUMBER
    ================================================= */

    setCurrentStep(
      nextStep
    );

  };


  /* =====================================================
     PLAY AGAIN
  ===================================================== */

  const playAgain = () => {

    setSequence(
      []
    );


    setUserSequence(
      []
    );


    setCurrentStep(
      0
    );


    setScore(
      0
    );


    setTotalClicks(
      0
    );


    setWrongClicks(
      0
    );


    setAccuracy(
      0
    );


    setEarnedXP(
      0
    );


    setResponseTime(
      0
    );


    setMessage(
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


    setSessionId(
      ""
    );


    setDifficulty(
      null
    );


    setNextLevel(
      null
    );


    setScreen(
      "start"
    );

  };


  /* =====================================================
     GO BACK
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
     PAGE STYLE
  ===================================================== */

  const pageStyle = {

    minHeight:
      "100vh",

    width:
      "100%",

    background:
      `
      radial-gradient(
        circle at 78% 8%,
        rgba(113, 46, 217, 0.22),
        transparent 28%
      ),
      radial-gradient(
        circle at 15% 82%,
        rgba(57, 43, 158, 0.16),
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
      "border-box"

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
      "540px",

    maxWidth:
      "95vw",

    minHeight:
      "600px",

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
      "0",

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
      "1",

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
          "1.7"
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
        Sequence Length:{" "}
        <strong
          style={{
            color:
              "#ffffff"
          }}
        >
          {difficulty.itemCount || sequence.length || "—"}
        </strong>
      </div>


      {difficulty.timeLimitSeconds && (

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
            SEQUENCING
          </h1>


          <div
            style={contentStyle}
          >

            {/* ICON */}

            <div
              style={{
                width:
                  "78px",

                height:
                  "78px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(27,163,109,0.12)",

                border:
                  "1px solid rgba(35,184,129,0.25)",

                color:
                  "#55d7a2",

                fontSize:
                  "20px",

                fontWeight:
                  "bold",

                marginBottom:
                  "22px"
              }}
            >
              123
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
              Remember the order
            </h2>


            <p
              style={{
                maxWidth:
                  "330px",

                margin:
                  "0 0 14px",

                fontSize:
                  "13px",

                lineHeight:
                  "1.7",

                color:
                  "#9298ae"
              }}
            >
              A sequence of numbers will appear.
              Remember the exact order and reproduce it.
            </p>


            {/* CURRENT LEVEL */}

            <p
              style={{
                margin:
                  "0 0 22px",

                color:
                  "#8289a1",

                fontSize:
                  "11px"
              }}
            >
              Current Level:{" "}

              <strong
                style={{
                  color:
                    "#c18bff"
                }}
              >
                {level}
              </strong>
            </p>


            {/* ERROR */}

            {error && (

              <div
                style={{
                  marginBottom:
                    "14px",

                  padding:
                    "10px 14px",

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

                  maxWidth:
                    "330px",

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
                ? "STARTING..."
                : "START"}
            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     SHOW SEQUENCE
  ===================================================== */

  if (
    screen === "showing"
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
            REMEMBER THE SEQUENCE
          </h1>


          <div
            style={contentStyle}
          >

            <p
              style={{
                margin:
                  "0 0 25px",

                color:
                  "#a0a5b8",

                fontSize:
                  "13px"
              }}
            >
              Remember these numbers in this exact order.
            </p>


            {/* DIFFICULTY */}

            {difficultyCard}


            {/* LARGE VISIBLE SEQUENCE */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "13px",

                marginBottom:
                  "28px",

                flexWrap:
                  "wrap"
              }}
            >

              {sequence.map(
                (number, index) => (

                  <div
                    key={index}
                    style={{
                      width:
                        "62px",

                      height:
                        "62px",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      borderRadius:
                        "11px",

                      background:
                        "linear-gradient(135deg, #1d8a68, #176d55)",

                      border:
                        "1px solid rgba(100,230,184,0.32)",

                      color:
                        "#ffffff",

                      fontSize:
                        "24px",

                      fontWeight:
                        "600",

                      boxShadow:
                        "0 0 18px rgba(27,174,120,0.20)"
                    }}
                  >
                    {number}
                  </div>

                )
              )}

            </div>


            {/* COUNTDOWN MESSAGE */}

            <div
              style={{
                padding:
                  "9px 15px",

                borderRadius:
                  "20px",

                background:
                  "rgba(255,255,255,0.04)",

                border:
                  "1px solid rgba(150,158,190,0.14)",

                color:
                  "#8e96a9",

                fontSize:
                  "10px"
              }}
            >
              Memorize now...
            </div>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     PLAYING SCREEN
  ===================================================== */

  if (
    screen === "playing"
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
            RECREATE THE SEQUENCE
          </h1>


          <div
            style={contentStyle}
          >

            <p
              style={{
                margin:
                  "0 0 18px",

                color:
                  "#a0a5b8",

                fontSize:
                  "13px"
              }}
            >
              Click the numbers in the same order.
            </p>


            {/* LIVE SCORE */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  "9px",

                marginBottom:
                  "20px",

                flexWrap:
                  "wrap",

                justifyContent:
                  "center"
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
                    "11px"
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
                    "11px"
                }}
              >
                Accuracy: {accuracy}%
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
                    "11px"
                }}
              >
                Mistakes: {wrongClicks}
              </div>

            </div>


            {/* ANSWER AREA */}

            <div
              style={{
                minHeight:
                  "67px",

                width:
                  "100%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "9px",

                marginBottom:
                  "18px",

                padding:
                  "8px",

                border:
                  "1px dashed rgba(143,150,184,0.20)",

                borderRadius:
                  "10px",

                background:
                  "rgba(255,255,255,0.02)",

                boxSizing:
                  "border-box",

                flexWrap:
                  "wrap"
              }}
            >

              {userSequence.length === 0 ? (

                <span
                  style={{
                    color:
                      "#646c82",

                    fontSize:
                      "10px",

                    letterSpacing:
                      "0.7px"
                  }}
                >
                  YOUR SEQUENCE
                </span>

              ) : (

                userSequence.map(
                  (
                    number,
                    index
                  ) => (

                    <div
                      key={index}
                      style={{
                        width:
                          "48px",

                        height:
                          "48px",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        borderRadius:
                          "9px",

                        background:
                          "linear-gradient(135deg, #246a55, #174938)",

                        border:
                          "1px solid rgba(92,223,175,0.25)",

                        color:
                          "#ffffff",

                        fontSize:
                          "18px",

                        fontWeight:
                          "600"
                      }}
                    >
                      {number}
                    </div>

                  )
                )

              )}

            </div>


            {/* STEP */}

            <p
              style={{
                margin:
                  "0 0 18px",

                color:
                  "#858da4",

                fontSize:
                  "11px"
              }}
            >
              Select number{" "}

              <strong
                style={{
                  color:
                    "#c48cff"
                }}
              >
                {currentStep + 1}
              </strong>

              {" "}of{" "}

              {sequence.length}
            </p>


            {/* NUMBER BUTTONS */}

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "center",

                alignItems:
                  "center",

                gap:
                  "10px",

                flexWrap:
                  "wrap",

                marginBottom:
                  "18px"
              }}
            >

              {[1, 2, 3, 4, 5].map(
                (number) => {

                  const alreadySelected =
                    userSequence.includes(
                      number
                    );


                  return (

                    <button
                      key={number}
                      type="button"
                      onClick={() =>
                        selectNumber(
                          number
                        )
                      }
                      disabled={
                        alreadySelected ||
                        loading
                      }
                      style={{
                        width:
                          "58px",

                        height:
                          "58px",

                        border:
                          alreadySelected
                            ? "1px solid #363b50"
                            : "1px solid rgba(151,159,190,0.24)",

                        borderRadius:
                          "10px",

                        background:
                          alreadySelected
                            ? "#202439"
                            : "#20253e",

                        color:
                          alreadySelected
                            ? "#5e657a"
                            : "#ffffff",

                        fontSize:
                          "18px",

                        fontWeight:
                          "600",

                        cursor:
                          alreadySelected ||
                          loading
                            ? "not-allowed"
                            : "pointer",

                        opacity:
                          alreadySelected
                            ? 0.48
                            : 1,

                        transition:
                          "all 0.15s ease"
                      }}

                      onMouseEnter={(e) => {

                        if (
                          !alreadySelected &&
                          !loading
                        ) {

                          e.currentTarget.style.background =
                            "#6936b8";

                          e.currentTarget.style.borderColor =
                            "#9b6bea";

                        }

                      }}

                      onMouseLeave={(e) => {

                        if (
                          !alreadySelected &&
                          !loading
                        ) {

                          e.currentTarget.style.background =
                            "#20253e";

                          e.currentTarget.style.borderColor =
                            "rgba(151,159,190,0.24)";

                        }

                      }}
                    >
                      {number}
                    </button>

                  );

                }
              )}

            </div>


            {/* ERROR */}

            {error && (

              <div
                style={{
                  marginBottom:
                    "8px",

                  padding:
                    "9px 13px",

                  border:
                    "1px solid rgba(255,92,109,0.22)",

                  borderRadius:
                    "7px",

                  background:
                    "rgba(255,72,92,0.07)",

                  color:
                    "#ff9ba7",

                  fontSize:
                    "10px"
                }}
              >
                ⚠ {error}
              </div>

            )}


            {/* MESSAGE */}

            {message && !error && (

              <p
                style={{
                  margin:
                    "5px 0 0",

                  color:
                    "#76ddb1",

                  fontSize:
                    "11px"
                }}
              >
                {message}
              </p>

            )}

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     RESULTS SCREEN
  ===================================================== */

  if (
    screen === "results"
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

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(27,174,120,0.12)",

                border:
                  "1px solid rgba(27,174,120,0.25)",

                color:
                  "#63dfa9",

                fontSize:
                  "27px",

                marginBottom:
                  "18px"
              }}
            >
              {accuracy === 100
                ? "✓"
                : "↗"}
            </div>


            {/* TITLE */}

            <h2
              style={{
                margin:
                  "0 0 20px",

                fontSize:
                  "21px",

                color:
                  "#ffffff",

                fontWeight:
                  "500"
              }}
            >

              {accuracy === 100
                ? "EXCELLENT!"
                : accuracy >= 80
                  ? "GREAT JOB!"
                  : accuracy >= 60
                    ? "GOOD WORK!"
                    : "KEEP PRACTICING!"}

            </h2>


            {/* SCORE */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                SCORE
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#ffffff"
                }}
              >
                {score} / {sequence.length}
              </strong>

            </div>


            {/* ACCURACY */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                ACCURACY
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#75dfaf"
                }}
              >
                {accuracy}%
              </strong>

            </div>


            {/* MISTAKES */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                MISTAKES
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#ff9ba7"
                }}
              >
                {wrongClicks}
              </strong>

            </div>


            {/* RESPONSE TIME */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                RESPONSE TIME
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#74d9ff"
                }}
              >
                {responseTime}s
              </strong>

            </div>


            {/* XP */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                  "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                XP EARNED
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#74d9ff"
                }}
              >
                +{earnedXP} XP
              </strong>

            </div>


            {/* LEVEL */}

            <div
              style={{
                width:
                  "260px",

                padding:
                  "17px",

                marginBottom:
                    "10px",

                background:
                  "#171a31",

                border:
                  "1px solid rgba(137,143,176,0.18)",

                borderRadius:
                  "10px"
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
                    "1px"
                }}
              >
                CURRENT LEVEL
              </p>


              <strong
                style={{
                  fontSize:
                    "28px",

                  color:
                    "#c48aff"
                }}
              >
                Level {level}
              </strong>

            </div>


            {/* ADAPTIVE LEVEL */}

            {nextLevel !== null && (

              <div
                style={{
                  width:
                    "260px",

                  padding:
                    "13px 17px",

                  marginBottom:
                    "10px",

                  background:
                    "rgba(113,46,217,0.08)",

                  border:
                    "1px solid rgba(140,92,230,0.20)",

                  borderRadius:
                    "10px"
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
                    fontSize:
                      "20px",

                    color:
                      "#c48aff"
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
                  "5px 0 10px",

                color:
                  "#777f98",

                fontSize:
                  "11px"
              }}
            >
              Total XP:{" "}

              <strong
                style={{
                  color:
                    "#b99aff"
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

            {saveStatus && (

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

            )}


            {/* MESSAGE */}

            <p
              style={{
                maxWidth:
                  "330px",

                margin:
                  "0 0 18px",

                color:
                  "#888fa4",

                fontSize:
                  "11px",

                lineHeight:
                  "1.6"
              }}
            >
              {message}
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


export default Sequencing;