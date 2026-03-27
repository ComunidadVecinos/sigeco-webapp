# API Conventions

This document defines the conventions currently applied in the SIGECO backend.

> Back to API hub: [docs/api/README.md](./README.md)

---

## 1. Base path and format

- API base path: `/api`
- Payload format: JSON (`application/json`)
- Field naming in API payloads: `camelCase`
- Date format: ISO 8601 (UTC)

Examples:
- `GET /api/health`
- `POST /api/auth/login`

---

## 2. Authentication convention

Authentication is **stateful** (server-side sessions in backend memory).

- Session cookie name: `sid`
- Cookie attributes:
  - `HttpOnly`
  - `Path=/`
  - `SameSite` configurable (`lax` by default)
  - `Secure` configurable (`false` in local HTTP)
  - `Max-Age` from `SESSION_TTL_DAYS`

Protected endpoints require valid `sid` cookie. No bearer token is used.

---

## 3. Error response envelope

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      { "field": "email", "message": "email must be valid" }
    ]
  }
}
```

Notes:
- `details` is optional.
- Validation errors include field-level details.

---

## 4. CORS and credentials

CORS is configured with:
- explicit origins from `CORS_ORIGIN`
- `credentials: true`

Frontend requests for authenticated routes must use:

```ts
fetch(url, { credentials: 'include' })
```

---

## 5. HTTP status codes currently used

### Success codes

| Code | Used for |
|---|---|
| `200 OK` | Successful read/action (`login`, `logout`, `me`, `change-password`, `forgot-password`) |
| `201 Created` | Successful resource creation (`register`) |

### Error codes

| Code | Used for |
|---|---|
| `422 Unprocessable Entity` | Validation errors (`VALIDATION_ERROR`) |
| `401 Unauthorized` | Missing/invalid/expired session or invalid credentials |
| `404 Not Found` | Unknown route or missing resource (`NOT_FOUND`) |
| `409 Conflict` | Conflict on create/update (`CONFLICT`, e.g. duplicated email) |
| `500 Internal Server Error` | Unhandled/internal error (`INTERNAL_ERROR`) |

---

## 6. Application error codes currently used

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Invalid request payload |
| `UNAUTHORIZED` | Missing, invalid or expired session |
| `INVALID_CREDENTIALS` | Invalid login/current password |
| `CONFLICT` | Resource state conflict (e.g. email already registered) |
| `NOT_FOUND` | Route/resource not found |
| `INTERNAL_ERROR` | Unexpected server error |

---

## 7. OpenAPI reference

Interactive docs are available at:
- `http://localhost/api/docs`

The auth OpenAPI fragment currently documents the implemented endpoints in `auth.openapi.js`.
