# Help API

> API index: [docs/api/README.md](./README.md)

This module exposes platform help content and community-specific help sections.

Base paths:

- `/api/help`
- `/api/communities/:communityId/help`

---

## Overview

### What this module does

- Returns global platform help for authenticated users
- Optionally combines global help with community-specific help
- Lets community administrators create, edit, delete and reorder help sections

### What frontend should know first

- All endpoints in this module require an authenticated session
- Community help read access requires membership in that community
- Community help write access requires active administrative access
- Responses always include `generalHelp`
- Community section lists are returned already ordered

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `GET /api/help/sections` | Authenticated user |
| `GET /api/help/sections?communityId=...` | Authenticated user with membership in that community |
| `GET /api/communities/:communityId/help/sections` | Authenticated user with membership in that community |
| `POST /api/communities/:communityId/help/sections` | Active admin in that community |
| `PATCH /api/communities/:communityId/help/sections/:sectionId` | Active admin in that community |
| `DELETE /api/communities/:communityId/help/sections/:sectionId` | Active admin in that community |
| `PUT /api/communities/:communityId/help/sections/order` | Active admin in that community |

Important:

- Community membership is enough for reading community help
- `PRESIDENT` and `VICE_PRESIDENT` can write only if their membership is operational
- Suspended memberships do not count as administrative access

---

## Common response shapes

### General help item

```json
{
  "key": "platform-overview",
  "title": "Cómo usar SIGECO",
  "description": "..."
}
```

Current static general help keys returned by backend:

- `platform-overview`
- `community-participation`
- `support-contact`

### Community help section

```json
{
  "id": "uuid",
  "title": "Normas internas",
  "description": "Descripción visible para los vecinos.",
  "sortOrder": 1
}
```

### Help sections response

All read endpoints return this shape:

```json
{
  "generalHelp": [
    {
      "key": "platform-overview",
      "title": "Cómo usar SIGECO",
      "description": "..."
    }
  ],
  "communityHelpSections": [
    {
      "id": "uuid",
      "title": "Normas internas",
      "description": "Descripción visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

If no community is requested, `communityHelpSections` is an empty array.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/help/sections` | Get general help, optionally combined with community help |
| `GET` | `/api/communities/:communityId/help/sections` | Get help for a specific community |
| `POST` | `/api/communities/:communityId/help/sections` | Create a community help section |
| `PATCH` | `/api/communities/:communityId/help/sections/:sectionId` | Update a community help section |
| `DELETE` | `/api/communities/:communityId/help/sections/:sectionId` | Delete a community help section |
| `PUT` | `/api/communities/:communityId/help/sections/order` | Reorder community help sections |

---

## 1. Get help sections

`GET /api/help/sections`

Returns global help for the platform. It can also include help for a specific community if `communityId` is sent as query param.

### Request

Requires:

- valid `sid` cookie
- optional `communityId` query param as UUID

Examples:

```http
GET /api/help/sections
```

```http
GET /api/help/sections?communityId=<communityId>
```

### Query params

| Param | Required | Rules |
|---|---|---|
| `communityId` | No | UUID |

### Success

- Status: `200 OK`

Without community:

```json
{
  "generalHelp": [
    {
      "key": "platform-overview",
      "title": "Cómo usar SIGECO",
      "description": "..."
    },
    {
      "key": "community-participation",
      "title": "Participación en la comunidad",
      "description": "..."
    },
    {
      "key": "support-contact",
      "title": "Soporte y seguimiento",
      "description": "..."
    }
  ],
  "communityHelpSections": []
}
```

With community:

```json
{
  "generalHelp": [
    {
      "key": "platform-overview",
      "title": "Cómo usar SIGECO",
      "description": "..."
    }
  ],
  "communityHelpSections": [
    {
      "id": "uuid",
      "title": "Normas internas",
      "description": "Descripción visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to requested community |
| `404` | `NOT_FOUND` | Community does not exist |
| `422` | `VALIDATION_ERROR` | Invalid `communityId` query param |

### Frontend notes

- This route is authenticated even when fetching only global help
- Community help is only returned when `communityId` is provided and accessible

---

## 2. Get community help sections

`GET /api/communities/:communityId/help/sections`

Returns the same response shape as the public help route, but the target community is taken from the URL.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- membership in that community

### Success

- Status: `200 OK`

```json
{
  "generalHelp": [
    {
      "key": "platform-overview",
      "title": "Cómo usar SIGECO",
      "description": "..."
    }
  ],
  "communityHelpSections": [
    {
      "id": "uuid",
      "title": "Normas internas",
      "description": "Descripción visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid `communityId` path param |

---

## 3. Create community help section

`POST /api/communities/:communityId/help/sections`

Creates a new community help section and returns both the created section and the full updated ordered collection.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "title": "Normas internas",
  "description": "Descripción visible para los vecinos."
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Required, trimmed, max 160 |
| `description` | Required, trimmed, non-empty |

Additional rules:

- Request body is strict: unknown fields are rejected
- A community can have at most `8` active help sections

### Success

- Status: `201 Created`

```json
{
  "created": true,
  "section": {
    "id": "uuid",
    "title": "Normas internas",
    "description": "Descripción visible para los vecinos.",
    "sortOrder": 3
  },
  "sections": [
    {
      "id": "uuid",
      "title": "Normas internas",
      "description": "Descripción visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `409` | `CONFLICT` | Help section limit reached or section could not be created |
| `422` | `VALIDATION_ERROR` | Invalid body |

### Frontend notes

- New sections are appended at the end of the current ordered list
- The backend limit is `8` active sections per community

---

## 4. Update community help section

`PATCH /api/communities/:communityId/help/sections/:sectionId`

Updates one help section and returns the updated section plus the full ordered collection.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

Any non-empty subset of:

```json
{
  "title": "Normas actualizadas",
  "description": "Nuevo texto visible para los vecinos."
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Optional, trimmed, max 160 |
| `description` | Optional, trimmed, non-empty |

Additional rules:

- Request body is strict: unknown fields are rejected
- At least one editable field must be sent

### Success

- Status: `200 OK`

```json
{
  "updated": true,
  "section": {
    "id": "uuid",
    "title": "Normas actualizadas",
    "description": "Nuevo texto visible para los vecinos.",
    "sortOrder": 1
  },
  "sections": [
    {
      "id": "uuid",
      "title": "Normas actualizadas",
      "description": "Nuevo texto visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Section not found |
| `422` | `VALIDATION_ERROR` | Invalid body or invalid UUID params |

---

## 5. Delete community help section

`DELETE /api/communities/:communityId/help/sections/:sectionId`

Soft-deletes a section and returns the updated ordered collection.

### Request

Requires:

- valid `sid` cookie
- `communityId` and `sectionId` as UUID path params
- active admin access in that community

No request body.

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "sectionId": "uuid",
  "sections": [
    {
      "id": "uuid",
      "title": "Normas internas",
      "description": "Descripción visible para los vecinos.",
      "sortOrder": 1
    }
  ]
}
```

### Behavior notes

- The section is soft-deleted
- Remaining sections are re-sequenced so `sortOrder` stays contiguous starting at `1`

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Section not found |
| `409` | `CONFLICT` | Section could not be deleted or reordered afterwards |
| `422` | `VALIDATION_ERROR` | Invalid UUID params |

---

## 6. Reorder community help sections

`PUT /api/communities/:communityId/help/sections/order`

Reorders the active help sections of a community.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "sectionIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

### Validation rules

| Field | Rules |
|---|---|
| `sectionIds` | Required array of UUIDs |

Additional rules:

- Maximum `8` elements
- No duplicated IDs
- The request body is strict

### Backend consistency rules

The reorder request must contain the **full current set** of active community section IDs.

Backend returns conflict when:

- the list length does not match the current number of active sections
- any section cannot be updated consistently

Backend returns not found when:

- any provided ID does not belong to an active section in that community

### Success

- Status: `200 OK`

```json
{
  "reordered": true,
  "sections": [
    {
      "id": "uuid-2",
      "title": "Segunda sección",
      "description": "Descripción",
      "sortOrder": 1
    },
    {
      "id": "uuid-1",
      "title": "Primera sección",
      "description": "Descripción",
      "sortOrder": 2
    }
  ]
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | At least one section ID does not exist in current active set |
| `409` | `CONFLICT` | Provided order does not match current community state |
| `422` | `VALIDATION_ERROR` | Invalid body or duplicated IDs |

### Frontend notes

- Always send the complete current ordered set, not a partial subset
- Use the `sections` array returned by backend as the source of truth after reorder

---

## Common help error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User does not belong to requested community on read | `403` | `FORBIDDEN` |
| User is not an active admin on write | `403` | `FORBIDDEN` |
| Community or section UUID is invalid | `422` | `VALIDATION_ERROR` |
| Section not found | `404` | `NOT_FOUND` |
| Section limit reached | `409` | `CONFLICT` |
| Reorder payload does not match full active set | `409` | `CONFLICT` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "sectionIds",
        "location": "body",
        "message": "El campo sectionIds no puede contener valores duplicados"
      }
    ]
  }
}
```
