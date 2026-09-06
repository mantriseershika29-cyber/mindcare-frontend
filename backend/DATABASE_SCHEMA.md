\# Dementia Cognitive Games Backend

\## Database Schema



\### 1. Users



Collection: `users`



Document ID: Auto-generated user ID.



Fields:



\- `name` - String

\- `age` - Number

\- `createdAt` - Timestamp

\- `updatedAt` - Timestamp



Example:



{

&#x20; "name": "Test User",

&#x20; "age": 65,

&#x20; "createdAt": "timestamp",

&#x20; "updatedAt": "timestamp"

}





\### 2. Sessions



Collection: `sessions`



Fields:



\- `userId` - String

\- `gameType` - String

\- `level` - Number

\- `startedAt` - Timestamp

\- `completedAt` - Timestamp

\- `durationSeconds` - Number



Allowed game types:



\- `pattern\_recall`

\- `sequencing`

\- `face\_name\_matching`

\- `object\_placement`



Example:



{

&#x20; "userId": "user123",

&#x20; "gameType": "pattern\_recall",

&#x20; "level": 1,

&#x20; "startedAt": "timestamp",

&#x20; "completedAt": "timestamp",

&#x20; "durationSeconds": 45

}





\### 3. Performance



Collection: `performance`



Fields:



\- `userId` - String

\- `sessionId` - String

\- `gameType` - String

\- `level` - Number

\- `score` - Number

\- `accuracy` - Number

\- `errors` - Number

\- `responseTimeSeconds` - Number

\- `createdAt` - Timestamp



Example:



{

&#x20; "userId": "user123",

&#x20; "sessionId": "session123",

&#x20; "gameType": "pattern\_recall",

&#x20; "level": 1,

&#x20; "score": 80,

&#x20; "accuracy": 80,

&#x20; "errors": 2,

&#x20; "responseTimeSeconds": 35,

&#x20; "createdAt": "timestamp"

}





\### 4. Difficulty



Collection: `difficultyLevels`



Document ID format:



`{gameType}\_level\_{level}`



There are currently 16 documents:



4 game types × 4 levels = 16 documents.



Game types:



\- `pattern\_recall`

\- `sequencing`

\- `face\_name\_matching`

\- `object\_placement`



Difficulty levels:



| Level | Label | Grid Size | Items | Time Limit | Distractors |

|------:|-------|----------:|------:|-----------:|------------:|

| 1 | Beginner | 2 | 4 | 90 sec | 0 |

| 2 | Easy | 3 | 6 | 75 sec | 1 |

| 3 | Moderate | 4 | 8 | 60 sec | 2 |

| 4 | Challenging | 5 | 10 | 45 sec | 3 |



Adaptive rules:



\- Promote if accuracy > 85%

\- Demote if accuracy < 50%





\### 5. Progress



Collection: `progress`



Document ID:



`userId`



The current API calculates progress from Performance records.



Fields returned:



\- `userId`

\- `totalGames`

\- `averageAccuracy`

\- `gameTypeBreakdown`

\- `currentLevel`



Example:



{

&#x20; "userId": "user123",

&#x20; "totalGames": 10,

&#x20; "averageAccuracy": 78.5,

&#x20; "gameTypeBreakdown": {

&#x20;   "pattern\_recall": 3,

&#x20;   "sequencing": 3,

&#x20;   "face\_name\_matching": 2,

&#x20;   "object\_placement": 2

&#x20; },

&#x20; "currentLevel": {

&#x20;   "pattern\_recall": 2,

&#x20;   "sequencing": 3,

&#x20;   "face\_name\_matching": 1,

&#x20;   "object\_placement": 2

&#x20; }

}

