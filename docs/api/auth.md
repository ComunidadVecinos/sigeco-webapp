# Authentication API

> API index: [docs/api/README.md](./README.md)

This module handles account registration, login/logout, password change and password reset.

Base path: `/api/auth`

---

## Session model

Authentication is stateful and cookie-based.

| Item | Value |
|---|---|
| Cookie name | `sid` |
| Transport | `Set-Cookie` response header |
| Cookie access | `HttpOnly` |
| Cookie path | `/` |
| `SameSite` | Configurable, default `lax` |
| `Secure` | Configurable, forced to `true` when `SameSite=none` |
| Session TTL | From `SESSION_TTL_DAYS` |

---

## Access context returned on login

After successful login, the API returns a `context` object that summarizes the user's current access state.

### `context.actorType`

Possible values:

| Value | Meaning |
|---|---|
| `RegisteredUserNoCommunity` | User has no active community membership |
| `StandardMember` | User is a normal community member |
| `DelegatedAdmin` | User is `VICE_PRESIDENT` |
| `PrincipalAdmin` | User is `PRESIDENT` |

### `context.activeMembership`

Returned as `null` when the user has no active membership.

When present:

```json
{
  "id": "uuid",
  "communityId": "uuid",
  "communityName": "Comunidad SIGECO",
  "role": "MEMBER",
  "alias": "Marta Miembro",
  "suspensionActive": false,
  "suspendedAt": null,
  "suspendedUntil": null,
  "suspensionReason": null
}
```

`activeMembership` is the resolved current context and may be `null`.

---

## Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/api/auth/registrations` | No | Register a new account |
| `POST` | `/api/auth/sessions` | No | Login and create session |
| `DELETE` | `/api/auth/sessions/current` | Yes | Logout current session |
| `POST` | `/api/auth/password/change` | Yes | Change current user's password |
| `POST` | `/api/auth/password/reset` | No | Reset password by email |

---

## 1. Register

`POST /api/auth/registrations`

Creates a user account. It does **not** log the user in.

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
  "password": "Password1!",
  "passwordConfirmation": "Password1!"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `firstName` | Required, trimmed, letters/spaces/apostrophe/hyphen only |
| `lastName` | Required, trimmed, letters/spaces/apostrophe/hyphen only |
| `email` | Required, valid email, normalized to lowercase |
| `phone` | Optional, 9 digits, spaces allowed, normalized before saving |
| `password` | Required, min 8 chars, at least one uppercase, one lowercase, one digit and one special char |
| `passwordConfirmation` | Required, must match `password` |

### Success

- Status: `201 Created`

```json
{
  "message": "Registro completado correctamente. Inicia sesión para continuar.",
  "email": "ana@ucm.es"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Body validation failed |
| `422` | `EMAIL_ALREADY_REGISTERED` | Email already exists |
| `422` | `PHONE_ALREADY_REGISTERED` | Phone already exists |

---

## 2. Login

`POST /api/auth/sessions`

Creates a new session and sets the `sid` cookie.

### Request

```http
Content-Type: application/json
```

Login accepts a single `identifier` field.
- If it contains `@`, it is treated as email
- Otherwise, it is treated as phone input

Example with email:

```json
{
  "identifier": "ana@ucm.es",
  "password": "Password1!"
}
```

Example with phone:

```json
{
  "identifier": "600 123 456",
  "password": "Password1!"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `identifier` | Required, non-empty string |
| `password` | Required, non-empty string |

### Success

- Status: `201 Created`
- Response sets `Set-Cookie: sid=...`

```json
{
  "user": {
    "id": "uuid",
    "firstName": "Ana",
    "lastName": "Garcia",
    "email": "ana@ucm.es",
    "phone": "600123456"
  },
  "context": {
    "actorType": "StandardMember",
    "activeMembership": {
      "id": "uuid",
      "communityId": "uuid",
      "communityName": "Comunidad SIGECO",
      "role": "MEMBER",
      "alias": "Ana",
      "suspensionActive": false,
      "suspendedAt": null,
      "suspendedUntil": null,
      "suspensionReason": null
    }
  },
  "session": {
    "expiresAt": "2026-03-28T20:15:00.000Z"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Missing `identifier` or `password` |
| `401` | `INVALID_CREDENTIALS` | Unknown user or wrong password |

## 3. Logout current session

`DELETE /api/auth/sessions/current`

Invalidates the persisted current session and clears the client cookie.

### Request

Requires valid `sid` cookie.

No request body.

### Success

- Status: `200 OK`
- Response clears `sid` cookie

```json
{
  "message": "Sesión cerrada correctamente."
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |

---

## 4. Change password

`POST /api/auth/password/change`

Changes the authenticated user's password.

Behavior:

- Requires authenticated session
- Validates current password
- Updates password hash
- Invalidates all other active sessions of the same user
- Keeps the current session alive

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "currentPassword": "Password1!",
  "newPassword": "NewPassword2!",
  "newPasswordConfirmation": "NewPassword2!"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `currentPassword` | Required |
| `newPassword` | Required, same complexity rules as registration |
| `newPasswordConfirmation` | Required, must match `newPassword` |

### Success

- Status: `200 OK`

```json
{
  "message": "Contraseña cambiada correctamente."
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `422` | `VALIDATION_ERROR` | Invalid body |
| `422` | `CURRENT_PASSWORD_INVALID` | Current password is wrong |
| `404` | `NOT_FOUND` | Authenticated user no longer exists |

---

## 5. Reset password

`POST /api/auth/password/reset`

Generates a temporary password and sends it by email when the account exists.

### Request

```http
Content-Type: application/json
```

```json
{
  "email": "ana@ucm.es"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `email` | Required, valid email, normalized to lowercase |

### Success

- Status: `200 OK`

```json
{
  "message": "Se ha enviado una nueva contraseña temporal."
}
```

### Behavior notes

- The endpoint returns the same success response whether the user exists or not
- Any valid email format is accepted
- If the user exists:
  - backend generates a temporary password
  - updates stored password
  - sends email
  - invalidates all active sessions for that user
- If email sending fails, backend restores the previous password state

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Invalid email format |
| `502` | `EMAIL_SERVICE_UNAVAILABLE` | Password reset email could not be sent |

---

## Common auth error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie on protected route | `401` | `UNAUTHORIZED` |
| Invalid or expired session cookie | `401` | `UNAUTHORIZED` |
| Wrong login credentials | `401` | `INVALID_CREDENTIALS` |
| Invalid request body | `422` | `VALIDATION_ERROR` |
| Malformed JSON body | `400` | `VALIDATION_ERROR` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "passwordConfirmation",
        "location": "body",
        "message": "Las contraseñas no coinciden"
      }
    ]
  }
}
```
