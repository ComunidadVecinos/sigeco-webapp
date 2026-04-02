# Forum API

> API index: [docs/api/README.md](./README.md)

This module manages community forum posts, comments, reactions, forum polls and pinned posts.

Base path:

- `/api/communities/:communityId/forum`

---

## Overview

### What this module does

- Creates forum posts inside one community
- Lists and returns post detail with aggregated counters
- Lets eligible members comment on visible posts
- Lets eligible members toggle reactions on posts and comments
- Supports forum-native polls with one vote per member
- Lets admins pin and unpin posts
- Soft-deletes posts and anonymizes deleted comments

### What frontend should know first

- All endpoints require an authenticated session
- Every endpoint is scoped by `communityId`
- This module requires operational community access, not just membership
- Suspended members cannot read or operate in forum
- Categories sent by client use lower-case API values: `announcement`, `request`, `question`, `poll`
- Categories returned by backend use enum values: `ANNOUNCEMENT`, `REQUEST`, `QUESTION`, `POLL`
- Reactions endpoints return only counters, not a `liked` boolean
- Deleted comments stay in the thread as anonymized placeholders
- Forum polls are independent from community votings and do not create calendar events
- In posts of category `poll`, the post keeps its own `title` and `description`
- The nested `poll` object has its own `title`, optional `description` and options
- Forum poll fields are immutable after creation; there is no endpoint to edit them

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `POST /posts` | Operational membership in that community |
| `GET /posts` | Operational membership in that community |
| `GET /posts/:postId` | Operational membership in that community |
| `PATCH /posts/:postId` | Operational membership and be the author of that post |
| `DELETE /posts/:postId` | Operational membership and be author or active admin |
| `POST /posts/:postId/comments` | Operational membership in that community |
| `GET /posts/:postId/comments` | Operational membership in that community |
| `PATCH /comments/:commentId` | Operational membership and be the author of that comment |
| `DELETE /comments/:commentId` | Operational membership and be author or active admin |
| `POST /posts/:postId/likes/toggle` | Operational membership in that community |
| `POST /comments/:commentId/likes/toggle` | Operational membership in that community |
| `POST /polls/:pollId/vote` | Operational membership in that community |
| `POST /posts/:postId/pin` | Active admin in that community |
| `POST /posts/:postId/unpin` | Active admin in that community |

Important:

- Operational access requires a valid non-ended membership that is not currently suspended
- Administrative access requires `PRESIDENT` or `VICE_PRESIDENT` and the membership must be operational
- Suspended members cannot even list forum posts or comments
- Author checks are done by membership ownership, not by alias string

---

## Common response shapes

### Author summary

```json
{
  "membershipId": "uuid",
  "alias": "Ana Vecina",
  "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
  "role": "MEMBER"
}
```

Notes:

- `author` may be `null` in some responses, especially for anonymized comments
- `profileImageUrl` is a public URL or `null`

### Forum poll option

```json
{
  "id": "uuid",
  "title": "Opción A",
  "votes": 7
}
```

### Forum poll

```json
{
  "id": "uuid",
  "title": "Horario de piscina de verano",
  "description": "Consulta específica de la encuesta",
  "startsAt": "2026-03-31T18:00:00.000Z",
  "endsAt": "2026-04-05T20:00:00.000Z",
  "status": "OPEN",
  "totalVotes": 11,
  "myVoteOptionId": "uuid",
  "options": [
    {
      "id": "uuid",
      "title": "Opción A",
      "votes": 7
    },
    {
      "id": "uuid",
      "title": "Opción B",
      "votes": 4
    }
  ]
}
```

Notes:

- `endsAt` may be `null`
- `description` may be `null`
- `myVoteOptionId` may be `null`
- `status` is computed by backend as `OPEN` or `CLOSED`
- A forum poll is considered closed if deleted, manually unavailable by state, not yet started, or already past `endsAt`

### Forum post item

Used by create, list and detail responses.

```json
{
  "id": "uuid",
  "title": "Debate sobre el horario de piscina",
  "description": "Comentemos el posible cambio antes de votar",
  "category": "POLL",
  "pinned": false,
  "editedAt": null,
  "lastActivityAt": "2026-03-31T18:00:00.000Z",
  "createdAt": "2026-03-31T18:00:00.000Z",
  "author": {
    "membershipId": "uuid",
    "alias": "Ana Vecina",
    "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
    "role": "MEMBER"
  },
  "likesCount": 4,
  "commentsCount": 2,
  "poll": {
    "id": "uuid",
    "title": "Horario de piscina de verano",
    "description": "Consulta específica de la encuesta",
    "startsAt": "2026-03-31T18:00:00.000Z",
    "endsAt": "2026-04-05T20:00:00.000Z",
    "status": "OPEN",
    "totalVotes": 11,
    "myVoteOptionId": "uuid",
    "options": [
      {
        "id": "uuid",
        "title": "Opción A",
        "votes": 7
      },
      {
        "id": "uuid",
        "title": "Opción B",
        "votes": 4
      }
    ]
  }
}
```

Notes:

- `poll` is `null` unless `category` is `POLL`
- There is no `likedByMe` or `hasLiked` field
- There is no `views` field
- `author` is returned as a membership summary with `membershipId`, `alias`, `profileImageUrl` and `role`

### Forum comment item

Used by create, list and update responses.

```json
{
  "id": "uuid",
  "postId": "uuid",
  "content": "Estoy de acuerdo",
  "editedAt": null,
  "isDeleted": false,
  "createdAt": "2026-03-31T18:10:00.000Z",
  "author": {
    "membershipId": "uuid",
    "alias": "Ana Vecina",
    "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
    "role": "MEMBER"
  },
  "likesCount": 3
}
```

Deleted comment shape:

```json
{
  "id": "uuid",
  "postId": "uuid",
  "content": "El contenido ha sido eliminado por el autor",
  "editedAt": null,
  "isDeleted": true,
  "createdAt": "2026-03-31T18:10:00.000Z",
  "author": null,
  "likesCount": 0
}
```

### Pagination shape

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 34,
  "totalPages": 2
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/forum/posts` | Create a forum post |
| `GET` | `/api/communities/:communityId/forum/posts` | List forum posts |
| `GET` | `/api/communities/:communityId/forum/posts/:postId` | Get one post detail |
| `PATCH` | `/api/communities/:communityId/forum/posts/:postId` | Update one post |
| `DELETE` | `/api/communities/:communityId/forum/posts/:postId` | Soft-delete one post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/comments` | Create one comment |
| `GET` | `/api/communities/:communityId/forum/posts/:postId/comments` | List comments of one post |
| `PATCH` | `/api/communities/:communityId/forum/comments/:commentId` | Update one comment |
| `DELETE` | `/api/communities/:communityId/forum/comments/:commentId` | Delete one comment |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/likes/toggle` | Toggle post reaction |
| `POST` | `/api/communities/:communityId/forum/comments/:commentId/likes/toggle` | Toggle comment reaction |
| `POST` | `/api/communities/:communityId/forum/polls/:pollId/vote` | Vote in a forum poll |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/pin` | Pin a post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/unpin` | Unpin a post |

---

## 1. Create post

`POST /api/communities/:communityId/forum/posts`

Creates a visible forum post. If category is `poll`, backend also creates the linked forum poll in the same transaction.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

Question, announcement or request example:

```json
{
  "title": "Normas de la piscina",
  "description": "Propongo actualizar el horario de verano",
  "category": "question"
}
```

Poll example:

```json
{
  "title": "Debate sobre el horario de piscina",
  "description": "Comentemos el posible cambio antes de votar",
  "category": "poll",
  "poll": {
    "title": "Horario de piscina de verano",
    "description": "¿Os parece bien adelantar el horario?",
    "endDate": "2026-04-05",
    "endTime": "20:00",
    "options": [
      { "title": "Sí" },
      { "title": "No" }
    ]
  }
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Required, trimmed text, max `160` |
| `description` | Required, trimmed text, max `2000` |
| `category` | Required, one of `announcement`, `request`, `question`, `poll` |
| `poll` | Required only when `category = poll`, forbidden otherwise |
| `poll.title` | Required for polls, trimmed text, max `160` |
| `poll.description` | Optional for polls, trimmed text, max `2000` |
| `poll.options` | Required for polls, min `2`, max `5` |
| `poll.options[].title` | Required, trimmed text, max `160` |
| `poll.endDate` | Optional, valid date in `YYYY-MM-DD` |
| `poll.endTime` | Optional, valid time in `HH:mm` |

Business rules:

- If poll closing is informed, `poll.endDate` and `poll.endTime` must be sent together
- Poll closing must be later than current backend time
- Forum polls may have no end date at all

### Success

- Status: `201 Created`

Returns one [Forum post item](#forum-post-item).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid body, invalid poll block, invalid date/time, invalid category |

---

## 2. List posts

`GET /api/communities/:communityId/forum/posts`

Returns paginated visible posts of the target community.

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `20` |
| `sortBy` | No | `createdAt`, `likes`, `lastActivityAt`, default `createdAt` |
| `category` | No | `announcement`, `request`, `question`, `poll` |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |

Behavior notes:

- `from` and `to` filter by post creation date
- If both exist, backend requires `from <= to`
- Pinned posts are always sorted first
- Default ordering is pinned first, then newest first
- `sortBy=likes` sorts pinned first, then likes descending, then recent activity
- `sortBy=lastActivityAt` sorts pinned first, then recent activity descending

### Success

- Status: `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Normas de la piscina",
      "description": "Propongo actualizar el horario de verano",
      "category": "QUESTION",
      "pinned": true,
      "editedAt": null,
      "lastActivityAt": "2026-03-31T18:00:00.000Z",
      "createdAt": "2026-03-31T18:00:00.000Z",
      "author": {
        "membershipId": "uuid",
        "alias": "Ana Vecina",
        "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
        "role": "MEMBER"
      },
      "likesCount": 4,
      "commentsCount": 2,
      "poll": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 34,
    "totalPages": 2
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid path or query params |

---

## 3. Get post detail

`GET /api/communities/:communityId/forum/posts/:postId`

Returns one visible post with the same shape used in list results.

### Success

- Status: `200 OK`

Returns one [Forum post item](#forum-post-item).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 4. Update post

`PATCH /api/communities/:communityId/forum/posts/:postId`

Updates the textual content of a visible post.

### Request

```json
{
  "title": "Nuevo título",
  "description": "Nuevo contenido"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Optional, trimmed text, max `160` |
| `description` | Optional, trimmed text, max `2000` |

Rules:

- At least one of `title` or `description` must be present
- Caller must be the author membership
- The nested `poll` object is not accepted in this endpoint
- If the post is a forum poll, editing the post never modifies poll title, poll description or poll options

### Success

- Status: `200 OK`

Returns one updated [Forum post item](#forum-post-item).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not the author of that post |
| `404` | `NOT_FOUND` | Community or post not found |
| `409` | `CONFLICT` | Post is already unavailable or could not be updated |
| `422` | `VALIDATION_ERROR` | Invalid params or body |

---

## 5. Delete post

`DELETE /api/communities/:communityId/forum/posts/:postId`

Soft-deletes a visible post.

Behavior notes:

- Caller must be the author membership or an active admin
- Deleted posts stop appearing in list and detail
- If the post had a linked forum poll, that poll is soft-deleted too

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "postId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller cannot manage that post |
| `404` | `NOT_FOUND` | Community or post not found |
| `409` | `CONFLICT` | Post is already deleted or could not be deleted |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 6. Create comment

`POST /api/communities/:communityId/forum/posts/:postId/comments`

Creates one comment on a visible post.

### Request

```json
{
  "content": "Estoy de acuerdo"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `content` | Required, trimmed text, max `2000` |

Behavior notes:

- Target post must exist and still be visible
- Creating a comment updates the parent post's `lastActivityAt`

### Success

- Status: `201 Created`

Returns one [Forum comment item](#forum-comment-item).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `422` | `VALIDATION_ERROR` | Invalid body or params |

---

## 7. List comments

`GET /api/communities/:communityId/forum/posts/:postId/comments`

Returns paginated comments of one visible post.

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `20` |
| `sortBy` | No | `createdAt` or `likes`, default `createdAt` |

Behavior notes:

- `sortBy=createdAt` returns oldest comments first
- `sortBy=likes` returns higher-liked comments first, then older comments
- Deleted comments remain in the result as anonymized placeholders

### Success

- Status: `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "postId": "uuid",
      "content": "Estoy de acuerdo",
      "editedAt": null,
      "isDeleted": false,
      "createdAt": "2026-03-31T18:10:00.000Z",
      "author": {
        "membershipId": "uuid",
        "alias": "Ana Vecina",
        "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
        "role": "MEMBER"
      },
      "likesCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `422` | `VALIDATION_ERROR` | Invalid params or query |

---

## 8. Update comment

`PATCH /api/communities/:communityId/forum/comments/:commentId`

Updates one visible non-deleted comment.

### Request

```json
{
  "content": "Texto corregido"
}
```

### Rules

- Caller must be the author membership
- The parent post must still be visible
- Deleted comments cannot be edited

### Success

- Status: `200 OK`

Returns one updated [Forum comment item](#forum-comment-item).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not the author of that comment |
| `404` | `NOT_FOUND` | Community or comment not found |
| `409` | `CONFLICT` | Comment is already deleted or could not be updated |
| `422` | `VALIDATION_ERROR` | Invalid params or body |

---

## 9. Delete comment

`DELETE /api/communities/:communityId/forum/comments/:commentId`

Deletes one comment by anonymizing it instead of removing it from the thread.

Behavior notes:

- Caller must be the author membership or an active admin
- Deleted comment keeps its place in the thread
- Backend clears author, content and comment likes

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "commentId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller cannot manage that comment |
| `404` | `NOT_FOUND` | Community or comment not found |
| `409` | `CONFLICT` | Comment is already deleted or could not be deleted |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 10. Toggle post reaction

`POST /api/communities/:communityId/forum/posts/:postId/likes/toggle`

Adds or removes the current member's reaction on a post.

### Success

- Status: `200 OK`

```json
{
  "postId": "uuid",
  "likesCount": 5
}
```

Important for frontend:

- Response does not include whether the final state is liked or unliked
- Frontend must derive the optimistic toggle state itself or reload the post list/detail

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 11. Toggle comment reaction

`POST /api/communities/:communityId/forum/comments/:commentId/likes/toggle`

Adds or removes the current member's reaction on a comment.

### Success

- Status: `200 OK`

```json
{
  "commentId": "uuid",
  "likesCount": 2
}
```

Important for frontend:

- Response does not include whether the final state is liked or unliked
- Deleted comments cannot receive reactions

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or comment not found |
| `409` | `CONFLICT` | Comment is deleted and cannot receive reactions |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 12. Vote in forum poll

`POST /api/communities/:communityId/forum/polls/:pollId/vote`

Registers one vote in a forum poll.

### Request

```json
{
  "optionId": "uuid"
}
```

Rules:

- Caller must have operational access
- Poll must belong to a visible forum post
- Poll must still be open
- `optionId` must belong to that poll
- One vote per membership and poll

### Success

- Status: `200 OK`

```json
{
  "voted": true,
  "pollId": "uuid",
  "optionId": "uuid",
  "votedAt": "2026-03-31T19:00:00.000Z"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller does not have operational access in that community |
| `404` | `NOT_FOUND` | Community or poll not found |
| `409` | `CONFLICT` | Poll is closed or user already voted |
| `422` | `VALIDATION_ERROR` | Invalid params/body or option does not belong to the poll |

---

## 13. Pin post

`POST /api/communities/:communityId/forum/posts/:postId/pin`

Marks a visible post as pinned.

### Success

- Status: `200 OK`

```json
{
  "postId": "uuid",
  "pinned": true
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `409` | `CONFLICT` | Post is unavailable or could not be updated |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## 14. Unpin post

`POST /api/communities/:communityId/forum/posts/:postId/unpin`

Clears the pinned flag of a visible post.

### Success

- Status: `200 OK`

```json
{
  "postId": "uuid",
  "pinned": false
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Community or post not found |
| `409` | `CONFLICT` | Post is unavailable or could not be updated |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## Frontend integration notes

- Use `page` starting at `1`, not `0`
- Expect `items + pagination`, not Spring-style `content/last`
- Map category filters from client values to API values:

| Front label | Request value | Response value |
|---|---|---|
| Announcement | `announcement` | `ANNOUNCEMENT` |
| Request | `request` | `REQUEST` |
| Question | `question` | `QUESTION` |
| Poll | `poll` | `POLL` |

- Use `title` and `description` when creating or updating posts
- For posts of category `poll`, send post content at the root level and poll content inside `poll.title`, `poll.description` and `poll.options`
- If current UI only has one text box, frontend must decide how to derive a title before calling create/update
- Do not call comment edit/delete through nested post routes; backend uses `/forum/comments/:commentId`
- If frontend needs reliable ownership checks, prefer comparing current active `membershipId` with returned `author.membershipId`
- If frontend needs reliable "liked by me" state, backend currently does not expose it in post/comment payloads
- Forum polls do not sync with `calendar`
- Forum polls are different from `voting`; they use different routes, permissions and response shapes
- Forum polls do not expose any edit endpoint once created

---

## Common forum error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| Suspended member tries to use forum | `403` | `FORBIDDEN` |
| User does not belong to the community | `403` | `FORBIDDEN` |
| Invalid UUID path param | `422` | `VALIDATION_ERROR` |
| Invalid query or body payload | `422` | `VALIDATION_ERROR` |
| Post not found or already deleted | `404` | `NOT_FOUND` |
| Comment not found | `404` | `NOT_FOUND` |
| Poll not found | `404` | `NOT_FOUND` |
| Trying to edit/delete an already deleted comment | `409` | `CONFLICT` |
| Trying to react to a deleted comment | `409` | `CONFLICT` |
| Trying to vote twice or in a closed poll | `409` | `CONFLICT` |

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
        "message": "La opción seleccionada no pertenece a esta encuesta"
      }
    ]
  }
}
```
