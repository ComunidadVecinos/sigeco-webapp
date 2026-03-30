# Calendar API

> API index: [docs/api/README.md](./README.md)

This module exposes the community calendar used by frontend month views and personal event management.

Base path: `/api/communities/:communityId/calendar`

---

## Overview

### What this module does

- Returns the visible events of a single calendar month for the active community context
- Lets an authenticated community member create, edit and delete their own personal events
- Mixes automatic community events and personal events in the same month response

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `GET /api/communities/:communityId/calendar` | Authenticated member of that community |
| `POST /api/communities/:communityId/calendar/personal` | Authenticated member of that community |
| `PATCH /api/communities/:communityId/calendar/personal/:eventId` | Authenticated member of that community and owner of the personal event |
| `DELETE /api/communities/:communityId/calendar/personal/:eventId` | Authenticated member of that community and owner of the personal event |

Important:

- All routes require a valid authenticated session cookie
- Administrative role is **not** required
- Suspended memberships still count as community membership access in this module
- Personal events are only visible and mutable for their owner
- Automatic events are visible to any member with access to the community

---

## Event model exposed to frontend

All public endpoints in this module use the same event DTO:

```json
{
  "id": "uuid",
  "title": "Reserva pista 2",
  "type": "RESERVATION",
  "date": "2026-04-10",
  "startTime": "18:00",
  "endTime": "19:00"
}
```

### Field notes

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Event UUID |
| `title` | `string` | Max length enforced on input: `160` |
| `type` | `string` | One of `PERSONAL`, `NEWS`, `RESERVATION`, `VOTING` |
| `date` | `string` | Date-only string in `YYYY-MM-DD` format |
| `startTime` | `string` | Time-only string in `HH:mm` format |
| `endTime` | `string` | Time-only string in `HH:mm` format |

### Visibility rules inside month responses

The month query returns:

- all automatic events of the requested community
- only the current member's personal events

It does **not** return personal events created by other members.

### Ordering

Month results are sorted by:

1. `date` ascending
2. `startTime` ascending
3. `endTime` ascending
4. creation order as backend tie-breaker

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/calendar?month=YYYY-MM` | Get the visible events of one calendar month |
| `POST` | `/api/communities/:communityId/calendar/personal` | Create a personal event |
| `PATCH` | `/api/communities/:communityId/calendar/personal/:eventId` | Update one owned personal event |
| `DELETE` | `/api/communities/:communityId/calendar/personal/:eventId` | Soft-delete one owned personal event |

---

## 1. Get month events

`GET /api/communities/:communityId/calendar?month=YYYY-MM`

Returns all visible events for the requested month in the target community.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- `month` query param in `YYYY-MM` format
- membership access in the target community

Example:

```http
GET /api/communities/9a7d3ef3-8d02-4e3d-8dc2-50a70f7a6a6a/calendar?month=2026-04
Cookie: sid=<session_cookie>
```

### Success

- Status: `200 OK`

```json
{
  "month": "2026-04",
  "content": [
    {
      "id": "uuid",
      "title": "Junta extraordinaria",
      "type": "NEWS",
      "date": "2026-04-03",
      "startTime": "19:00",
      "endTime": "20:00"
    },
    {
      "id": "uuid",
      "title": "Revisar acta",
      "type": "PERSONAL",
      "date": "2026-04-03",
      "startTime": "20:15",
      "endTime": "20:45"
    }
  ]
}
```

### Frontend notes

- `content` is already scoped to one month; there is no pagination
- The response may contain mixed event types
- Personal and automatic events share the same DTO
- Backend filters by community and by current member visibility before returning the list

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid `communityId` or invalid `month` format |

---

## 2. Create personal event

`POST /api/communities/:communityId/calendar/personal`

Creates a new personal event for the authenticated member in the target community.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "title": "Llamar al administrador",
  "date": "2026-04-12",
  "startTime": "10:00",
  "endTime": "10:30"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Required, trimmed text, max `160` |
| `date` | Required, valid calendar date in `YYYY-MM-DD` |
| `startTime` | Required, `HH:mm` |
| `endTime` | Required, `HH:mm` |

Additional rules:

- Request body is strict: unknown fields are rejected
- `startTime` must be earlier than `endTime`
- Event overlap is allowed

### Success

- Status: `201 Created`

```json
{
  "id": "uuid",
  "title": "Llamar al administrador",
  "type": "PERSONAL",
  "date": "2026-04-12",
  "startTime": "10:00",
  "endTime": "10:30"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid body, invalid date/time format, or invalid time range |

---

## 3. Update personal event

`PATCH /api/communities/:communityId/calendar/personal/:eventId`

Partially updates one owned personal event.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

Any non-empty subset of:

```json
{
  "title": "Llamar al presidente",
  "date": "2026-04-13",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Optional, trimmed text, max `160` |
| `date` | Optional, valid calendar date in `YYYY-MM-DD` |
| `startTime` | Optional, `HH:mm` |
| `endTime` | Optional, `HH:mm` |

Additional rules:

- Request body is strict: unknown fields are rejected
- At least one editable field must be sent
- If both `startTime` and `endTime` are sent together, `startTime` must be earlier than `endTime`
- If only one time field is sent, backend validates the final merged range against the stored value

### Success

- Status: `200 OK`

```json
{
  "id": "uuid",
  "title": "Llamar al presidente",
  "type": "PERSONAL",
  "date": "2026-04-13",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found or personal event not found / not owned by the caller |
| `409` | `CONFLICT` | Event existed but could not be updated due to invalid state |
| `422` | `VALIDATION_ERROR` | Invalid params, empty body, invalid date/time format, or invalid time range |

### Frontend notes

- Ownership is enforced by backend
- Frontend should treat `404` here as both "does not exist" and "not yours"

---

## 4. Delete personal event

`DELETE /api/communities/:communityId/calendar/personal/:eventId`

Soft-deletes one owned personal event.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- `eventId` path param as UUID
- membership access in the target community
- ownership of the target personal event

No request body.

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "eventId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found or personal event not found / not owned by the caller |
| `422` | `VALIDATION_ERROR` | Invalid `communityId` or `eventId` format |

### Frontend notes

- Deletion is soft-delete on backend
- After delete, the event will stop appearing in future month queries

---

## Common calendar error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User does not belong to the community | `403` | `FORBIDDEN` |
| Community UUID is valid but community does not exist | `404` | `NOT_FOUND` |
| Personal event does not exist or does not belong to the caller | `404` | `NOT_FOUND` |
| Invalid request body, params or query | `422` | `VALIDATION_ERROR` |
| Invalid time range (`startTime >= endTime`) | `422` | `VALIDATION_ERROR` |
| Personal event update failed after ownership check | `409` | `CONFLICT` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "startTime",
        "location": "body",
        "message": "La hora de inicio debe ser anterior a la hora de fin"
      }
    ]
  }
}
```

---

## Frontend integration notes

- Always send credentials on these routes
- Use the month endpoint as the main source for month view and day-detail UI derived from that month data
- Do not expect a public endpoint for automatic event CRUD
- Send and display `date` as `YYYY-MM-DD`
- Send and display `startTime` and `endTime` as `HH:mm`
- Do not assume personal events are shared with other members
