# Dementia Cure App - API Contract

## Base URL

```text
http://localhost:5000
```

---

## Authentication

Protected APIs require a Firebase ID token.

### Request Header

```text
Authorization: Bearer <Firebase_ID_Token>
```

### No Token

**Status:** `401 Unauthorized`

```json
{
  "error": "No token provided"
}
```

### Invalid or Expired Token

**Status:** `401 Unauthorized`

```json
{
  "error": "Invalid or expired token"
}
```

---

# 1. Health Check

## GET `/`

Authentication: **Not required**

### Response

```json
{
  "message": "Dementia backend is running"
}
```

---

# 2. Create User

## POST `/users`

Authentication: **Not required**

### Request Body

```json
{
  "name": "Test User",
  "age": 65
}
```

### Success Response

**Status:** `201 Created`

```json
{
  "message": "User created successfully",
  "userId": "USER_ID"
}
```

---

# 3. Get Difficulty

## GET `/difficulty/:gameType/:level`

Authentication: **Not required**

### Example

```text
GET /difficulty/pattern_recall/1
```

### Supported Game Types

* `pattern_recall`
* `sequencing`
* `face_name_matching`
* `object_placement`

### Difficulty Levels

| Level | Label       | Grid Size | Items | Time Limit | Distractors |
| ----: | ----------- | --------: | ----: | ---------: | ----------: |
|     1 | Beginner    |         2 |     4 |     90 sec |           0 |
|     2 | Easy        |         3 |     6 |     75 sec |           1 |
|     3 | Moderate    |         4 |     8 |     60 sec |           2 |
|     4 | Challenging |         5 |    10 |     45 sec |           3 |

### Example Response

```json
{
  "gameType": "pattern_recall",
  "level": 1,
  "label": "Beginner",
  "gridSize": 2,
  "itemCount": 4,
  "timeLimitSeconds": 90,
  "distractorCount": 0
}
```

---

# 4. Create Session

## POST `/sessions`

Authentication: **Required**

### Request Headers

```text
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json
```

### Request Body

```json
{
  "userId": "USER_ID",
  "gameType": "pattern_recall",
  "level": 1
}
```

### Optional Fields

```json
{
  "startedAt": "2026-09-03T10:00:00Z",
  "completedAt": "2026-09-03T10:02:00Z",
  "durationSeconds": 120
}
```

### Success Response

**Status:** `201 Created`

```json
{
  "message": "Session created successfully",
  "sessionId": "SESSION_ID"
}
```

---

# 5. Get Session

## GET `/sessions/:id`

Authentication: **Required**

### Example

```text
GET /sessions/SESSION_ID
```

### Success Response

```json
{
  "sessionId": "SESSION_ID",
  "userId": "USER_ID",
  "gameType": "pattern_recall",
  "level": 1,
  "startedAt": "...",
  "completedAt": null,
  "durationSeconds": 0
}
```

### If Session Does Not Exist

**Status:** `404 Not Found`

---

# 6. Record Performance

## POST `/performance`

Authentication: **Required**

### Request Headers

```text
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json
```

### Request Body

```json
{
  "userId": "USER_ID",
  "sessionId": "SESSION_ID",
  "gameType": "pattern_recall",
  "level": 1,
  "score": 80,
  "accuracy": 80,
  "errors": 2,
  "responseTimeSeconds": 35
}
```

### Required Fields

* `userId`
* `sessionId`
* `gameType`
* `level`
* `score`
* `accuracy`

### Success Response

**Status:** `201 Created`

```json
{
  "message": "Performance recorded successfully",
  "performanceId": "PERFORMANCE_ID"
}
```

---

# 7. Get User Performance

## GET `/performance/:userId`

Authentication: **Required**

### Example

```text
GET /performance/USER_ID
```

### Success Response

```json
{
  "userId": "USER_ID",
  "count": 1,
  "performances": [
    {
      "performanceId": "PERFORMANCE_ID",
      "userId": "USER_ID",
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
```

---

# 8. Get User Progress

## GET `/progress/:userId`

Authentication: **Required**

Progress is calculated dynamically from the user's performance records.

### Example

```text
GET /progress/USER_ID
```

### Success Response

```json
{
  "userId": "USER_ID",
  "totalGames": 1,
  "averageAccuracy": 80,
  "gameTypeBreakdown": {
    "pattern_recall": 1
  },
  "currentLevel": {
    "pattern_recall": 1
  }
}
```

---

# 9. Calculate Adaptive Next Level

## POST `/adaptive/next-level`

Authentication: **Required**

This API calculates the next difficulty level based on the user's current level and accuracy.

### Request Headers

```text
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json
```

### Request Body

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 90
}
```

### Adaptive Rules

* Accuracy greater than `85%` → Promote one level
* Accuracy less than `50%` → Demote one level
* Accuracy from `50%` to `85%` → Keep the same level
* Minimum level → `1`
* Maximum level → `4`

### Example Response

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 90,
  "nextLevel": 3
}
```

### Example: Keep Level

Request:

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 70
}
```

Response:

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 70,
  "nextLevel": 2
}
```

### Example: Demote Level

Request:

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 40
}
```

Response:

```json
{
  "gameType": "pattern_recall",
  "currentLevel": 2,
  "accuracy": 40,
  "nextLevel": 1
}
```

---

# Authentication Summary

| Endpoint                       | Method | Authentication |
| ------------------------------ | ------ | -------------- |
| `/`                            | GET    | Not required   |
| `/users`                       | POST   | Not required   |
| `/users/:id`                   | GET    | Not required   |
| `/difficulty/:gameType/:level` | GET    | Not required   |
| `/sessions`                    | POST   | Required       |
| `/sessions/:id`                | GET    | Required       |
| `/performance`                 | POST   | Required       |
| `/performance/:userId`         | GET    | Required       |
| `/progress/:userId`            | GET    | Required       |
| `/adaptive/next-level`         | POST   | Required       |

---

# Supported Game Types

* `pattern_recall`
* `sequencing`
* `face_name_matching`
* `object_placement`

---

# Adaptive Difficulty

```text
Accuracy > 85%
      ↓
Promote level
      ↓
Maximum level = 4


Accuracy 50% - 85%
      ↓
Keep current level


Accuracy < 50%
      ↓
Demote level
      ↓
Minimum level = 1
```

---

# Backend Integration Flow

```text
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
```

---

# Current Testing Status

### Successfully tested

* `GET /`
* `GET /difficulty/pattern_recall/2`
* `GET /difficulty/sequencing/2`
* `GET /difficulty/face_name_matching/2`
* `GET /difficulty/object_placement/2`
* `POST /users`
* Adaptive difficulty calculations
* Unauthenticated access protection for protected APIs

### Pending frontend integration testing

The following require a valid Firebase ID token from the frontend/authentication flow for complete end-to-end testing:

* `POST /sessions`
* `GET /sessions/:id`
* `POST /performance`
* `GET /performance/:userId`
* `GET /progress/:userId`
* `POST /adaptive/next-level`

---

# Notes

The `progress` collection is not currently stored separately in Firestore.

Progress is calculated dynamically from records in the `performance` collection by the `/progress/:userId` API.

The `users` collection currently uses an auto-generated Firestore document ID. Firebase UID ownership linking can be added during frontend authentication integration.
s