# Voting API

> API index: [docs/api/README.md](./README.md)

This module manages community votings and single-choice ballot submission.

Base path:

- `/api/communities/:communityId/voting`

---

## Overview

### What this module does

- Creates community votings with 2 to 5 options
- Lets community members vote once per voting
- Returns a paginated list with summary counters and per-option totals
- Lets admins close a voting manually
- Lets admins delete a voting
- Synchronizes each voting with one automatic calendar reminder

### What frontend should know first

- All endpoints require an authenticated session
- Votings belong to one community and are scoped by `communityId`
- Suspended members can list and vote, but cannot create, close or delete
- Each voting has one `title`, optional `description`, and options with only `title`
- Voting status is computed by backend as `OPEN` or `CLOSED`

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `POST /api/communities/:communityId/voting` | Active admin in that community |
| `GET /api/communities/:communityId/voting` | Membership in that community |
| `POST /api/communities/:communityId/voting/:votingId/vote` | Membership in that community |
| `POST /api/communities/:communityId/voting/:votingId/close` | Active admin in that community |
| `DELETE /api/communities/:communityId/voting/:votingId` | Active admin in that community |

Important:

- Community membership access includes suspended members
- Administrative access requires `PRESIDENT` or `VICE_PRESIDENT` and the membership must not be currently suspended
- A member can cast only one vote per voting

---

## Common response shapes

### Creator summary

```json
{
  "membershipId": "uuid",
  "alias": "Verónica Vicepresidenta",
  "role": "VICE_PRESIDENT"
}
```

### Voting option summary

```json
{
  "id": "uuid",
  "title": "Aprobar presupuesto",
  "votes": 12
}
```

### Voting item

Used by create and list responses.

```json
{
  "id": "uuid",
  "title": "Renovación de la piscina",
  "description": "Selecciona una de las propuestas",
  "creator": {
    "membershipId": "uuid",
    "alias": "Verónica Vicepresidenta",
    "role": "VICE_PRESIDENT"
  },
  "createdAt": "2026-03-30T18:00:00.000Z",
  "startsAt": "2026-03-30T18:00:00.000Z",
  "endDate": "2026-04-10",
  "endTime": "20:00",
  "status": "OPEN",
  "totalVotes": 15,
  "possibleVoters": 42,
  "myVoteOptionId": "uuid",
  "options": [
    {
      "id": "uuid",
      "title": "Opción A",
      "votes": 9
    },
    {
      "id": "uuid",
      "title": "Opción B",
      "votes": 6
    }
  ]
}
```

Notes:

- `description` may be `null`
- `myVoteOptionId` may be `null`
- `status` is one of `OPEN` or `CLOSED`

### Voting summary counters

```json
{
  "total": 12,
  "open": 4,
  "closed": 8
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/voting` | Create a voting |
| `GET` | `/api/communities/:communityId/voting` | List votings with pagination and summary |
| `POST` | `/api/communities/:communityId/voting/:votingId/vote` | Submit one vote |
| `POST` | `/api/communities/:communityId/voting/:votingId/close` | Close a voting manually |
| `DELETE` | `/api/communities/:communityId/voting/:votingId` | Soft-delete a voting |

---

## 1. Create voting

`POST /api/communities/:communityId/voting`

Creates a new community voting and its automatic calendar reminder.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "title": "Renovación de la piscina",
  "description": "Selecciona una propuesta",
  "endDate": "2026-04-10",
  "endTime": "20:00",
  "options": [
    { "title": "Opción A" },
    { "title": "Opción B" }
  ]
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Required, trimmed text, max `160` |
| `description` | Optional, trimmed text, max `2000` |
| `endDate` | Required, valid date in `YYYY-MM-DD` |
| `endTime` | Required, `HH:mm` |
| `options` | Required array, min `2`, max `5` |
| `options[].title` | Required, trimmed text, max `160` |

Business rules:

- Caller must be an active admin in the community
- Suspended admins cannot create votings
- End date and time must be later than current backend time
- End date and time must be at least one full hour after the creation moment

### Success

- Status: `201 Created`

Returns one voting item.

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid body, invalid date/time, or option count outside `2..5` |

---

## 2. List votings

`GET /api/communities/:communityId/voting`

Returns the paginated votings of the target community plus global summary counters.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- membership access in the target community

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `8` |
| `status` | No | `open` or `closed` |

Behavior notes:

- Summary counters are always returned for the whole community scope, not just for the current page
- `possibleVoters` counts current non-ended community memberships, including suspended members
- Items are ordered by `createdAt` descending, then `id` ascending

### Success

- Status: `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Renovación de la piscina",
      "description": "Selecciona una propuesta",
      "creator": {
        "membershipId": "uuid",
        "alias": "Verónica Vicepresidenta",
        "role": "VICE_PRESIDENT"
      },
      "createdAt": "2026-03-30T18:00:00.000Z",
      "startsAt": "2026-03-30T18:00:00.000Z",
      "endDate": "2026-04-10",
      "endTime": "20:00",
      "status": "OPEN",
      "totalVotes": 15,
      "possibleVoters": 42,
      "myVoteOptionId": "uuid",
      "options": [
        {
          "id": "uuid",
          "title": "Opción A",
          "votes": 9
        },
        {
          "id": "uuid",
          "title": "Opción B",
          "votes": 6
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 8,
    "total": 12,
    "totalPages": 2
  },
  "summary": {
    "total": 12,
    "open": 4,
    "closed": 8
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid path or query params |

---

## 3. Submit vote

`POST /api/communities/:communityId/voting/:votingId/vote`

Registers the authenticated member's single choice.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "optionId": "uuid"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `optionId` | Required, UUID |

Business rules:

- Caller must belong to the community
- Suspended members can still vote
- `optionId` must belong to the target voting
- Only open votings accept votes
- Only one vote per user and voting is allowed

### Success

- Status: `200 OK`

```json
{
  "voted": true,
  "votingId": "uuid",
  "optionId": "uuid",
  "votedAt": "2026-03-31T09:30:00.000Z"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community or voting not found |
| `409` | `CONFLICT` | Voting is already closed or user has already voted |
| `422` | `VALIDATION_ERROR` | Invalid params/body or option does not belong to the voting |

---

## 4. Close voting

`POST /api/communities/:communityId/voting/:votingId/close`

Closes an open voting before its scheduled end and removes its pending calendar reminder.

### Request

Requires:

- valid `sid` cookie
- `communityId` and `votingId` as UUID path params
- active admin access in the target community

No request body.

### Success

- Status: `200 OK`

```json
{
  "closed": true,
  "votingId": "uuid",
  "closedAt": "2026-03-31T10:00:00.000Z"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Community or voting not found |
| `409` | `CONFLICT` | Voting is already closed or could not be closed |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 5. Delete voting

`DELETE /api/communities/:communityId/voting/:votingId`

Soft-deletes one voting and removes its linked calendar reminder.

### Request

Requires:

- valid `sid` cookie
- `communityId` and `votingId` as UUID path params
- active admin access in the target community

No request body.

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "votingId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Community or voting not found |
| `409` | `CONFLICT` | Voting could not be deleted due to current state |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## Calendar synchronization notes

When backend creates the automatic reminder event:

- title uses the same value as the voting title
- if voting ends at `01:00` or later, reminder starts one hour before
- if voting ends between `00:01` and `00:59`, reminder is clipped to `00:00`
- if voting ends exactly at `00:00`, reminder is created on the previous day from `23:00` to `23:59`

These rules exist only to stay compatible with the current calendar event model.

---

## Common voting error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User belongs to the community but is not an active admin for create/close/delete | `403` | `FORBIDDEN` |
| User does not belong to the community for list/vote | `403` | `FORBIDDEN` |
| Community or voting UUID is invalid | `422` | `VALIDATION_ERROR` |
| Voting not found or already deleted | `404` | `NOT_FOUND` |
| Voting already closed | `409` | `CONFLICT` |
| Duplicate vote | `409` | `CONFLICT` |
| Selected option does not belong to the voting | `422` | `VALIDATION_ERROR` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "optionId",
        "location": "body",
        "message": "La opción seleccionada no pertenece a esta votación"
      }
    ]
  }
}
```
