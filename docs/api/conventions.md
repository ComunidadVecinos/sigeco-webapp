# API Conventions

> API index: [docs/api/README.md](./README.md)

This page defines the shared documentation rules for the SIGECO backend API.

---

## 1. Base paths

- Global API base path: `/api`
- Community-scoped modules are mounted under `/api/communities/:communityId/...`
- Static uploaded assets are exposed under `/uploads/*`

Technical endpoints mounted directly by the application:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/uploads/*` | Public static file delivery when a payload references a stored asset |

---

## 2. Request and response formats

- Most endpoints use `application/json`
- File uploads use `multipart/form-data`
- Document binary delivery uses streamed file content
- Successful JSON responses do not use a universal envelope; each endpoint returns its own resource-specific payload

Typical success statuses:

| Status | Meaning |
|---|---|
| `200 OK` | Successful read, update, delete or custom action |
| `201 Created` | Successful resource creation |

---

## 3. Authentication model

Authentication is stateful and cookie-based.

| Item | Value |
|---|---|
| Session cookie | `sid` |
| Transport | `Set-Cookie` / `Cookie` headers |
| Cookie access | `HttpOnly` |
| Protected routes | Require a valid persisted session |

Modules document any additional access control on top of session validation, such as community membership, operational membership, ownership or administrative roles.

---

## 4. Error shape

All HTTP errors are normalized to the same structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "page",
        "location": "query",
        "message": "El campo page debe ser un entero positivo"
      }
    ]
  }
}
```

Notes:

- `details` is optional
- `details` is typically present on validation failures
- `location` usually identifies `body`, `query` or `params`

Common status families:

| Status | Typical meaning |
|---|---|
| `400` | Malformed request body, including malformed JSON |
| `401` | Missing, invalid or expired session |
| `403` | Authenticated actor lacks the required access |
| `404` | Resource not found or not visible |
| `409` | State conflict or forbidden transition |
| `413` | Uploaded file exceeds the allowed size |
| `415` | Uploaded file type is not supported |
| `422` | Semantic validation failed |
| `500+` | Internal or infrastructure failure |

---

## 5. Validation rules

- Route params, query params and request bodies are validated before controller execution
- Schemas are strict unless a module explicitly documents otherwise
- Unknown fields in strict JSON bodies are rejected
- Multipart endpoints may sanitize the text body and reject unsupported extra fields
- UUID, date and enum formats are validated at the HTTP boundary

---

## 6. Date and time rules

The API uses more than one temporal format depending on the module contract.

| Format | Example | Typical use |
|---|---|---|
| UTC ISO instant | `2026-04-10T17:30:00.000Z` | Timestamps and timestamped schedule fields |
| Business date | `2026-04-10` | Reservation dates and day-based filters |
| Business month | `2026-04` | Month calendar views |
| Time-only | `18:30` | Reservation slot boundaries |

Shared documentation rule:

- `createdAt`, `updatedAt`, `editedAt`, `startsAt`, `endsAt`, `closedAt`, `cancelledAt` and similar timestamp fields are documented as UTC ISO instants whenever they are present in the public contract
- Some modules evaluate day-based business rules in `Europe/Madrid` while still exposing UTC instants in their public payloads
- Reservations use `YYYY-MM-DD` and `YYYY-MM` for business-day and business-month filters

---

## 7. Pagination

When an endpoint is paginated, the response uses this shape:

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

Shared rules:

- Pagination is 1-based
- Query parameter names are `page` and `pageSize`
- The maximum allowed `pageSize` is documented per module, commonly `100`

Some modules add extra top-level properties such as `summary`, `community`, `storage` or `breadcrumbs`.

---

## 8. Uploads and public file URLs

- Image and document endpoints may return public URLs
- Image assets are usually exposed under `/uploads/...`
- Community documents are downloaded or streamed through `/api/communities/:communityId/documents/files/:documentId/content`
- Upload constraints such as allowed MIME types, binary signature checks, file size limits and quota checks are documented by each module

---

## 9. Documentation scope

- Module pages document concrete endpoint contracts, access rules and resource payloads
- This file documents only shared conventions
- The source of truth for route coverage is the application router and the corresponding module route files
