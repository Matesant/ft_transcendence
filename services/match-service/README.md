# 🏓 Match-Service

Manages tournament creation, match rounds, scoring and advancement.

## Base URL
```
http://localhost:3002/match
```

## Authentication
All routes use cookie-based authentication. The authentication cookie is automatically sent with requests.

---

## Endpoints

### 1. POST /match 🔐
Create the first round.

**Request**
```http
POST /match
Content-Type: application/json

{ "players": ["alice","bob","carol"] }
```

**Response 200**
```json
{
  "matches": [
    { "player1": "bob", "player2": "alice" },
    { "wo": "carol" }
  ]
}
```

---

### 2. GET /match/next 🔐
Get the next pending match.

**Request**
```http
GET /match/next
```

**Response 200**
```json
{
  "match": {
    "id": 2,
    "player1": "bob",
    "player2": "alice",
    "status": "pending",
    "round": 1
  }
}
```

---

### 3. POST /match/score 🔐
Record match result; notifies user-service.

**Request**
```http
POST /match/score
Content-Type: application/json

{ "matchId": 2, "winner": "alice" }
```

**Behavior**  
- Updates `matches` table.  
- Sends two HTTP calls to user-service `/users/history`.

---

### 4. POST /match/advance 🔐
Generate the next round from winners.

**Request**
```http
POST /match/advance
```

**Response 200**
```json
{
  "round": 2,
  "matches": [
    { "player1": "alice", "player2": "carol" }
  ]
}
```

---

### 5. GET /match/tournament 🔐
Get all rounds and matches.

**Request**
```http
GET /match/tournament
```

**Response 200**
```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [ ... ]
    },
    {
      "round": 2,
      "matches": [ ... ]
    }
  ]
}
```
