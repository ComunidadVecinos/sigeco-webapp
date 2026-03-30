# API Conventions

This document describes the cross-cutting API conventions currently implemented in the SIGECO backend.

> Back to API hub: [docs/api/README.md](./README.md)

---

## 1. Base path and payload formats

- API base path: `/api`
- Default payload format: `application/json`
- File uploads currently use `multipart/form-data`
- Field naming in payloads: `camelCase`
- Most identifiers are UUID strings
- Datetime fields are usually returned as ISO 8601 strings
- Some business-date fields use `YYYY-MM-DD`
- Some time-only fields use `HH:mm`

Examples:

- `GET /api/users/me`
- `GET /api/communities/:communityId/members`
- `PUT /api/users/me/avatar`

---

## 2. Authentication and credentials

Authentication is stateful and cookie-based.

- Session cookie name: `sid`
- No bearer token is used
- Protected routes require a valid session cookie
- Frontend requests must send credentials

Frontend examples:

```ts
fetch('/api/users/me', { credentials: 'include' });
```

```ts
axios.get('/api/users/me', { withCredentials: true });
```

If the session is missing, invalid or expired, the backend responds with `401 UNAUTHORIZED`.

---

## 3. Success response shape

There is no global success envelope such as `{ data: ... }`.

Each endpoint returns its domain payload directly. Common patterns:

### Single resource or summary

```json
{
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO"
  }
}
```

### List response with pagination

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Action result

```json
{
  "expelled": true,
  "communityId": "uuid",
  "memberId": "uuid"
}
```

Some endpoints use top-level pagination fields instead:

```json
{
  "page": 1,
  "pageSize": 10,
  "total": 2,
  "items": []
}
```

Frontend should read each endpoint contract explicitly and not assume a shared `data` field inside the JSON body.
Frontend should also not assume a single pagination envelope across all modules.

---

## 4. Error response shape

All handled errors use the same envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "email",
        "location": "body",
        "message": "El correo electrónico no es válido"
      }
    ]
  }
}
```

Notes:

- `error.details` is optional
- Validation errors usually include `field`, `location` and `message`
- `location` can be `body`, `query`, `params` or `headers`

---

## 5. HTTP status codes in use

| Status | Typical meaning |
|---|---|
| `200 OK` | Successful read or state change |
| `201 Created` | Resource created |
| `400 Bad Request` | Malformed JSON body |
| `401 Unauthorized` | Missing, invalid or expired session |
| `403 Forbidden` | Authenticated but without enough permissions |
| `404 Not Found` | Route or resource not found |
| `409 Conflict` | Business/state conflict |
| `413 Payload Too Large` | Uploaded file exceeds max size |
| `415 Unsupported Media Type` | Uploaded file type is not allowed |
| `422 Unprocessable Entity` | Schema validation error |
| `500 Internal Server Error` | Unexpected backend failure |
| `502 Bad Gateway` | External email service failure |
| `503 Service Unavailable` | Storage layer unavailable |

---

## 6. Error codes commonly exposed

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Invalid request payload or query |
| `INTERNAL_ERROR` | Unexpected backend error handled by the global error layer |
| `UNAUTHORIZED` | Missing, invalid or expired session |
| `FORBIDDEN` | Authenticated user lacks required permissions |
| `NOT_FOUND` | Requested route or resource does not exist |
| `CONFLICT` | Business rule or uniqueness conflict |
| `INVALID_CREDENTIALS` | Login or password confirmation failed |
| `EMAIL_ALREADY_REGISTERED` | Email already exists |
| `PHONE_ALREADY_REGISTERED` | Phone already exists |
| `ACTIVE_COMMUNITY_INVALID` | Invalid active community payload |
| `ACTIVE_COMMUNITY_NOT_FOUND` | Selected active community does not exist |
| `CURRENT_PASSWORD_INVALID` | Current password is incorrect |
| `ACCOUNT_DELETION_EMAIL_MISMATCH` | Account deletion email does not match the authenticated user |
| `CONFIRMATION_TEXT_MISMATCH` | Confirmation text does not match |
| `FILE_TOO_LARGE` | Uploaded file exceeds limit |
| `FILE_TYPE_UNSUPPORTED` | Uploaded file type is not supported |
| `EMAIL_SERVICE_UNAVAILABLE` | Email sending failed |
| `STORAGE_UNAVAILABLE` | File storage operation failed |
| `ACCOUNT_DELETION_FAILED` | Account deletion could not be completed |

---

## 7. Validation and normalization rules

Input validation is applied before controllers using Zod-based middleware.

What frontend should expect:

- Path params such as `communityId`, `memberId` and `requestId` are validated as UUIDs
- Numeric query params such as `page` and `pageSize` are accepted as strings and normalized to numbers
- Optional text query params are trimmed; empty strings may be treated as missing values
- Date query params are validated before being parsed
- Some modules use fixed string formats for date-like fields, for example `YYYY-MM`, `YYYY-MM-DD` or `HH:mm`
- Invalid JSON body returns `400` with the standard error envelope
- Schema validation failures return `422 VALIDATION_ERROR`

Common pagination defaults where supported:

- `page`: default `1`
- `pageSize`: default `10`
- `pageSize` maximum: `100`

---

## 8. Common address summary shape

Several modules return address objects built from the same helper.

When an API field is documented as an address summary, frontend can expect this shape:

```json
{
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "streetNumberKm": "12",
  "block": null,
  "floor": null,
  "door": null,
  "formatted": "Calle Mayor 12"
}
```

Notes:

- `block`, `floor` and `door` may be `null`
- `formatted` is a UI-friendly summary string already prepared by backend

---

## 9. File upload conventions

Current avatar upload endpoints use the same pattern:

- Content type: `multipart/form-data`
- File field name: `avatar`
- Allowed MIME types: `image/jpeg`, `image/png`
- Max size: `5 MB`

Typical frontend example:

```ts
const formData = new FormData();
formData.append('avatar', file);

await axios.put('/api/users/me/avatar', formData, {
  withCredentials: true,
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

Uploaded files are later exposed as public URLs under `/uploads/...`, and the API may return those URLs as fields such as `profileImageUrl` or `avatarUrl`.

---

## 10. Practical frontend notes

- Always send credentials on protected routes.
- Do not expect a global response wrapper on success.
- Always read and surface `error.message`; use `error.details` for field-level form feedback.
- Treat returned date and time fields as strings and format them in frontend.
- Treat returned file/image URLs as already public and directly renderable.
