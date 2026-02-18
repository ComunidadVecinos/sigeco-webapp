# Authentication API (`/api/auth`)

This module handles account access and session lifecycle.

> Related docs:
> - [API index](./README.md)
> - Swagger: `http://localhost/api/docs`

---

## Security model

- Signed cookie-based session (`sid`)
- No JWT / no bearer token in request headers
- Cookie attributes: `HttpOnly`, `Path=/`, `SameSite=Lax` (default), persistent (`Max-Age` from `SESSION_TTL_DAYS`)
- Cookie signature uses `SESSION_SECRET`
- Password change/reset invalidates previous sessions through auth versioning

---

## Available endpoints

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `GET /api/auth/me`
5. `POST /api/auth/change-password`
6. `POST /api/auth/forgot-password`

Not available in current backend:
- `PUT /api/auth/reset-password`
- `PUT /api/auth/delete-account`

---

## 1) POST `/api/auth/register`

Creates user and auto-login (sets `sid` cookie).

### Request

```http
Content-Type: application/json
```

```json
{
  "firstName": "Ana",
  "lastName": "Garcia",
  "email": "ana@ucm.es",
  "phone": "600 123 456",
  "password": "Password1"
}
```

Validation:
- `firstName`, `lastName`: required, non-empty
- `email`: required, valid email, must end with `@ucm.es`
- `phone`: optional, exactly 9 digits, spaces allowed (normalized before saving)
- `password`: required, min 8 chars, uppercase + lowercase + number

### Success

- `201 Created`
- `Set-Cookie: sid=...`

```json
{
  "id": "uuid",
  "firstName": "Ana",
  "lastName": "Garcia",
  "email": "ana@ucm.es",
  "phone": "600123456",
  "createdAt": "2026-02-15T18:43:20.088Z"
}
```

### Errors
- `400 VALIDATION_ERROR`
- `409 CONFLICT` (email already registered)
- `500 INTERNAL_ERROR`

---

## 2) POST `/api/auth/login`

Validates credentials and sets a new `sid` cookie.

### Request

```http
Content-Type: application/json
```

By email:

```json
{
  "email": "demo1@ucm.es",
  "password": "Sigeco-2026"
}
```

By phone (Spain 9 digits, spaces optional):

```json
{
  "phone": "600 000 001",
  "password": "Sigeco-2026"
}
```

### Success

- `200 OK`
- `Set-Cookie: sid=...`

```json
{
  "id": "uuid",
  "firstName": "Demo",
  "lastName": "UserOne",
  "email": "demo1@ucm.es",
  "phone": "+34600000001"
}
```

### Errors
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS`
- `500 INTERNAL_ERROR`

---

## 3) POST `/api/auth/logout`

Clears `sid` cookie.

### Request

```http
Content-Type: application/json
Cookie: sid=<signed_session_cookie>
```

### Success

- `200 OK`
- `Set-Cookie: sid=; Max-Age=0; ...`

```json
{
  "message": "Logged out successfully"
}
```

### Errors
- `500 INTERNAL_ERROR`

---

## 4) GET `/api/auth/me`

Returns authenticated user from `sid` cookie.

### Request

```http
Cookie: sid=<signed_session_cookie>
```

### Success

- `200 OK`

```json
{
  "id": "uuid",
  "firstName": "Demo",
  "lastName": "UserOne",
  "email": "demo1@ucm.es",
  "phone": "+34600000001"
}
```

### Errors
- `401 UNAUTHORIZED` (missing/invalid/expired cookie)
- `500 INTERNAL_ERROR`

---

## 5) POST `/api/auth/change-password`

Requires authenticated session. Updates password, invalidates previous sessions and clears current cookie.

### Request

```http
Content-Type: application/json
Cookie: sid=<signed_session_cookie>
```

```json
{
  "currentPassword": "OldPassword1",
  "newPassword": "NewPassword1",
  "confirmNewPassword": "NewPassword1"
}
```

Validation:
- `currentPassword`: required
- `newPassword`: same complexity as register
- `confirmNewPassword` must match `newPassword`

### Success

- `200 OK`
- `Set-Cookie: sid=; Max-Age=0; ...`

```json
{
  "message": "Password changed successfully. Please sign in again."
}
```

### Errors
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS` / `UNAUTHORIZED`
- `500 INTERNAL_ERROR`

---

## 6) POST `/api/auth/forgot-password`

Generates temporary password and sends it by email.

### Request

```http
Content-Type: application/json
```

```json
{
  "email": "demo1@ucm.es"
}
```

### Success

- `200 OK`

```json
{
  "message": "If the email exists, a new temporary password has been sent."
}
```

Same success message is returned for existing/non-existing emails (anti-enumeration).

### Errors
- `400 VALIDATION_ERROR`
- `500 INTERNAL_ERROR`

### Local MailPit

Emails are available at:
- `http://localhost:8025`

---

## Quick curl examples

```bash
# Login
curl -i -c cookie.txt -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo1@ucm.es","password":"Sigeco-2026"}'

# Me
curl -i -b cookie.txt http://localhost/api/auth/me

# Change password
curl -i -b cookie.txt -X POST http://localhost/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Sigeco-2026","newPassword":"NewPassword1","confirmNewPassword":"NewPassword1"}'

# Forgot password
curl -i -X POST http://localhost/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo1@ucm.es"}'

# Logout
curl -i -b cookie.txt -X POST http://localhost/api/auth/logout
```