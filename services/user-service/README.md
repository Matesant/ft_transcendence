# User-Service API Documentation

This document describes the available routes in the **User-Service** microservice, which manages user profiles, avatars, friendships, and match history.

---

## Base URL

```
http://localhost:3003/users
```

---

## Authentication

All routes marked with 🔒 require the following header:

```
Authorization: Bearer <JWT>
```

---

## 1. Profile Endpoints

### 1.1 Create or Sync Profile

**POST** `/users/sync`

Creates or syncs a new user profile.

**Request**

```bash
curl -X POST http://localhost:3003/users/sync \
     -H "Content-Type: application/json" \
     -d '{ "alias": "alice" }'
```

**Response** (201 Created)

```json
{
  "success": true,
  "message": "User profile created for alice"
}
```

---

### 1.2 Get Own Profile 🔒

**GET** `/users/me`

Returns the authenticated user's profile.

**Request**

```bash
curl -X GET http://localhost:3003/users/me \
     -H "Authorization: Bearer <JWT>"
```

**Response** (200 OK)

```json
{
  "id": 1,
  "alias": "alice",
  "display_name": "Alice Wonder",
  "avatar": "uploads/alice-1618033988.png",
  "wins": 10,
  "losses": 3
}
```

---

### 1.3 Update Display Name 🔒

**PATCH** `/users/me`

Updates the authenticated user's `display_name`.

**Request**

```bash
curl -X PATCH http://localhost:3003/users/me \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "display_name": "Alice Liddell" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Display name updated"
}
```

Validation: `display_name` must be at least 2 characters.

---

### 1.4 Get Public Profile 🔒

**GET** `/users/:alias`

Retrieves a public profile by alias, including the last 10 matches.

**Request**

```bash
curl -X GET http://localhost:3003/users/bob \
     -H "Authorization: Bearer <JWT>"
```

**Response** (200 OK)

```json
{
  "profile": {
    "alias": "bob",
    "display_name": "Bob Builder",
    "avatar": "uploads/bob-1618033999.jpg"
  },
  "history": [
    { "opponent": "alice", "result": "win", "date": "2025-06-10T14:00:00Z" },
    // ... up to 10 records
  ]
}
```

---

## 2. Avatar Endpoints

### 2.1 Upload Avatar 🔒

**POST** `/users/avatar`

Uploads a JPG or PNG avatar image and updates the user's avatar.

**Request** (multipart/form-data)

```bash
curl -X POST http://localhost:3003/users/avatar \
     -H "Authorization: Bearer <JWT>" \
     -F "file=@/path/to/avatar.png"
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Avatar uploaded",
  "path": "uploads/alice-1618033988.png"
}
```

Supported MIME types: `image/jpeg`, `image/png`.

---

### 2.2 Select Avatar 🔒

**PATCH** `/users/avatar`

Sets an existing uploaded avatar by filename.

**Request**

```bash
curl -X PATCH http://localhost:3003/users/avatar \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "avatar": "alice-1618033988.png" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Avatar updated",
  "path": "uploads/alice-1618033988.png"
}
```

---

### 2.3 List Avatars

**GET** `/users/avatars`

Returns a list of all uploaded avatar filenames.

**Request**

```bash
curl -X GET http://localhost:3003/users/avatars
```

**Response** (200 OK)

```json
[
  "alice-1618033988.png",
  "bob-1618033999.jpg",
  // ...
]
```

---

## 3. Friendship Endpoints

### 3.1 Send Friend Request 🔒

**POST** `/users/friends/add`

Sends a friendship request to another user.

**Request**

```bash
curl -X POST http://localhost:3003/users/friends/add \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "friend": "bob" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Friend request sent to bob"
}
```

---

### 3.2 Accept Friend Request 🔒

**POST** `/users/friends/accept`

Accepts a pending friend request.

**Request**

```bash
curl -X POST http://localhost:3003/users/friends/accept \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "from": "bob" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

---

### 3.3 Reject Friend Request 🔒

**POST** `/users/friends/reject`

Rejects a pending friend request.

**Request**

```bash
curl -X POST http://localhost:3003/users/friends/reject \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "from": "bob" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Friend request from bob rejected"
}
```

---

### 3.4 Remove Friend 🔒

**POST** `/users/friends/remove`

Removes an existing friendship.

**Request**

```bash
curl -X POST http://localhost:3003/users/friends/remove \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{ "friend": "bob" }'
```

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Friendship with bob removed"
}
```

---

### 3.5 List Friends 🔒

**GET** `/users/friends`

Lists all friends (both pending and accepted).

**Request**

```bash
curl -X GET http://localhost:3003/users/friends \
     -H "Authorization: Bearer <JWT>"
```

**Response** (200 OK)

```json
{
  "friends": [
    { "alias": "bob", "status": "accepted" },
    // ...
  ]
}
```

---

### 3.6 List Pending Requests 🔒

**GET** `/users/friends/pending`

Lists incoming friend requests that are not yet accepted.

**Request**

```bash
curl -X GET http://localhost:3003/users/friends/pending \
     -H "Authorization: Bearer <JWT>"
```

**Response** (200 OK)

```json
{
  "pending": [
    { "alias": "carol" },
    // ...
  ]
}
```

---

## 4. Match History Endpoints

### 4.1 Log Match

**POST** `/users/history`

Logs a match result. This endpoint is intended for internal use by the Match-Service.

**Request**

```bash
curl -X POST http://localhost:3003/users/history \
     -H "Content-Type: application/json" \
     -d '{ "alias": "alice", "opponent": "bob", "result": "win" }'
```

Optional parameter: `date` (ISO 8601); defaults to current timestamp if omitted.

**Response** (200 OK)

```json
{
  "success": true,
  "message": "Match recorded"
}
```

---

### 4.2 Get Match History 🔒

**GET** `/users/history`

Retrieves the authenticated user's complete match history, sorted from newest to oldest.

**Request**

```bash
curl -X GET http://localhost:3003/users/history \
     -H "Authorization: Bearer <JWT>"
```

**Response** (200 OK)

```json
{
  "alias": "alice",
  "history": [
    { "opponent": "bob", "result": "wo", "date": "2025-06-12T10:00:00Z" },
    // ...
  ]
}
```

---
