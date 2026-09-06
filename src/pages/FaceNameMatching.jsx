import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeGame } from "../utils/gameProgress";

import {
  createSession,
  savePerformance,
  getDifficulty,
  getNextLevel
} from "../utils/api";


/* =====================================================
   PEOPLE DATA
   More people are included so the backend can increase
   itemCount as the difficulty level increases.
===================================================== */

const PEOPLE = [
  {
    id: 1,
    emoji: "👨🏻",
    name: "Ravi"
  },

  {
    id: 2,
    emoji: "👩🏻",
    name: "Anita"
  },

  {
    id: 3,
    emoji: "👨🏽",
    name: "Suresh"
  },

  {
    id: 4,
    emoji: "👩🏽",
    name: "Meena"
  },

  {
    id: 5,
    emoji: "👨🏼",
    name: "Arjun"
  },

  {
    id: 6,
    emoji: "👩🏼",
    name: "Priya"
  },

  {
    id: 7,
    emoji: "👨🏾",
    name: "Kiran"
  },

  {
    id: 8,
    emoji: "👩🏾",
    name: "Divya"
  }
];


function FaceNameMatching() {

  const navigate = useNavigate();


  /* =====================================================
     ACTIVE PEOPLE
  ===================================================== */

  const [people, setPeople] =
    useState(
      PEOPLE.slice(0, 4)
    );


  /* =====================================================
     GAME STATE
  ===================================================== */

  const [started, setStarted] =
    useState(false);


  const [answers, setAnswers] =
    useState({});


  const [submitted, setSubmitted] =
    useState(false);


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
     ERRORS
  ===================================================== */

  const [gameError, setGameError] =
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
     GET SAFE ITEM COUNT
  ===================================================== */

  const getSafeItemCount = (
    backendItemCount
  ) => {

    const count =
      Number(
        backendItemCount
      );


    if (
      Number.isFinite(
        count
      ) &&
      count >= 2 &&
      count <= PEOPLE.length
    ) {

      return count;

    }


    return 4;

  };


  /* =====================================================
     HANDLE ANSWER
  ===================================================== */

  const handleAnswer = (
    personId,
    name
  ) => {

    if (
      loading
    ) {

      return;

    }


    setAnswers(
      previousAnswers => ({
        ...previousAnswers,
        [personId]:
          name
      })
    );


    setGameError("");

  };


  /* =====================================================
     START GAME
  ===================================================== */

  const startGame = async () => {

    setGameError("");

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
          "face_name_matching",
          currentLevel
        );


      console.log(
        "Face–Name Matching Difficulty:",
        difficultyResponse
      );


      const difficultyParameters =
        difficultyResponse?.parameters ||
        null;


      setDifficulty(
        difficultyParameters
      );


      /* ===============================================
         DETERMINE NUMBER OF PEOPLE
      =============================================== */

      const itemCount =
        getSafeItemCount(
          difficultyParameters?.itemCount
        );


      const activePeople =
        PEOPLE.slice(
          0,
          itemCount
        );


      setPeople(
        activePeople
      );


      /* ===============================================
         CREATE BACKEND SESSION
      =============================================== */

      const session =
        await createSession({

          gameType:
            "face_name_matching",

          level:
            currentLevel

        });


      /* ===============================================
         VERIFY SESSION ID
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
         STORE SESSION
      =============================================== */

      setSessionId(
        session.sessionId
      );


      /* ===============================================
         RESET GAME
      =============================================== */

      setAnswers({});

      setScore(0);

      setAccuracy(0);

      setEarnedXP(0);

      setLevel(
        currentLevel
      );

      setResponseTime(0);

      setSubmitted(false);


      /* ===============================================
         START TIMER
      =============================================== */

      setGameStartTime(
        performance.now()
      );


      /* ===============================================
         SHOW GAME
      =============================================== */

      setStarted(true);


    } catch (err) {

      console.error(
        "Face–Name Matching start failed:",
        err
      );


      setGameError(
        "Unable to start the game. Please make sure you are logged in and try again."
      );


    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     SAVE PERFORMANCE
  ===================================================== */

  const saveFaceNamePerformance =
    async ({
      finalScore,
      finalAccuracy,
      finalErrors,
      finalResponseTime,
      finalLevel
    }) => {

      setLoading(true);

      setSaveStatus(
        "Saving your performance..."
      );


      try {

        /* =============================================
           SESSION CHECK
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
            "face_name_matching",

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
           KEEP LOCAL PROGRESS
        ============================================= */

        const result =
          completeGame({

            gameName:
              "Face–Name Matching",

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
              "face_name_matching",
              finalLevel,
              finalAccuracy
            );


          console.log(
            "Face–Name Matching Adaptive Response:",
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
            "Face–Name Matching adaptive difficulty failed:",
            adaptiveError
          );


          /*
           * Keep current level if adaptive
           * endpoint is temporarily unavailable.
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
           SUCCESS STATUS
        ============================================= */

        setSaveStatus(
          "Performance saved successfully."
        );


        /* =============================================
           SHOW RESULTS
        ============================================= */

        setSubmitted(
          true
        );


      } catch (err) {

        console.error(
          "Face–Name Matching performance save failed:",
          err
        );


        setSaveStatus("");

        setGameError(
          "Your game finished, but the performance could not be saved. Please try again."
        );


      } finally {

        setLoading(false);

      }

    };


  /* =====================================================
     SUBMIT GAME
  ===================================================== */

  const handleSubmit = () => {

    if (
      loading
    ) {

      return;

    }


    setGameError("");


    /* ================================================
       CHECK EVERY ACTIVE PERSON
    ================================================ */

    let correct = 0;


    people.forEach(
      (person) => {

        if (
          answers[
            person.id
          ] ===
          person.name
        ) {

          correct++;

        }

      }
    );


    /* ================================================
       CALCULATE ACCURACY
    ================================================ */

    const calculatedAccuracy =
      Math.round(
        (
          correct /
          people.length
        ) * 100
      );


    /* ================================================
       ERRORS
    ================================================ */

    const finalErrors =
      people.length -
      correct;


    /* ================================================
       RESPONSE TIME
    ================================================ */

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


    /* ================================================
       UPDATE UI STATE
    ================================================ */

    setScore(
      correct
    );


    setAccuracy(
      calculatedAccuracy
    );


    setResponseTime(
      finishedResponseTime
    );


    /* ================================================
       SAVE TO BACKEND
    ================================================ */

    saveFaceNamePerformance({

      finalScore:
        correct,

      finalAccuracy:
        calculatedAccuracy,

      finalErrors:
        finalErrors,

      finalResponseTime:
        finishedResponseTime,

      finalLevel:
        getSafeLevel()

    });

  };


  /* =====================================================
     PLAY AGAIN
  ===================================================== */

  const handlePlayAgain = () => {

    setAnswers({});

    setSubmitted(false);

    setScore(0);

    setAccuracy(0);

    setEarnedXP(0);

    setResponseTime(0);

    setSessionId("");

    setGameError("");

    setSaveStatus("");

    setDifficulty(null);

    setNextLevel(null);

    setGameStartTime(null);

    setPeople(
      PEOPLE.slice(
        0,
        4
      )
    );


    setLevel(
      Number(
        localStorage.getItem(
          "mindcareLevel"
        )
      ) || 1
    );


    setStarted(false);

  };


  /* =====================================================
     GO TO GAMES
  ===================================================== */

  const goToGames = () => {

    navigate(
      "/games"
    );

  };


  /* =====================================================
     GO TO DASHBOARD
  ===================================================== */

  const goToDashboard = () => {

    navigate(
      "/dashboard"
    );

  };


  /* =====================================================
     DIFFICULTY CARD
  ===================================================== */

  const difficultyCard = (

    <div
      style={{
        width:
          "300px",

        marginBottom:
          "20px",

        padding:
          "15px",

        background:
          "rgba(113,46,217,0.07)",

        border:
          "1px solid rgba(140,92,230,0.20)",

        borderRadius:
          "10px",

        boxSizing:
          "border-box"
      }}
    >

      <p
        style={{
          margin:
            "0 0 8px",

          color:
            "#9da4b8",

          fontSize:
            "11px"
        }}
      >
        Difficulty:
        {" "}

        <strong
          style={{
            color:
              "#c18aff"
          }}
        >
          {difficulty?.label ||
            `Level ${level}`}
        </strong>
      </p>


      <p
        style={{
          margin:
            "0 0 8px",

          color:
            "#9da4b8",

          fontSize:
            "11px"
        }}
      >
        Faces:
        {" "}

        <strong
          style={{
            color:
              "#ffffff"
          }}
        >
          {people.length}
        </strong>
      </p>


      {difficulty?.timeLimitSeconds !== undefined && (

        <p
          style={{
            margin:
              "0 0 8px",

            color:
              "#9da4b8",

            fontSize:
              "11px"
          }}
        >
          Time Limit:
          {" "}

          <strong
            style={{
              color:
                "#ffffff"
            }}
          >
            {difficulty.timeLimitSeconds}s
          </strong>
        </p>

      )}


      {difficulty?.distractorCount !== undefined && (

        <p
          style={{
            margin:
              "0 0 8px",

            color:
              "#9da4b8",

            fontSize:
              "11px"
          }}
        >
          Distractors:
          {" "}

          <strong
            style={{
              color:
                "#ffffff"
            }}
          >
            {difficulty.distractorCount}
          </strong>
        </p>

      )}


      <p
        style={{
          margin:
            "0",

          color:
            "#9da4b8",

          fontSize:
            "11px"
        }}
      >
        Current Level:
        {" "}

        <strong
          style={{
            color:
              "#c18aff"
          }}
        >
          {level}
        </strong>
      </p>

    </div>

  );


  /* =====================================================
     COMMON PAGE STYLE
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
      "760px",

    maxWidth:
      "96vw",

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
      "230px",

    height:
      "44px",

    marginTop:
      "15px",

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
      "230px",

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
     START SCREEN
  ===================================================== */

  if (
    !started
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={backButtonStyle}
          onClick={goToGames}
        >
          ← BACK
        </button>


        <div
          style={boardStyle}
        >

          <h1
            style={titleStyle}
          >
            FACE–NAME MATCHING
          </h1>


          <div
            style={contentStyle}
          >

            {/* FACE ICON */}

            <div
              style={{
                width:
                  "82px",

                height:
                  "82px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "50%",

                background:
                  "rgba(211,137,30,0.13)",

                border:
                  "1px solid rgba(226,158,55,0.25)",

                color:
                  "#f0b34d",

                fontSize:
                  "31px",

                marginBottom:
                  "22px"
              }}
            >
              ●
            </div>


            <h2
              style={{
                margin:
                  "0 0 10px",

                color:
                  "#ffffff",

                fontSize:
                  "20px",

                fontWeight:
                  "500"
              }}
            >
              Remember the faces and names
            </h2>


            <p
              style={{
                maxWidth:
                  "450px",

                margin:
                  "0 0 20px",

                color:
                  "#9399ad",

                fontSize:
                  "13px",

                lineHeight:
                  "1.7"
              }}
            >
              Look at each face and remember the
              person's name. Then choose the correct
              name for each face.
            </p>


            {/* =================================================
                GAME INFORMATION
            ================================================= */}

            <div
              style={{
                width:
                  "300px",

                marginBottom:
                  "20px",

                padding:
                  "15px",

                background:
                  "rgba(255,255,255,0.025)",

                border:
                  "1px solid rgba(142,149,181,0.16)",

                borderRadius:
                  "10px"
              }}
            >

              <p
                style={{
                  margin:
                    "0 0 8px",

                  color:
                    "#9da4b8",

                  fontSize:
                    "11px"
                }}
              >
                Difficulty:
                {" "}

                <strong
                  style={{
                    color:
                      "#c18aff"
                  }}
                >
                  {difficulty?.label ||
                    "Backend Adaptive"}
                </strong>
              </p>


              <p
                style={{
                  margin:
                    "0 0 8px",

                  color:
                    "#9da4b8",

                  fontSize:
                    "11px"
                }}
              >
                Faces:
                {" "}

                <strong
                  style={{
                    color:
                      "#ffffff"
                  }}
                >
                  {people.length}
                </strong>
              </p>


              <p
                style={{
                  margin:
                    "0",

                  color:
                    "#9da4b8",

                  fontSize:
                    "11px"
                }}
              >
                Current Level:
                {" "}

                <strong
                  style={{
                    color:
                      "#c18aff"
                  }}
                >
                  {level}
                </strong>
              </p>

            </div>


            {/* ERROR */}

            {gameError && (

              <div
                style={{
                  marginBottom:
                    "12px",

                  maxWidth:
                    "420px",

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

                  lineHeight:
                    "1.5"
                }}
              >
                ⚠ {gameError}
              </div>

            )}


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
                ? "LOADING DIFFICULTY..."
                : "START GAME"}
            </button>


            <button
              style={
                secondaryButtonStyle
              }
              onClick={
                goToGames
              }
              disabled={
                loading
              }
            >
              BACK TO GAMES
            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     RESULT SCREEN
  ===================================================== */

  if (
    submitted
  ) {

    return (

      <div
        style={pageStyle}
      >

        <button
          style={backButtonStyle}
          onClick={goToGames}
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
                  "70px",

                height:
                  "70px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  accuracy >= 75
                    ? "rgba(33,184,130,0.13)"
                    : "rgba(139,68,224,0.13)",

                border:
                  accuracy >= 75
                    ? "1px solid rgba(64,222,164,0.28)"
                    : "1px solid rgba(156,82,255,0.28)",

                color:
                  accuracy >= 75
                    ? "#68dfa9"
                    : "#c28aff",

                fontSize:
                  "29px",

                marginBottom:
                  "18px"
              }}
            >
              {accuracy >= 75
                ? "✓"
                : "↗"}
            </div>


            {/* MESSAGE */}

            <h2
              style={{
                margin:
                  "0 0 10px",

                fontSize:
                  "22px",

                fontWeight:
                  "500",

                color:
                  "#ffffff"
              }}
            >

              {accuracy === 100
                ? "EXCELLENT!"
                : accuracy >= 75
                  ? "GREAT JOB!"
                  : accuracy >= 50
                    ? "GOOD WORK!"
                    : "KEEP PRACTICING!"}

            </h2>


            <p
              style={{
                margin:
                  "0 0 22px",

                color:
                  "#8f96aa",

                fontSize:
                  "12px"
              }}
            >

              {accuracy === 100
                ? "You matched every face correctly."
                : `You matched ${score} of ${people.length} faces correctly.`}

            </p>


            {/* SCORE */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                  color:
                    "#ffffff",

                  fontSize:
                    "29px"
                }}
              >
                {score} / {people.length}
              </strong>

            </div>


            {/* ACCURACY */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                  color:
                    "#efb45a",

                  fontSize:
                    "29px"
                }}
              >
                {accuracy}%
              </strong>

            </div>


            {/* ERRORS */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                ERRORS
              </p>


              <strong
                style={{
                  color:
                    "#ff9ba7",

                  fontSize:
                    "29px"
                }}
              >
                {people.length - score}
              </strong>

            </div>


            {/* RESPONSE TIME */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                  color:
                    "#70daff",

                  fontSize:
                    "29px"
                }}
              >
                {responseTime}s
              </strong>

            </div>


            {/* XP */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                  color:
                    "#70daff",

                  fontSize:
                    "29px"
                }}
              >
                +{earnedXP} XP
              </strong>

            </div>


            {/* LEVEL */}

            <div
              style={{
                width:
                  "300px",

                padding:
                  "18px",

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
                  color:
                    "#c48aff",

                  fontSize:
                    "29px"
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
                    "300px",

                  padding:
                    "14px 18px",

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
                    color:
                      "#c48aff",

                    fontSize:
                      "21px"
                  }}
                >
                  Level {nextLevel}
                </strong>

              </div>

            )}


            {/* DIFFICULTY USED */}

            {difficulty && (

              <div
                style={{
                  width:
                    "300px",

                  padding:
                    "13px 18px",

                  marginBottom:
                    "10px",

                  background:
                    "rgba(255,255,255,0.025)",

                  border:
                    "1px solid rgba(142,149,181,0.16)",

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
                  BACKEND DIFFICULTY
                </p>


                <strong
                  style={{
                    color:
                      "#c18aff",

                    fontSize:
                      "12px"
                  }}
                >
                  {difficulty.label ||
                    `Level ${level}`}
                </strong>


                <p
                  style={{
                    margin:
                      "5px 0 0",

                    color:
                      "#737b92",

                    fontSize:
                      "10px"
                  }}
                >
                  {people.length} faces
                </p>

              </div>

            )}


            {/* SAVE STATUS */}

            <p
              style={{
                margin:
                  "6px 0 8px",

                color:
                  "#73dfb0",

                fontSize:
                  "10px"
              }}
            >
              {saveStatus}
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
                handlePlayAgain
              }
            >
              PLAY AGAIN
            </button>


            {/* GAMES */}

            <button
              style={
                secondaryButtonStyle
              }
              onClick={
                goToGames
              }
            >
              BACK TO GAMES
            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     GAME SCREEN
  ===================================================== */

  return (

    <div
      style={pageStyle}
    >

      <button
        style={backButtonStyle}
        onClick={goToGames}
      >
        ← BACK
      </button>


      <div
        style={{
          ...boardStyle,
          width:
            "900px"
        }}
      >

        <h1
          style={titleStyle}
        >
          FACE–NAME MATCHING
        </h1>


        <div
          style={{
            ...contentStyle,
            justifyContent:
              "flex-start"
          }}
        >

          <p
            style={{
              margin:
                "22px 0 12px",

              color:
                "#9ca2b6",

              fontSize:
                "13px"
            }}
          >
            Select the correct name for each face.
          </p>


          {/* =================================================
              BACKEND DIFFICULTY
          ================================================= */}

          {difficultyCard}


          {/* =================================================
              LIVE SCORE
          ================================================= */}

          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              marginBottom:
                "22px",

              flexWrap:
                "wrap",

              justifyContent:
                "center"
            }}
          >

            <div
              style={{
                padding:
                  "8px 14px",

                background:
                  "rgba(255,255,255,0.035)",

                border:
                  "1px solid rgba(141,149,181,0.18)",

                borderRadius:
                  "8px",

                color:
                  "#c1c6d5",

                fontSize:
                  "11px"
              }}
            >
              Score: {score}
            </div>


            <div
              style={{
                padding:
                  "8px 14px",

                background:
                  "rgba(255,255,255,0.035)",

                border:
                  "1px solid rgba(141,149,181,0.18)",

                borderRadius:
                  "8px",

                color:
                  "#c1c6d5",

                fontSize:
                  "11px"
              }}
            >
              Accuracy: {accuracy}%
            </div>


            <div
              style={{
                padding:
                  "8px 14px",

                background:
                  "rgba(255,255,255,0.035)",

                border:
                  "1px solid rgba(141,149,181,0.18)",

                borderRadius:
                  "8px",

                color:
                  "#c1c6d5",

                fontSize:
                  "11px"
              }}
            >
              Level: {level}
            </div>

          </div>


          {/* =================================================
              GAME ERROR
          ================================================= */}

          {gameError && (

            <div
              style={{
                width:
                  "100%",

                maxWidth:
                  "600px",

                marginBottom:
                  "16px",

                padding:
                  "10px 14px",

                boxSizing:
                  "border-box",

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
              ⚠ {gameError}
            </div>

          )}


          {/* =================================================
              PEOPLE GRID
          ================================================= */}

          <div
            style={{
              width:
                "100%",

              display:
                "grid",

              gridTemplateColumns:
                people.length <= 4
                  ? "repeat(4, 1fr)"
                  : "repeat(4, 1fr)",

              gap:
                "16px",

              marginBottom:
                "25px"
            }}
          >

            {people.map(
              (person) => (

                <div
                  key={person.id}

                  style={{
                    minHeight:
                      "260px",

                    padding:
                      "20px 15px",

                    display:
                      "flex",

                    flexDirection:
                      "column",

                    alignItems:
                      "center",

                    justifyContent:
                      "space-between",

                    background:
                      "linear-gradient(145deg, #1b1f3a, #12152b)",

                    border:
                      "1px solid rgba(124,132,169,0.20)",

                    borderRadius:
                      "12px",

                    boxSizing:
                      "border-box"
                  }}
                >

                  {/* FACE */}

                  <div
                    style={{
                      width:
                        "105px",

                      height:
                        "105px",

                      borderRadius:
                        "50%",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      background:
                        "#252a45",

                      border:
                        "2px solid rgba(173,93,245,0.32)",

                      fontSize:
                        "54px",

                      marginBottom:
                        "12px",

                      boxShadow:
                        "0 8px 22px rgba(0,0,0,0.22)"
                    }}
                  >
                    {person.emoji}
                  </div>


                  <h3
                    style={{
                      margin:
                        "0 0 12px",

                      color:
                        "#ffffff",

                      fontSize:
                        "13px",

                      fontWeight:
                        "500"
                    }}
                  >
                    Who is this?
                  </h3>


                  {/* SELECT */}

                  <select
                    value={
                      answers[
                        person.id
                      ] || ""
                    }

                    onChange={(event) =>
                      handleAnswer(
                        person.id,
                        event.target.value
                      )
                    }

                    disabled={
                      loading
                    }

                    style={{
                      width:
                        "100%",

                      height:
                        "39px",

                      padding:
                        "0 10px",

                      border:
                        "1px solid rgba(143,151,184,0.25)",

                      borderRadius:
                        "7px",

                      background:
                        "#0d1124",

                      color:
                        answers[
                          person.id
                        ]
                          ? "#ffffff"
                          : "#7d849a",

                      fontSize:
                        "11px",

                      outline:
                        "none",

                      cursor:
                        loading
                          ? "not-allowed"
                          : "pointer"
                    }}
                  >

                    <option
                      value=""
                    >
                      Select Name
                    </option>


                    {people.map(
                      (option) => (

                        <option
                          key={
                            option.id
                          }

                          value={
                            option.name
                          }

                          style={{
                            background:
                              "#11152a",

                            color:
                              "#ffffff"
                          }}
                        >
                          {option.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

              )
            )}

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            style={
              primaryButtonStyle
            }
            onClick={
              handleSubmit
            }
            disabled={
              loading
            }
          >
            {loading
              ? "SAVING..."
              : "SUBMIT ANSWERS"}
          </button>


          {/* =================================================
              EXIT
          ================================================= */}

          <button
            style={
              secondaryButtonStyle
            }
            onClick={
              goToGames
            }
            disabled={
              loading
            }
          >
            EXIT GAME
          </button>

        </div>

      </div>

    </div>

  );

}


export default FaceNameMatching;