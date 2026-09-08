import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../firebase";

import {
  getProgress,
  getPerformance,
} from "../utils/api";


function Dashboard() {

  const navigate = useNavigate();


  /* =====================================================
     USER
  ===================================================== */

  const [
    username,
    setUsername
  ] = useState(
    localStorage.getItem(
      "mindcareUser"
    ) || "Harini"
  );


  /* =====================================================
     BACKEND DATA
  ===================================================== */

  const [
    backendProgress,
    setBackendProgress
  ] = useState(null);


  const [
    backendPerformance,
    setBackendPerformance
  ] = useState([]);


  /* =====================================================
     LOADING
  ===================================================== */

  const [
    dashboardLoading,
    setDashboardLoading
  ] = useState(true);


  const [
    progressLoading,
    setProgressLoading
  ] = useState(false);


  const [
    performanceLoading,
    setPerformanceLoading
  ] = useState(false);


  const [
    loadingMessage,
    setLoadingMessage
  ] = useState(
    "Connecting to your training data..."
  );


  /* =====================================================
     LOCAL PROGRESS
     
     Used only for local values such as XP and
     recent local UI information.
  ===================================================== */

  const getLocalProgress = () => {

    return {

      xp:
        Number(
          localStorage.getItem(
            "mindCareXP"
          )
        ) || 0,

      level:
        Number(
          localStorage.getItem(
            "mindcareLevel"
          )
        ) || 1,

      sessions:
        Number(
          localStorage.getItem(
            "totalSessions"
          )
        ) || 0,

      gamesCompleted:
        Number(
          localStorage.getItem(
            "gamesCompleted"
          )
        ) || 0

    };

  };


  const [
    localProgress,
    setLocalProgress
  ] = useState(
    getLocalProgress
  );


  /* =====================================================
     LAST GAME
  ===================================================== */

  const getLastGame = () => {

    const saved =
      localStorage.getItem(
        "lastGameResult"
      );


    if (!saved) {

      return null;

    }


    try {

      return JSON.parse(
        saved
      );

    } catch {

      return null;

    }

  };


  const [
    lastGame,
    setLastGame
  ] = useState(
    getLastGame
  );


  /* =====================================================
     LOAD BACKEND DATA
  ===================================================== */

  const loadDashboardData = async (
    user
  ) => {

    if (!user) {

      setDashboardLoading(false);

      setLoadingMessage("");

      return;

    }


    setDashboardLoading(true);

    setLoadingMessage(
      "Fetching your progress..."
    );


    /* ===================================================
       USER INFORMATION
    =================================================== */

    const displayName =
      user.email
        ? user.email.split("@")[0]
        : localStorage.getItem(
            "mindcareUser"
          ) || "User";


    setUsername(
      displayName
    );


    localStorage.setItem(
      "firebaseUserId",
      user.uid
    );


    if (user.email) {

      localStorage.setItem(
        "firebaseUserEmail",
        user.email
      );

    }


    /* ===================================================
       PROGRESS API
    =================================================== */

    setProgressLoading(true);

    try {

      const progressResponse =
        await getProgress(
          user.uid
        );


      console.log(
        "Dashboard Progress:",
        progressResponse
      );


      if (
        progressResponse
      ) {

        setBackendProgress(
          progressResponse
        );

      }

    } catch (error) {

      console.warn(
        "Progress API unavailable:",
        error
      );

    } finally {

      setProgressLoading(false);

    }


    /* ===================================================
       PERFORMANCE API
    =================================================== */

    setLoadingMessage(
      "Loading performance history..."
    );

    setPerformanceLoading(true);


    try {

      const performanceResponse =
        await getPerformance(
          user.uid
        );


      console.log(
        "Dashboard Performance:",
        performanceResponse
      );


      let records = [];


      /* -----------------------------------------------
         ARRAY RESPONSE
      ----------------------------------------------- */

      if (
        Array.isArray(
          performanceResponse
        )
      ) {
        records =
          performanceResponse;
      }


      /* -----------------------------------------------
         { performances: [] }
         BACKEND RESPONSE FORMAT
      ----------------------------------------------- */
      else if (
        Array.isArray(
          performanceResponse?.performances
        )
      ) {
        records =
          performanceResponse.performances;
      }


      /* -----------------------------------------------
         { performance: [] }
      ----------------------------------------------- */

      else if (
        Array.isArray(
          performanceResponse?.performance
        )
      ) {

        records =
          performanceResponse.performance;

      }


      /* -----------------------------------------------
         { records: [] }
      ----------------------------------------------- */

      else if (
        Array.isArray(
          performanceResponse?.records
        )
      ) {

        records =
          performanceResponse.records;

      }


      /* -----------------------------------------------
         { data: [] }
      ----------------------------------------------- */

      else if (
        Array.isArray(
          performanceResponse?.data
        )
      ) {

        records =
          performanceResponse.data;

      }


      setBackendPerformance(
        records
      );


    } catch (error) {

      console.error(
        "PERFORMANCE API FAILED:",
        error
      );


      /*
       * IMPORTANT:
       * No localStorage trend fallback.
       */

      setBackendPerformance([]);

    } finally {

      setPerformanceLoading(false);

    }


    /* ===================================================
       COMPLETE LOADING
    =================================================== */

    setLoadingMessage(
      "Dashboard updated."
    );


    setTimeout(() => {

      setDashboardLoading(false);

      setLoadingMessage("");

    }, 350);

  };


  /* =====================================================
     FIREBASE AUTH LISTENER
  ===================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (user) {

            loadDashboardData(
              user
            );

          } else {

            setDashboardLoading(
              false
            );

            setLoadingMessage(
              ""
            );

          }

        }
      );


    return () => {

      unsubscribe();

    };

  }, []);


  /* =====================================================
     LOCAL UI REFRESH
  ===================================================== */

  useEffect(() => {

    const refreshLocalData =
      () => {

        setLocalProgress(
          getLocalProgress()
        );


        setLastGame(
          getLastGame()
        );

      };


    refreshLocalData();


    window.addEventListener(
      "mindcareProgressUpdated",
      refreshLocalData
    );


    window.addEventListener(
      "storage",
      refreshLocalData
    );


    const timer =
      setInterval(
        refreshLocalData,
        1000
      );


    return () => {

      window.removeEventListener(
        "mindcareProgressUpdated",
        refreshLocalData
      );


      window.removeEventListener(
        "storage",
        refreshLocalData
      );


      clearInterval(
        timer
      );

    };

  }, []);


  /* =====================================================
     TOTAL GAMES
     
     Backend source of truth.
  ===================================================== */

  const totalGames =
    backendProgress &&
    backendProgress.totalGames !== undefined

      ? Number(
          backendProgress.totalGames
        ) || 0

      : 0;


  /* =====================================================
     AVERAGE ACCURACY
     
     Backend source of truth.
  ===================================================== */

  const backendAverageAccuracy =
    Number(
      backendProgress?.averageAccuracy
    );


  const averageAccuracy =
    backendProgress &&
    !Number.isNaN(
      backendAverageAccuracy
    )

      ? Math.round(
          backendAverageAccuracy
        )

      : 0;


  /* =====================================================
     GAME ACCURACY
     
     Derived from backend performance.
  ===================================================== */

 
  /* =====================================================
     GAME ACCURACY
     
     Derived from backend performance.
  ===================================================== */

  const getGameAccuracy = (gameType) => {
    const records = Array.isArray(backendPerformance)
      ? backendPerformance.filter(
          (record) =>
            String(record?.gameType || "")
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_") === gameType
        )
      : [];

    if (records.length === 0) {
      return 0;
    }

    const accuracies = records
      .map((record) => Number(record?.accuracy))
      .filter((value) => !Number.isNaN(value));

    if (accuracies.length === 0) {
      return 0;
    }

    const total = accuracies.reduce(
      (sum, value) => sum + value,
      0
    );

    return Math.round(total / accuracies.length);
  };


  /* =====================================================
     CURRENT LEVEL
  ===================================================== */

  const backendLevel =
    useMemo(() => {

      const levels =
        backendProgress?.currentLevel;


      if (
        !levels ||
        typeof levels !==
          "object"
      ) {

        return 1;

      }


      const values =
        Object.values(
          levels
        )
          .map(
            (value) =>
              Number(value)
          )
          .filter(
            (value) =>
              value > 0
          );


      if (
        !values.length
      ) {

        return 1;

      }


      return Math.max(
        ...values
      );

    }, [
      backendProgress
    ]);


  const displayLevel =
    Math.max(
      1,
      backendLevel
    );


  /* =====================================================
     XP
     
     Still local because backend progress does not
     currently return XP.
  ===================================================== */

  const XP_PER_LEVEL =
    500;


  const levelStartXP =
    (localProgress.level - 1) *
    XP_PER_LEVEL;


  const currentLevelXP =
    Math.max(
      0,
      localProgress.xp -
        levelStartXP
    );


  const xpPercentage =
    Math.min(
      (
        currentLevelXP /
        XP_PER_LEVEL
      ) * 100,
      100
    );


  const xpToNextLevel =
    Math.max(
      0,
      XP_PER_LEVEL -
        currentLevelXP
    );


  /* =====================================================
     GAME HISTORY
     
     Used for score because score totals are not currently
     returned by /progress.
  ===================================================== */

  let gameHistory =
    [];


  try {

    gameHistory =
      JSON.parse(
        localStorage.getItem(
          "gameHistory"
        ) || "[]"
      );

  } catch {

    gameHistory =
      [];

  }


  /* =====================================================
     TOTAL SCORE
  ===================================================== */

  const totalScore =
    gameHistory.reduce(

      (
        total,
        game
      ) => {

        return (
          total +
          Number(
            game.score || 0
          )
        );

      },

      0

    );


  /* =====================================================
     BEST SCORE
  ===================================================== */

  const bestScore =
    gameHistory.length > 0

      ? Math.max(

          ...gameHistory.map(

            (game) =>
              Number(
                game.score || 0
              )

          )

        )

      : 0;


  /* =====================================================
     LAST SCORE
  ===================================================== */

  const lastScore =
    lastGame
      ? Number(
          lastGame.score || 0
        )
      : 0;


  /* =====================================================
     AVERAGE RESPONSE TIME
  ===================================================== */

  const averageResponseTime =
    useMemo(() => {

      if (
        !backendPerformance.length
      ) {

        return 0;

      }


      const values =
        backendPerformance
          .map(
            (record) =>
              Number(
                record?.responseTimeSeconds ??
                record?.responseTime ??
                0
              )
          )
          .filter(
            (value) =>
              value > 0
          );


      if (
        !values.length
      ) {

        return 0;

      }


      const average =
        values.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        ) /
        values.length;


      return Number(
        average.toFixed(
          1
        )
      );

    }, [
      backendPerformance
    ]);


  /* =====================================================
     DAILY TREND
     
     BACKEND ONLY.
     
     Source:
     GET /performance/:userId
  ===================================================== */

  const trendData =
    useMemo(() => {

      const days = [];


      const today =
        new Date();


      /* -----------------------------------------------
         CREATE LAST 7 DAYS
      ----------------------------------------------- */

      for (
        let index = 6;
        index >= 0;
        index--
      ) {

        const date =
          new Date(
            today
          );


        date.setDate(
          today.getDate() -
          index
        );


        const year =
          date.getFullYear();


        const month =
          String(
            date.getMonth() + 1
          ).padStart(
            2,
            "0"
          );


        const day =
          String(
            date.getDate()
          ).padStart(
            2,
            "0"
          );


        days.push({

          date:
            `${year}-${month}-${day}`,

          label:
            date.toLocaleDateString(
              "en-US",
              {
                weekday:
                  "short"
              }
            ),

          values:
            []

        });

      }


      /* -----------------------------------------------
         PROCESS BACKEND RECORDS
      ----------------------------------------------- */

      backendPerformance.forEach(
        (record) => {

          const rawDate =
            record?.createdAt ??
            record?.timestamp ??
            record?.completedAt ??
            record?.date;


          if (
            !rawDate
          ) {

            return;

          }


          let date =
            null;


          /* ---------------------------------------------
             FIRESTORE TIMESTAMP
          --------------------------------------------- */

          if (
            typeof rawDate ===
            "object"
          ) {

            if (
              rawDate.seconds !==
              undefined
            ) {

              date =
                new Date(
                  Number(
                    rawDate.seconds
                  ) * 1000
                );

            } else if (
              rawDate._seconds !==
              undefined
            ) {

              date =
                new Date(
                  Number(
                    rawDate._seconds
                  ) * 1000
                );

            } else if (
              typeof rawDate.toDate ===
              "function"
            ) {

              date =
                rawDate.toDate();

            }

          }


          /* ---------------------------------------------
             STRING / NUMBER DATE
          --------------------------------------------- */

          if (
            !date &&
            (
              typeof rawDate ===
              "string" ||
              typeof rawDate ===
              "number"
            )
          ) {

            const parsed =
              new Date(
                rawDate
              );


            if (
              !Number.isNaN(
                parsed.getTime()
              )
            ) {

              date =
                parsed;

            }

          }


          if (
            !date ||
            Number.isNaN(
              date.getTime()
            )
          ) {

            return;

          }


          /* ---------------------------------------------
             LOCAL DATE KEY
          --------------------------------------------- */

          const year =
            date.getFullYear();


          const month =
            String(
              date.getMonth() + 1
            ).padStart(
              2,
              "0"
            );


          const day =
            String(
              date.getDate()
            ).padStart(
              2,
              "0"
            );


          const key =
            `${year}-${month}-${day}`;


          const target =
            days.find(
              (item) =>
                item.date ===
                key
            );


          if (
            !target
          ) {

            return;

          }


          /* ---------------------------------------------
             ADD ACCURACY
          --------------------------------------------- */

          const accuracy =
            Number(
              record?.accuracy
            );


          if (
            !Number.isNaN(
              accuracy
            )
          ) {

            target.values.push(
              accuracy
            );

          }

        }
      );


      /* -----------------------------------------------
         CALCULATE DAILY AVERAGES
      ----------------------------------------------- */

      return days.map(
        (day) => ({

          date:
            day.date,

          label:
            day.label,

          accuracy:
            day.values.length > 0

              ? Math.round(

                  day.values.reduce(

                    (
                      total,
                      value
                    ) =>
                      total + value,

                    0

                  ) /

                  day.values.length

                )

              : 0

        })
      );


    }, [
      backendPerformance
    ]);


  /* =====================================================
     CHART
  ===================================================== */

  const chartWidth =
    700;


  const chartHeight =
    300;


  const chartPoints =
    trendData.map(

      (
        item,
        index
      ) => {

        const x =
          (
            index /
            Math.max(
              trendData.length - 1,
              1
            )
          ) *
          chartWidth;


        const accuracy =
          Math.max(
            0,
            Math.min(
              100,
              Number(
                item.accuracy
              ) || 0
            )
          );


        const y =
          chartHeight -
          (
            accuracy /
            100
          ) *
          chartHeight;


        return {

          x,

          y,

          accuracy

        };

      }

    );


  /* =====================================================
     LINE POINTS
  ===================================================== */

  const linePoints =
    chartPoints
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");


  /* =====================================================
     AREA POINTS
  ===================================================== */

  const areaPoints =
    chartPoints.length > 0

      ? chartPoints
          .map(
            (point) =>
              `${point.x},${point.y}`
          )
          .join(" ") +

        ` ${chartWidth},${chartHeight} 0,${chartHeight}`

      : `0,${chartHeight} ${chartWidth},${chartHeight}`;


  /* =====================================================
     TODAY ACCURACY
  ===================================================== */

  const todayAccuracy =
    trendData.length > 0

      ? Number(
          trendData[
            trendData.length - 1
          ]?.accuracy || 0
        )

      : 0;


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );

      } catch (
        error
      ) {

        console.warn(
          "Logout error:",
          error
        );

      }


      localStorage.removeItem(
        "mindcareUser"
      );


      localStorage.removeItem(
        "firebaseIdToken"
      );


      localStorage.removeItem(
        "firebaseUserId"
      );


      localStorage.removeItem(
        "firebaseUserEmail"
      );


      navigate(
        "/"
      );

    };


  /* =====================================================
     DISMISS LAST RESULT
  ===================================================== */

  const dismissLastGame =
    () => {

      localStorage.removeItem(
        "lastGameResult"
      );


      setLastGame(
        null
      );

    };


  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (

    <div
      className="new-dashboard"
    >


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className="dashboard-sidebar"
      >

        {/* BRAND */}

        <div
          className="sidebar-brand"
        >

          <div
            className="brand-icon"
          >
            M
          </div>


          <div
            className="brand-text"
          >

            <h2>
              MindCare
            </h2>

            <span>
              Cognitive Training
            </span>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav
          className="sidebar-navigation"
        >

          <button
            className="sidebar-link active"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >

            <span
              className="sidebar-icon"
            >
              ⌂
            </span>

            <span>
              Dashboard
            </span>

          </button>


          <button
            className="sidebar-link"
            onClick={() =>
              navigate(
                "/games"
              )
            }
          >

            <span
              className="sidebar-icon"
            >
              🎮
            </span>

            <span>
              Games
            </span>

          </button>


          <button
            className="sidebar-link"
            onClick={() => {

              document
                .getElementById(
                  "performance-section"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth"
                });

            }}
          >

            <span
              className="sidebar-icon"
            >
              ↗
            </span>

            <span>
              Progress
            </span>

          </button>


          <button
            className="sidebar-link"
            onClick={() => {

              document
                .getElementById(
                  "profile-section"
                )
                ?.scrollIntoView({
                  behavior:
                    "smooth"
                });

            }}
          >

            <span
              className="sidebar-icon"
            >
              ♙
            </span>

            <span>
              Profile
            </span>

          </button>

        </nav>


        {/* BOTTOM */}

        <div
          className="sidebar-bottom"
        >

          <button
            className="sidebar-link"
          >

            <span
              className="sidebar-icon"
            >
              ⚙
            </span>

            <span>
              Settings
            </span>

          </button>


          <button
            className="sidebar-link logout-link"
            onClick={
              handleLogout
            }
          >

            <span
              className="sidebar-icon"
            >
              ↪
            </span>

            <span>
              Log Out
            </span>

          </button>

        </div>

      </aside>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main
        className="dashboard-main"
      >


        {/* ==================================================
            HEADER
        ================================================== */}

        <header
          className="dashboard-top-header"
        >

          <div>

            <h1>
              Game Dashboard
            </h1>

            <p>
              Track your cognitive training performance
            </p>

          </div>


          <button
            className="top-play-button"
            onClick={() =>
              navigate(
                "/games"
              )
            }
          >

            <span>
              🎮
            </span>

            Play Now

          </button>

        </header>


        {/* ==================================================
            LOADING STATUS
        ================================================== */}

        {dashboardLoading && (

          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "14px 18px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap:
                "10px",

              border:
                "1px solid rgba(140,92,230,0.22)",

              borderRadius:
                "11px",

              background:
                "rgba(113,46,217,0.08)",

              color:
                "#c7bddb",

              fontSize:
                "11px",

              textAlign:
                "center"
            }}
          >

            <span
              style={{
                width:
                  "8px",

                height:
                  "8px",

                borderRadius:
                  "50%",

                background:
                  "#b979ff",

                display:
                  "inline-block",

                animation:
                  "mindcarePulse 1s infinite ease-in-out"
              }}
            />

            {loadingMessage}

          </div>

        )}


        {/* ==================================================
            BACKEND LOAD DETAILS
        ================================================== */}

        {!dashboardLoading &&
          (
            progressLoading ||
            performanceLoading
          ) && (

          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "10px 14px",

              border:
                "1px solid rgba(255,255,255,0.06)",

              borderRadius:
                "9px",

              background:
                "rgba(255,255,255,0.02)",

              color:
                "#8f96aa",

              fontSize:
                "10px",

              textAlign:
                "center"
            }}
          >

            {progressLoading &&
              performanceLoading
              ? "Fetching your progress and performance..."
              : progressLoading
                ? "Fetching your progress..."
                : "Loading performance history..."}

          </div>

        )}


        {/* ==================================================
            LAST GAME
        ================================================== */}

        {lastGame && (

          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "15px 20px",

              border:
                "1px solid rgba(142,63,255,0.35)",

              background:
                "rgba(104,42,198,0.15)",

              borderRadius:
                "12px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap:
                "15px",

              color:
                "#ffffff"
            }}
          >

            <div>

              <strong
                style={{
                  fontSize:
                    "15px"
                }}
              >

                🎉 Game Completed!

              </strong>


              <p
                style={{
                  margin:
                    "5px 0 0",

                  fontSize:
                    "12px",

                  color:
                    "#c4bfd8"
                }}
              >

                {lastGame.gameName}

                {" • "}

                Score:
                {" "}
                {lastGame.score}

                {" • "}

                Accuracy:
                {" "}
                {lastGame.accuracy}%

                {" • "}

                +{lastGame.earnedXP}
                {" XP"}

              </p>

            </div>


            <button
              onClick={
                dismissLastGame
              }

              style={{
                border:
                  "none",

                background:
                  "transparent",

                color:
                  "#aaa",

                fontSize:
                  "22px",

                cursor:
                  "pointer"
              }}
            >

              ×

            </button>

          </div>

        )}


        {/* ==================================================
            XP CARD
        ================================================== */}

        <section
          className="xp-card"
          id="profile-section"
        >

          <div
            className="xp-profile"
          >

            <div
              className="large-avatar"
            >

              {username
                .charAt(0)
                .toUpperCase()}

            </div>


            <div
              className="xp-information"
            >

              <h2>
                {username}
              </h2>


              <p
                className="level-text"
              >

                Level {displayLevel}

              </p>


              <div
                className="xp-progress-row"
              >

                <div
                  className="xp-progress"
                >

                  <div
                    className="xp-progress-fill"
                    style={{
                      width:
                        `${xpPercentage}%`
                    }}
                  />

                </div>


                <span>

                  {currentLevelXP}
                  {" / "}
                  {XP_PER_LEVEL}
                  {" XP"}

                </span>

              </div>


              <p
                style={{
                  marginTop:
                    "8px",

                  marginBottom:
                    "0",

                  fontSize:
                    "12px",

                  color:
                    "#d2c9e5"
                }}
              >

                {localProgress.xp}
                {" Total XP "}
                •{" "}
                {xpToNextLevel}
                {" XP to next level"}

              </p>

            </div>

          </div>


          <div
            className="xp-actions"
          >

            <button
              title="Settings"
            >
              ⚙
            </button>


            <button
              title="Log out"
              onClick={
                handleLogout
              }
            >
              ↪
            </button>

          </div>

        </section>


        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section
          className="dashboard-stats-grid"
        >


          {/* TOTAL GAMES */}

          <div
            className="dashboard-stat-card"
          >

            <div
              className="stat-card-header"
            >

              <span>
                Total Sessions
              </span>

              <div
                className="stat-icon stat-blue"
              >
                🎮
              </div>

            </div>


            <strong>
              {totalGames}
            </strong>


            <p
              className="stat-positive"
            >

              {totalGames === 0
                ? "Start your first game"
                : "Training sessions recorded"}

            </p>

          </div>


          {/* ACCURACY */}

          <div
            className="dashboard-stat-card"
          >

            <div
              className="stat-card-header"
            >

              <span>
                Average Accuracy
              </span>

              <div
                className="stat-icon stat-green"
              >
                ◎
              </div>

            </div>


            <strong>
              {averageAccuracy}%
            </strong>


            <p
              className="stat-positive"
            >

              {averageAccuracy === 0
                ? "No completed games yet"
                : "Across completed games"}

            </p>

          </div>


          {/* GAMES COMPLETED */}

          <div
            className="dashboard-stat-card"
          >

            <div
              className="stat-card-header"
            >

              <span>
                Games Completed
              </span>

              <div
                className="stat-icon stat-yellow"
              >
                🏆
              </div>

            </div>


            <strong>
              {totalGames}
            </strong>


            <p
              className="stat-positive"
            >

              {totalGames === 0
                ? "No games completed"
                : "Keep training"}

            </p>

          </div>


          {/* TOTAL SCORE */}

          <div
            className="dashboard-stat-card"
          >

            <div
              className="stat-card-header"
            >

              <span>
                Total Score
              </span>

              <div
                className="stat-icon stat-purple"
              >
                ⭐
              </div>

            </div>


            <strong>
              {totalScore}
            </strong>


            <p
              className="stat-positive"
            >

              {totalScore === 0
                ? "No score yet"
                : `Best score: ${bestScore}`}

            </p>

          </div>


        </section>


        {/* ==================================================
            LOWER GRID
        ================================================== */}

        <section
          className="dashboard-lower-grid"
          id="performance-section"
        >


          {/* =================================================
              PERFORMANCE TREND
          ================================================= */}

          <div
            className="trend-card"
          >

            <div
              className="dashboard-card-heading"
            >

              <div>

                <h2>
                  ↗ &nbsp;
                  Performance Trend
                </h2>


                <p>
                  Accuracy over the last 7 days
                </p>

              </div>


              <select
                className="chart-select"
                defaultValue="accuracy"
              >

                <option value="accuracy">
                  Accuracy
                </option>

                <option value="response">
                  Response Time
                </option>

                <option value="score">
                  Score
                </option>

              </select>

            </div>


            {/* BACKEND DATA MESSAGE */}

            {!dashboardLoading &&
              backendPerformance.length === 0 && (

              <div
                style={{
                  margin:
                    "12px 0",

                  padding:
                    "9px 12px",

                  border:
                    "1px solid rgba(255,255,255,0.06)",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(255,255,255,0.02)",

                  color:
                    "#777f94",

                  fontSize:
                    "10px",

                  textAlign:
                    "center"
                }}
              >

                No backend performance data yet.

              </div>

            )}


            {/* CHART */}

            <div
              className="chart-wrapper"
            >

              {/* Y AXIS */}

              <div
                className="chart-y-axis"
              >

                <span>
                  100%
                </span>

                <span>
                  75%
                </span>

                <span>
                  50%
                </span>

                <span>
                  25%
                </span>

                <span>
                  0%
                </span>

              </div>


              <div
                className="chart-container"
              >

                <div
                  className="chart-horizontal horizontal-100"
                />


                <div
                  className="chart-horizontal horizontal-75"
                />


                <div
                  className="chart-horizontal horizontal-50"
                />


                <div
                  className="chart-horizontal horizontal-25"
                />


                <svg
                  className="performance-svg"
                  viewBox="0 0 700 300"
                  preserveAspectRatio="none"
                >

                  {/* AREA */}

                  <polygon
                    points={
                      areaPoints
                    }
                    className="chart-area-fill"
                  />


                  {/* LINE */}

                  <polyline
                    points={
                      linePoints
                    }
                    className="chart-line-path"
                  />


                  {/* POINTS */}

                  {chartPoints.map(
                    (
                      point,
                      index
                    ) => (

                      <circle
                        key={
                          trendData[
                            index
                          ]?.date ||
                          index
                        }

                        cx={
                          point.x
                        }

                        cy={
                          point.y
                        }

                        r={
                          index ===
                          chartPoints.length - 1
                            ? 7
                            : 6
                        }

                        className="chart-point-svg"
                      />

                    )
                  )}

                </svg>


                {/* DAY LABELS */}

                <div
                  className="chart-x-axis"
                >

                  {trendData.map(
                    (
                      item
                    ) => (

                      <span
                        key={
                          item.date
                        }
                      >

                        {item.label}

                      </span>

                    )
                  )}

                </div>

              </div>

            </div>


            {/* TODAY VALUE */}

            <div
              style={{
                marginTop:
                  "24px",

                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                fontSize:
                  "11px",

                color:
                  "#777e96"
              }}
            >

              <span>
                Today's Accuracy
              </span>


              <strong
                style={{
                  color:
                    "#b77cff",

                  fontSize:
                    "14px"
                }}
              >

                {todayAccuracy}%

              </strong>

            </div>

          </div>


          {/* =================================================
              GAME PERFORMANCE
          ================================================= */}

          <div
            className="game-performance-card"
          >

            <div
              className="dashboard-card-heading"
            >

              <div>

                <h2>
                  ◎ &nbsp;
                  Game Performance
                </h2>


                <p>
                  Accuracy by game
                </p>

              </div>

            </div>


            <div
              className="game-performance-list"
            >

              {games.map(
                (
                  game
                ) => (

                  <div
                    className="performance-game-row"
                    key={
                      game.name
                    }
                  >

                    <div
                      className={
                        `performance-game-icon ${game.color}-game`
                      }
                    >

                      {game.shortIcon}

                    </div>


                    <div
                      className="performance-game-content"
                    >

                      <div
                        className="performance-game-title-row"
                      >

                        <span>
                          {game.name}
                        </span>


                        <strong>

                          {game.accuracy > 0
                            ? `${game.accuracy}%`
                            : "Not played"}

                        </strong>

                      </div>


                      <div
                        className="game-accuracy-track"
                      >

                        <div
                          className={
                            `game-accuracy-fill ${game.color}-game`
                          }

                          style={{
                            width:
                              `${game.accuracy}%`
                          }}

                        />

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </section>


        {/* ==================================================
            CONTINUE TRAINING
        ================================================== */}

        <section
          className="dashboard-games-section"
        >

          <div
            className="games-section-header"
          >

            <div>

              <p>
                COGNITIVE ACTIVITIES
              </p>

              <h2>
                Continue Training
              </h2>

            </div>


            <button
              onClick={() =>
                navigate(
                  "/games"
                )
              }
            >

              View All →

            </button>

          </div>


          <div
            className="dashboard-game-boxes"
          >

            {games.map(
              (
                game
              ) => (

                <div
                  className="dashboard-game-box"
                  key={
                    game.name
                  }
                >

                  <div
                    className="dashboard-game-box-icon"
                  >

                    {game.shortIcon}

                  </div>


                  <h3>
                    {game.name}
                  </h3>


                  <p>

                    {game.accuracy > 0
                      ? `Accuracy ${game.accuracy}%`
                      : "Not played yet"}

                  </p>


                  <button
                    onClick={() =>
                      navigate(
                        game.path
                      )
                    }
                  >

                    Play →

                  </button>

                </div>

              )
            )}

          </div>

        </section>


        {/* ==================================================
            PROGRESS SUMMARY
        ================================================== */}

        <section
          style={{
            marginTop:
              "24px",

            padding:
              "22px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius:
              "16px",

            background:
              "rgba(16,19,40,0.75)"
          }}
        >

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              marginBottom:
                "18px",

              gap:
                "15px",

              flexWrap:
                "wrap"
            }}
          >

            <div>

              <p
                style={{
                  margin:
                    "0 0 5px",

                  fontSize:
                    "10px",

                  letterSpacing:
                    "1.5px",

                  color:
                    "#918ba5"
                }}
              >

                PLAYER PROGRESS

              </p>


              <h2
                style={{
                  margin:
                    0,

                  fontSize:
                    "20px",

                  color:
                    "#ffffff"
                }}
              >

                Level {displayLevel}

              </h2>

            </div>


            <div
              style={{
                fontSize:
                  "13px",

                color:
                  "#aaa4b9"
              }}
            >

              {localProgress.xp}
              {" XP total"}

            </div>

          </div>


          {/* PROGRESS BAR */}

          <div
            style={{
              height:
                "9px",

              width:
                "100%",

              borderRadius:
                "20px",

              background:
                "rgba(255,255,255,0.08)",

              overflow:
                "hidden"
            }}
          >

            <div
              style={{
                width:
                  `${xpPercentage}%`,

                height:
                  "100%",

                borderRadius:
                  "20px",

                background:
                  "linear-gradient(90deg,#b33cff,#4d7dff)",

                transition:
                  "width 0.5s ease"
              }}
            />

          </div>


          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              marginTop:
                "9px",

              fontSize:
                "11px",

              color:
                "#8e899c"
            }}
          >

            <span>

              {currentLevelXP}
              {" / "}
              {XP_PER_LEVEL}
              {" XP"}

            </span>


            <span>

              {xpPercentage.toFixed(
                0
              )}

              %

            </span>

          </div>

        </section>


        {/* ==================================================
            RECENT RESULT
        ================================================== */}

        {lastGame && (

          <section
            style={{
              marginTop:
                "24px",

              padding:
                "22px",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius:
                "16px",

              background:
                "rgba(16,19,40,0.75)"
            }}
          >

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                marginBottom:
                  "18px"
              }}
            >

              <div>

                <p
                  style={{
                    margin:
                      "0 0 5px",

                    fontSize:
                      "10px",

                    letterSpacing:
                      "1.5px",

                    color:
                      "#918ba5"
                  }}
                >

                  LAST COMPLETED GAME

                </p>


                <h2
                  style={{
                    margin:
                      0,

                    fontSize:
                      "19px",

                    color:
                      "#ffffff"
                  }}
                >

                  {lastGame.gameName}

                </h2>

              </div>


              <span
                style={{
                  fontSize:
                    "24px"
                }}
              >

                ✓

              </span>

            </div>


            {/* RESULT VALUES */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",

                gap:
                  "12px"
              }}
            >

              {/* SCORE */}

              <div
                style={{
                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255,255,255,0.04)"
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 6px",

                    fontSize:
                      "10px",

                    color:
                      "#8f8a9d"
                  }}
                >

                  SCORE

                </p>


                <strong
                  style={{
                    fontSize:
                      "20px",

                    color:
                      "#ffffff"
                  }}
                >

                  {lastScore}

                </strong>

              </div>


              {/* ACCURACY */}

              <div
                style={{
                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255,255,255,0.04)"
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 6px",

                    fontSize:
                      "10px",

                    color:
                      "#8f8a9d"
                  }}
                >

                  ACCURACY

                </p>


                <strong
                  style={{
                    fontSize:
                      "20px",

                    color:
                      "#ffffff"
                  }}
                >

                  {lastGame.accuracy}%

                </strong>

              </div>


              {/* XP */}

              <div
                style={{
                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255,255,255,0.04)"
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 6px",

                    fontSize:
                      "10px",

                    color:
                      "#8f8a9d"
                  }}
                >

                  XP EARNED

                </p>


                <strong
                  style={{
                    fontSize:
                      "20px",

                    color:
                      "#ffffff"
                  }}
                >

                  +{lastGame.earnedXP}

                </strong>

              </div>


              {/* LEVEL */}

              <div
                style={{
                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255,255,255,0.04)"
                }}
              >

                <p
                  style={{
                    margin:
                      "0 0 6px",

                    fontSize:
                      "10px",

                    color:
                      "#8f8a9d"
                  }}
                >

                  LEVEL

                </p>


                <strong
                  style={{
                    fontSize:
                      "20px",

                    color:
                      "#ffffff"
                  }}
                >

                  {lastGame.level}

                </strong>

              </div>

            </div>

          </section>

        )}


        {/* ==================================================
            DISCLAIMER
        ================================================== */}

        <div
          className="dashboard-disclaimer"
        >

          ⓘ &nbsp;
          Performance metrics are for
          training progress only and are not
          medical diagnostic results.

        </div>


      </main>


      {/* ==================================================
          LOADING ANIMATION
          
          Added here so the dashboard loading indicator
          works without changing your App.css.
      ================================================== */}

      <style>
        {`
          @keyframes mindcarePulse {
            0% {
              opacity: 0.35;
              transform: scale(0.85);
            }

            50% {
              opacity: 1;
              transform: scale(1);
            }

            100% {
              opacity: 0.35;
              transform: scale(0.85);
            }
          }
        `}
      </style>

    </div>

  );

}


export default Dashboard;
