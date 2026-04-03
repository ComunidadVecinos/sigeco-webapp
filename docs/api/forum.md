# Forum API

> API index: [docs/api/README.md](./README.md)

Community forum posts, comments, reactions, forum polls and pinned posts.

Base path: `/api/communities/:communityId/forum`

---

## Key rules

- All endpoints require session
- Forum requires operational community access
- Suspended members cannot read or operate in forum
- Category values sent by client use lower-case values: `announcement`, `request`, `question`, `poll`
- Category values returned by backend use enum values: `ANNOUNCEMENT`, `REQUEST`, `QUESTION`, `POLL`
- Forum polls do not sync with calendar
- Poll closing now uses `poll.endsAt` as **UTC ISO**

---

## Poll shape returned by backend

```json
{
  "id": "uuid",
  "title": "Horario de piscina de verano",
  "description": "Consulta específica de la encuesta",
  "startsAt": "2026-03-31T18:00:00.000Z",
  "endsAt": "2026-04-05T18:00:00.000Z",
  "status": "OPEN",
  "totalVotes": 11,
  "myVoteOptionId": "uuid",
  "options": [
    {
      "id": "uuid",
      "title": "Opción A",
      "votes": 7
    }
  ]
}
```

---

## Create poll post

`POST /api/communities/:communityId/forum/posts`

Poll example:

```json
{
  "title": "Debate sobre el horario de piscina",
  "description": "Comentemos el posible cambio antes de votar",
  "category": "poll",
  "poll": {
    "title": "Horario de piscina de verano",
    "description": "¿Os parece bien adelantar el horario?",
    "endsAt": "2026-04-05T18:00:00.000Z",
    "options": [
      { "title": "Sí" },
      { "title": "No" }
    ]
  }
}
```

Validation:

- `poll.endsAt` is optional
- if present, it must be a valid UTC ISO instant later than current backend time
- forum polls may still have no end date

---

## Other maintained endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/forum/posts` | List forum posts |
| `GET` | `/api/communities/:communityId/forum/posts/:postId` | Get one post |
| `PATCH` | `/api/communities/:communityId/forum/posts/:postId` | Update one post |
| `DELETE` | `/api/communities/:communityId/forum/posts/:postId` | Soft-delete one post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/comments` | Create comment |
| `GET` | `/api/communities/:communityId/forum/posts/:postId/comments` | List comments |
| `PATCH` | `/api/communities/:communityId/forum/comments/:commentId` | Update comment |
| `DELETE` | `/api/communities/:communityId/forum/comments/:commentId` | Delete comment |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/likes/toggle` | Toggle post reaction |
| `POST` | `/api/communities/:communityId/forum/comments/:commentId/likes/toggle` | Toggle comment reaction |
| `POST` | `/api/communities/:communityId/forum/polls/:pollId/vote` | Vote in a forum poll |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/pin` | Pin a post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/unpin` | Unpin a post |

---

## Frontend notes

- treat every `...At` field as UTC
- render `startsAt`, `endsAt`, `createdAt`, `editedAt`, `lastActivityAt` and `votedAt` in `Europe/Madrid`
- send poll closing as `poll.endsAt`
- do not rebuild separate `poll.endDate` / `poll.endTime`; the API no longer uses them

---

## Delete comment behavior

`DELETE /api/communities/:communityId/forum/comments/:commentId`

- does not remove the comment row from the thread
- returns the updated comment item already anonymized
- the visible content becomes:
  - `El contenido ha sido eliminado por el autor`
  - or `El contenido ha sido eliminado por el administrador`
- `author` becomes `null`
- `likesCount` becomes `0`
