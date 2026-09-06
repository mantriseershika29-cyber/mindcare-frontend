# Dementia Cure App - API Contract

## Base URL

http://localhost:5000

---

## Authentication

Protected APIs require a Firebase ID token.

Request header:

Authorization: Bearer <Firebase_ID_Token>

If no token is provided:

Status: 401 Unauthorized

Response:

{
  "error": "No token provided"
}

If the token is invalid or expired:

Status: 401 Unauthorized

Response:

{
  "error": "Invalid or expired token"
}

---

# 1. Health Check

## GET /

Authentication: Not required

### Response

{
  "message": "Dementia backend is running"
}

---

# 2. Create User

## POST /users

Authentication: Not required

### Request Body

{
  "name": "Test User",
  "age": 65
}

### Success Response

Status: 201 Created

{
  "message": "User created successfully",
  "userId": "USER_ID"
}

---

# 3. Get Difficulty

## GET /difficulty/:gameType/:level

Authentication: Not required

### Example

GET /difficulty/pattern_recall/1

### Supported Game Types

- pattern_recall
- sequencing
- face_name_matching
- object_placement

### Example Response

{
  "gameType": "pattern_recall",
  "level": 1,
  "label": "Beginner",
  "gridSize": 2,
  "itemCount": 4,
  "timeLimitSeconds": 90,
  "distractorCount": 0
}

---

# 4. Create Session

## POST /sessions

Authentication: Required

### Request Headers

Authorization: Bearer <Firebase_ID_Token>

Content-Type: application/json

### Request Body

{
  "userId": "test-user",
  "gameType": "pattern_recall",
  "level": 1
}

### Optional Fields

{
  "startedAt": "2026-09-03T10:00:00Z",
  "completedAt": "2026-09-03T10:02:00Z",
  "durationSeconds": 120
}

### Success Response

Status: 201 Created

{
  "message": "Session created successfully",
  "sessionId": "SESSION_ID"
}

---

# 5. Get Session

## GET /sessions/:id

Authentication: Required

### Example

GET /sessions/SESSION_ID

### Success Response

{
  "sessionId": "SESSION_ID",
  "userId": "test-user",
  "gameType": "pattern_recall",
  "level": 1,
  "startedAt": "...",
  "completedAt": null,
  "durationSeconds": 0
}

### If Session Does Not Exist

Status: 404 Not Found

---

# 6. Record Performance

## POST /performance

Authentication: Required

### Request Headers

Authorization: Bearer <Firebase_ID_Token>

Content-Type: application/json

### Request Body

{
  "userId": "test-user",
  "sessionId": "SESSION_ID",
  "gameType": "pattern_recall",
  "level": 1,
  "score": 80,
  "accuracy": 80,
  "errors": 2,
  "responseTimeSeconds": 35
}

### Required Fields

- userId
- sessionId
- gameType
- level
- score
- accuracy

### Success Response

Status: 201 Created

{
  "message": "Performance recorded successfully",
  "performanceId": "PERFORMANCE_ID"
}

---

# 7. Get User Performance

## GET /performance/:userId

Authentication: Required

### Example

GET /performance/test-user

### Success Response

{
  "userId": "test-user",
  "count": 1,
  "performances": [
    {
      "performanceId": "PERFORMANCE_ID",
      "userId": "test-user",
      "sessionId": "SESSION_ID",
      "gameType": "pattern_recall",
      "level": 1,
      "score": 80,
      "accuracy": 80,
      "errors": 2,
      "responseTimeSeconds": 35
    }
  ]
}

---

# 8. Get User Progress

## GET /progress/:userId

Authentication: Required

### Example

GET /progress/test-user

### Success Response

{
  "userId": "test-user",
  "totalGames": 1,
  "averageAccuracy": 80,
  "gameTypeBreakdown": {
    "pattern_recall": 1
  },
  "currentLevel": {
    "pattern_recall": 1
  }
}

---

# Authentication Summary

| Endpoint | Method | Authentication |
|---|---|---|
| / | GET | Not required |
| /users | POST | Not required |
| /difficulty/:gameType/:level | GET | Not required |
| /sessions | POST | Required |
| /sessions/:id | GET | Required |
| /performance | POST | Required |
| /performance/:userId | GET | Required |
| /progress/:userId | GET | Required |

---

# Supported Game Types

- pattern_recall
- sequencing
- face_name_matching
- object_placement

---

# Difficulty Levels

| Level | Label | Grid Size | Items | Time Limit | Distractors |
|---|---|---:|---:|---:|---:|
| 1 | Beginner | 2 | 4 | 90 sec | 0 |
| 2 | Easy | 3 | 6 | 75 sec | 1 |
| 3 | Moderate | 4 | 8 | 60 sec | 2 |
| 4 | Challenging | 5 | 10 | 45 sec | 3 |

---

# Testing Status

The following APIs have been successfully tested with Firebase Authentication:

- POST /sessions - PASS
- GET /sessions/:id - PASS
- POST /performance - PASS
- GET /performance/:userId - PASS
- GET /progress/:userId - PASS

Unauthenticated request test:

POST /sessions

Result:

401 Unauthorized

{
  "error": "No token provided"
}

---

# Frontend Integration Flow

1. User logs in using Firebase Authentication.
2. Firebase provides an ID token.
3. Frontend sends the ID token with protected API requests.
4. Backend verifies the token using verifyToken.
5. Backend reads or writes data in Firestore.
6. Backend returns a JSON response.

Flow:

User Login
    ↓
Firebase Authentication
    ↓
Firebase ID Token
    ↓
Frontend API Request
    ↓
Authorization: Bearer <Firebase_ID_Token>
    ↓
Backend verifyToken
    ↓
Firestore
    ↓
JSON Response