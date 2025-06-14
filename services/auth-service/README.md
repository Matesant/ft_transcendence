# 🔐 Auth-Service

Handles user registration, login, and two-factor authentication (2FA).

## Base URL
```
http://localhost:3001/auth
```

## Authentication Header
All protected routes require:
```
Authorization: Bearer <JWT>
```

---

## Endpoints

### 1. POST /auth/register
Register a new user.

**Request**
```http
POST /auth/register
Content-Type: application/json

{ "alias": "john", "email": "john@example.com", "password": "1234" }
```

**Response 201**
```json
{ "success": true, "alias": "john" }
```

---

### 2. POST /auth/login
Authenticate user. If 2FA is disabled, returns token. If enabled, prompts next step.

**Request**
```http
POST /auth/login
Content-Type: application/json

{ "alias": "john", "password": "1234" }
```

**Response (2FA off) 200**
```json
{ "token": "eyJ...XYZ" }
```

**Response (2FA on) 200**
```json
{ "require2FA": true, "alias": "john" }
```

---

### 3. POST /auth/2fa/request 🔐
Send a one-time code by email.

**Request**
```http
POST /auth/2fa/request
Content-Type: application/json

{ "alias": "john" }
```

**Response 200**
```json
{ "success": true, "message": "Code sent by email." }
```

---

### 4. POST /auth/2fa/verify 🔐
Verify the one-time code and receive JWT.

**Request**
```http
POST /auth/2fa/verify
Content-Type: application/json

{ "alias": "john", "code": "123456" }
```

**Response 200**
```json
{ "token": "eyJ...ABC" }
```

---

### 5. POST /auth/2fa/enable 🔐
Enable 2FA for the logged-in user.

**Request**
```http
POST /auth/2fa/enable
Authorization: Bearer <JWT>
Content-Type: application/json

{ "alias": "john" }
```

**Response 200**
```json
{ "success": true, "message": "2FA enabled successfully." }
```

---

### 6. POST /auth/2fa/disable 🔐
Disable 2FA for the logged-in user.

**Request**
```http
POST /auth/2fa/disable
Authorization: Bearer <JWT>
Content-Type: application/json

{ "alias": "john" }
```

**Response 200**
```json
{ "success": true, "message": "2FA disabled successfully." }
```
