# Voting API

> API index: [docs/api/README.md](./README.md)

Community votings with single-choice ballots.

Base path: `/api/communities/:communityId/voting`

## Access rules

- All endpoints require an authenticated session
- Suspended members can list votings and vote
- Only active administrators can create, close, or delete votings
- API timestamps are returned as UTC ISO instants

## Voting item shape

```json
{
  "id": "uuid",
  "title": "Pool renovation",
  "description": "Select one proposal",
  "creator": {
    "alias": "Vice President"
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
      "title": "Option A",
      "votes": 9
    }
  ]
}
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/voting` | Create a voting |
| `GET` | `/api/communities/:communityId/voting` | List votings |
| `POST` | `/api/communities/:communityId/voting/:votingId/vote` | Submit one vote |
| `POST` | `/api/communities/:communityId/voting/:votingId/close` | Close one voting |
| `DELETE` | `/api/communities/:communityId/voting/:votingId` | Delete one voting |

## Create request

```json
{
  "title": "Pool renovation",
  "description": "Select one proposal",
  "endsAt": "2026-04-10T18:00:00.000Z",
  "options": [
    { "title": "Option A" },
    { "title": "Option B" }
  ]
}
```

Rules:

- `title` is required and limited to `160` characters
- `description` is optional and limited to `2000` characters
- `endsAt` is required and must be a valid future ISO instant
- `options` must contain between `2` and `5` items
- each option title is required and limited to `160` characters

## List query

`GET /api/communities/:communityId/voting`

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `8`, max `100` |
| `status` | No | `open` or `closed` |

Returns:

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

## Vote and close responses

Vote request:

```json
{
  "optionId": "uuid"
}
```

Vote response:

```json
{
  "voted": true,
  "votingId": "uuid",
  "optionId": "uuid",
  "votedAt": "2026-03-31T09:30:00.000Z"
}
```

Close response:

```json
{
  "closed": true,
  "votingId": "uuid",
  "closedAt": "2026-03-31T10:00:00.000Z"
}
```

Delete response:

```json
{
  "deleted": true,
  "votingId": "uuid"
}
```
