# Voting API

> API index: [docs/api/README.md](./README.md)

Community votings (`COMMUNITY_VOTING`) with single-choice ballot submission.

Base path: `/api/communities/:communityId/voting`

---

## Key rules

- All endpoints require session
- Suspended members can list and vote
- Only active admins can create, close or delete votings
- All fields with time travel as **UTC ISO**
- `endsAt` replaces the old `endDate` + `endTime`

---

## Voting item

```json
{
  "id": "uuid",
  "title": "Renovación de la piscina",
  "description": "Selecciona una propuesta",
  "creator": {
    "alias": "Verónica Vicepresidenta"
  },
  "createdAt": "2026-03-30T18:00:00.000Z",
  "startsAt": "2026-03-30T18:00:00.000Z",
  "endsAt": "2026-04-10T18:00:00.000Z",
  "status": "OPEN",
  "totalVotes": 15,
  "possibleVoters": 42,
  "myVoteOptionId": "uuid",
  "options": [
    {
      "id": "uuid",
      "title": "Opción A",
      "votes": 9
    }
  ]
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/voting` | Create a voting |
| `GET` | `/api/communities/:communityId/voting` | List votings |
| `POST` | `/api/communities/:communityId/voting/:votingId/vote` | Submit one vote |
| `POST` | `/api/communities/:communityId/voting/:votingId/close` | Close a voting manually |
| `DELETE` | `/api/communities/:communityId/voting/:votingId` | Soft-delete a voting |

---

## 1. Create voting

`POST /api/communities/:communityId/voting`

```json
{
  "title": "Renovación de la piscina",
  "description": "Selecciona una propuesta",
  "endsAt": "2026-04-10T18:00:00.000Z",
  "options": [
    { "title": "Opción A" },
    { "title": "Opción B" }
  ]
}
```

Validation:

- `title`: required, max `160`
- `description`: optional, max `2000`
- `endsAt`: required UTC ISO instant
- `options`: min `2`, max `5`
- `options[].title`: required, max `160`

Business rules:

- `endsAt` must be later than current backend time
- `endsAt` must be at least one hour after creation
- backend interprets the reminder day in `Europe/Madrid`, but the API still uses UTC

---

## 2. List votings

`GET /api/communities/:communityId/voting`

Query params:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `8` |
| `status` | No | `open` or `closed` |

Success:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 8,
    "total": 0,
    "totalPages": 0
  },
  "summary": {
    "total": 0,
    "open": 0,
    "closed": 0
  }
}
```

---

## 3. Vote

`POST /api/communities/:communityId/voting/:votingId/vote`

```json
{
  "optionId": "uuid"
}
```

Success:

```json
{
  "voted": true,
  "votingId": "uuid",
  "optionId": "uuid",
  "votedAt": "2026-03-31T09:30:00.000Z"
}
```

---

## 4. Close voting

`POST /api/communities/:communityId/voting/:votingId/close`

Success:

```json
{
  "closed": true,
  "votingId": "uuid",
  "closedAt": "2026-03-31T10:00:00.000Z"
}
```

---

## 5. Delete voting

`DELETE /api/communities/:communityId/voting/:votingId`

Success:

```json
{
  "deleted": true,
  "votingId": "uuid"
}
```

---

## Calendar projection

- backend builds the automatic reminder using the business timezone `Europe/Madrid`
- the public API still returns only UTC instants
- if a voting ends at business `00:00`, the reminder is projected to the previous business day

---

## Frontend notes

- send `endsAt` as UTC ISO
- render `createdAt`, `startsAt`, `endsAt`, `votedAt` and `closedAt` in `Europe/Madrid`
- do not rebuild `endDate` / `endTime`; the API no longer exposes them
