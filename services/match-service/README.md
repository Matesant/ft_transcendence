# 🏓 Match-Service

Manages tournament creation, match rounds, scoring and advancement.

## Base URL
```
http://localhost:3002/match
```

## Authentication Header
All routes require:
```
Authorization: Bearer <JWT>
```

---

## Endpoints

### 1. POST /match 🔐
Create the first round.

**Request**
```http
POST /match
Authorization: Bearer <JWT>
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
Authorization: Bearer <JWT>
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
Authorization: Bearer <JWT>
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
Authorization: Bearer <JWT>
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
Authorization: Bearer <JWT>
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

### 6. PATCH /auth/update-credentials 🔐

Allows a logged-in user to change their email and/or password.

**Request**  
```json
{
  "currentPassword": "1234",
  "newEmail": "novo@email.com",
  "newPassword": "abc123"
}

You can include either or both of newEmail and newPassword.
```
**Response 200**
```json
{
  "success": true,
  "message": "Credentials updated successfully."
}
```
