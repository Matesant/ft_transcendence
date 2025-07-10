# 🔐 Auth-Service

Handles user registration, login, and two-factor authentication (2FA).

## Base URL
```
http://localhost:3001/auth
```

## Authentication
All protected routes use cookie-based authentication. The authentication cookie is automatically set after successful login and sent with subsequent requests.

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
{ "success": true, "message": "Login successful. Cookie set." }
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
Verify the one-time code and set authentication cookie.

**Request**
```http
POST /auth/2fa/verify
Content-Type: application/json

{ "alias": "john", "code": "123456" }
```

**Response 200**
```json
{ "success": true, "message": "2FA verification successful. Cookie set." }
```

---

### 5. POST /auth/2fa/enable 🔐
Enable 2FA for the logged-in user.

**Request**
```http
POST /auth/2fa/enable
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
Content-Type: application/json

{ "alias": "john" }
```

**Response 200**
```json
{ "success": true, "message": "2FA disabled successfully." }
```
---

### 7. PATCH /auth/update-credentials 🔐

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
