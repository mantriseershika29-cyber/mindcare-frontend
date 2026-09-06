import { auth } from "../firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";


/* =========================================================
   GET CURRENT FIREBASE USER TOKEN
========================================================= */

async function getAuthToken() {

  const user =
    auth.currentUser;


  if (!user) {

    throw new Error(
      "Please log in to continue."
    );

  }


  try {

    // Firebase automatically refreshes the token when needed
    const token =
      await user.getIdToken();


    if (!token) {

      throw new Error(
        "Authentication could not be completed."
      );

    }


    return token;

  } catch (error) {

    console.error(
      "Firebase token error:",
      error
    );
console.error("PERFORMANCE ERROR DETAILS:", JSON.stringify(data, null, 2));


    throw new Error(
      "Your login session has expired. Please log in again."
    );

  }

}


/* =========================================================
   USER-FRIENDLY HTTP ERROR MESSAGES
========================================================= */

function getFriendlyErrorMessage(
  status
) {

  switch (status) {

    /* =====================================================
       400 BAD REQUEST
    ===================================================== */

    case 400:

      return (
        "The request could not be processed. Please check your information and try again."
      );


    /* =====================================================
       401 UNAUTHORIZED
    ===================================================== */

    case 401:

      return (
        "Your login session is invalid or has expired. Please log in again."
      );


    /* =====================================================
       403 FORBIDDEN
    ===================================================== */

    case 403:

      return (
        "You do not have permission to perform this action."
      );


    /* =====================================================
       404 NOT FOUND
    ===================================================== */

    case 404:

      return (
        "The requested game or data could not be found."
      );


    /* =====================================================
       409 CONFLICT
    ===================================================== */

    case 409:

      return (
        "This request could not be completed right now. Please try again."
      );


    /* =====================================================
       500 INTERNAL SERVER ERROR
    ===================================================== */

    case 500:

      return (
        "The server encountered a problem. Please try again in a moment."
      );


    /* =====================================================
       502 BAD GATEWAY
       503 SERVICE UNAVAILABLE
       504 GATEWAY TIMEOUT
    ===================================================== */

    case 502:
    case 503:
    case 504:

      return (
        "The service is temporarily unavailable. Please try again shortly."
      );


    /* =====================================================
       UNKNOWN STATUS
    ===================================================== */

    default:

      return (
        "Something went wrong while processing your request. Please try again."
      );

  }

}


/* =========================================================
   COMMON API REQUEST
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  try {

    /* -----------------------------------------------------
       GET FIREBASE TOKEN
    ----------------------------------------------------- */

    const token =
      await getAuthToken();


    /* -----------------------------------------------------
       REQUEST HEADERS
    ----------------------------------------------------- */

    const headers = {

      "Content-Type":
        "application/json",

      ...(options.headers || {}),

      Authorization:
        `Bearer ${token}`

    };


    console.log(
      "API Request:",
      {
        url:
          `${API_BASE_URL}${endpoint}`,

        method:
          options.method || "GET",

        endpoint
      }
    );


    /* -----------------------------------------------------
       SEND REQUEST
    ----------------------------------------------------- */

    let response;


    try {

      response =
        await fetch(
          `${API_BASE_URL}${endpoint}`,
          {
            ...options,
            headers
          }
        );

    } catch (networkError) {

      /*
       * This catches cases such as:
       * backend not running
       * connection refused
       * network unavailable
       * CORS/network failure
       */

      console.error(
        "Network error:",
        networkError
      );


      throw new Error(
        "Unable to connect to the server. Please make sure the backend is running and try again."
      );

    }


    /* -----------------------------------------------------
       READ RESPONSE
    ----------------------------------------------------- */

    let data =
      null;


    try {

      data =
        await response.json();

    } catch {

      data =
        null;

    }


    /* -----------------------------------------------------
       HANDLE HTTP ERRORS
    ----------------------------------------------------- */

    if (
      !response.ok
    ) {

      /*
       * Keep the technical information in the browser
       * console for development/debugging.
       */

      console.error(
        "Backend Error:",
        {
          status:
            response.status,

          data
        }
      );


      /*
       * IMPORTANT:
       * Do NOT expose data.message or data.error
       * directly to the user.
       */

      const friendlyMessage =
        getFriendlyErrorMessage(
          response.status
        );


      throw new Error(
        friendlyMessage
      );

    }


    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    console.log(
      "API Response:",
      data
    );


    return data;

  } catch (error) {

    console.error(
      "API Error:",
      error
    );


    /*
     * Preserve our friendly Error message.
     */

    if (
      error instanceof Error
    ) {

      throw error;

    }


    /*
     * Final safety fallback.
     */

    throw new Error(
      "Something went wrong. Please try again."
    );

  }

}


/* =========================================================
   CREATE GAME SESSION
========================================================= */

export async function createSession(
  data
) {

  return apiRequest(
    "/sessions",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        )
    }
  );

}


/* =========================================================
   GET SINGLE SESSION
========================================================= */

export async function getSession(
  sessionId
) {

  return apiRequest(
    `/sessions/${sessionId}`,
    {
      method:
        "GET"
    }
  );

}


/* =========================================================
   SAVE GAME PERFORMANCE
========================================================= */

export async function savePerformance(data) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  return apiRequest("/performance", {
    method: "POST",
    body: JSON.stringify({
      userId: user.uid,
      sessionId: data.sessionId,
      gameType: data.gameType,
      level: Number(data.level),
      score: Number(data.score ?? data.finalScore ?? 0),
      accuracy: Number(
        data.accuracy ?? data.calculatedAccuracy ?? 0
      ),
      errors: Number(
        data.errors ?? data.finalErrors ?? 0
      ),
      responseTimeSeconds: Number(
        data.responseTimeSeconds ?? 0
      )
    })
  });
}
export async function getPerformance(userId) {
  return apiRequest(`/performance/${userId}`, {
    method: "GET"
  });
}

/* =========================================================
   GET USER PROGRESS
========================================================= */

export async function getProgress(
  userId
) {

  return apiRequest(
    `/progress/${userId}`,
    {
      method:
        "GET"
    }
  );

}


/* =========================================================
   GET GAME DIFFICULTY
========================================================= */

export async function getDifficulty(
  gameType,
  level
) {

  return apiRequest(
    `/difficulty/${gameType}/${level}`,
    {
      method:
        "GET"
    }
  );

}


/* =========================================================
   GET NEXT ADAPTIVE LEVEL
========================================================= */

export async function getNextLevel(
  gameType,
  currentLevel,
  accuracy
) {

  return apiRequest(
    "/adaptive/next-level",
    {
      method:
        "POST",

      body:
        JSON.stringify({

          gameType,

          currentLevel,

          accuracy

        })
    }
  );

}