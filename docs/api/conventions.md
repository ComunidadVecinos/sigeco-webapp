# API Conventions

This document describes the shared rules implemented by the current SIGECO backend.

> Back to API hub: [docs/api/README.md](./README.md)

---

## 1. Base path and formats

- API base path: `/api`
- Default payload format: `application/json`
- Image uploads use `multipart/form-data`
- Field naming in payloads: `camelCase`
- Most identifiers are UUID strings

Examples:

- `GET /api/users/me`
- `GET /api/communities/:communityId/news`
- `POST /api/communities/:communityId/voting`
- `DELETE /api/communities/:communityId/news/:newsId/image`

---

## 2. Authentication

Authentication is stateful and cookie-based.

- Session cookie: `sid`
- No bearer token is used
- Protected routes require a valid session cookie
- Frontend requests must send credentials

Examples:

```ts
fetch('/api/users/me', { credentials: 'include' });
```

```ts
axios.get('/api/users/me', { withCredentials: true });
```

---

## 3. Success shape

There is no global success envelope like `{ data: ... }`.

Common maintained patterns:

### Single resource

```json
{
  "id": "uuid",
  "name": "Comunidad SIGECO"
}
```

### Paginated response

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
  "deleted": true,
  "newsId": "uuid"
}
```

---

## 4. Error shape

Handled errors use the same envelope:

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
- `location` can be `body`, `query`, `params` or `headers`

---

## 5. Status codes in use

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

## 6. Temporal contract

This is the shared rule that frontend must follow now:

- Every field with date **and** time travels as **ISO 8601 UTC**
- Fields that are only dates may still use `YYYY-MM-DD`
- Backend keeps `Europe/Madrid` only as internal business timezone

Examples of UTC instant fields:

- `createdAt`
- `updatedAt`
- `startsAt`
- `endsAt`
- `closedAt`
- `eventStartsAt`
- `eventEndsAt`
- `votedAt`

Examples of date-only fields:

- `month=YYYY-MM` in calendar month queries
- `from=YYYY-MM-DD` and `to=YYYY-MM-DD` when a module filters by business day

Frontend rule:

- parse every `...At` field as a real UTC instant
- display it in `Europe/Madrid`
- do not build UI logic from the browser timezone

---

## 7. Validation and normalization

Input validation is applied before controllers using Zod-based middleware.

Frontend should expect:

- UUID path params are validated
- Numeric query params such as `page` and `pageSize` are accepted as strings and normalized to numbers
- Optional text query params are trimmed
- Invalid JSON body returns `400`
- Schema validation failures return `422 VALIDATION_ERROR`

Common pagination defaults where supported:

- `page`: default `1`
- `pageSize`: default `10`
- `pageSize` maximum: `100`

---

## 8. File uploads

Current image upload endpoints use these patterns:

- Content type: `multipart/form-data`
- Allowed MIME types: `image/jpeg`, `image/png`
- Max size: `5 MB`

Current field names:

- `avatar` for user and community avatars
- `image` for optional news images on `POST/PATCH /api/communities/:communityId/news`

Some endpoints accept either JSON or multipart:

- `news` create/update accepts JSON when no image is sent
- the same endpoints accept multipart when an optional image is included

Image-bearing resources may also expose an explicit delete endpoint:

- `PUT` uploads or replaces the file reference
- `DELETE` removes the current file reference without deleting the parent resource

---

## 9. Practical frontend notes

- Always send credentials on protected routes
- Do not expect a global success wrapper
- Read and surface `error.message`; use `error.details` for field feedback
- Treat returned file URLs as already public
- Treat every ISO timestamp as UTC and format it in `Europe/Madrid`
