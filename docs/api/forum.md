# Forum API

> API index: [docs/api/README.md](./README.md)

This module manages community forum posts, comments, reactions, forum polls and pinned posts.

Base path: `/api/communities/:communityId/forum`

---

## Access rules

- All endpoints require a valid session
- Forum access requires an operational membership in the target community
- Suspended members cannot read or operate in this module
- Administrative access is required only for pinning and unpinning posts

Category values accepted from clients:

| Input value | Stored/returned value |
|---|---|
| `announcement` | `ANNOUNCEMENT` |
| `request` | `REQUEST` |
| `question` | `QUESTION` |
| `poll` | `POLL` |

---

## Common resource shapes

### Poll item

```json
{
  "id": "uuid",
  "title": "Summer pool timetable",
  "description": "Choose the preferred option",
  "startsAt": "2026-04-01T18:00:00.000Z",
  "endsAt": "2026-04-05T18:00:00.000Z",
  "status": "OPEN",
  "totalVotes": 11,
  "myVoteOptionId": "uuid",
  "options": [
    {
      "id": "uuid",
      "title": "Option A",
      "votes": 7
    }
  ]
}
```

### Post item

```json
{
  "id": "uuid",
  "title": "Pool timetable discussion",
  "description": "Let's discuss the change before voting",
  "category": "POLL",
  "pinned": false,
  "editedAt": null,
  "lastActivityAt": "2026-04-02T10:00:00.000Z",
  "createdAt": "2026-04-01T18:00:00.000Z",
  "author": {
    "membershipId": "uuid",
    "alias": "Ana",
    "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
    "role": "MEMBER"
  },
  "likesCount": 3,
  "commentsCount": 5,
  "poll": null
}
```

### Comment item

```json
{
  "id": "uuid",
  "postId": "uuid",
  "content": "I prefer the current timetable",
  "editedAt": null,
  "isDeleted": false,
  "createdAt": "2026-04-01T19:00:00.000Z",
  "author": {
    "membershipId": "uuid",
    "alias": "Ana",
    "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
    "role": "MEMBER"
  },
  "likesCount": 1
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/forum/posts` | Create a post |
| `GET` | `/api/communities/:communityId/forum/posts` | List posts |
| `GET` | `/api/communities/:communityId/forum/posts/:postId` | Get one post |
| `PATCH` | `/api/communities/:communityId/forum/posts/:postId` | Update one post |
| `DELETE` | `/api/communities/:communityId/forum/posts/:postId` | Soft-delete one post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/comments` | Create a comment |
| `GET` | `/api/communities/:communityId/forum/posts/:postId/comments` | List comments |
| `PATCH` | `/api/communities/:communityId/forum/comments/:commentId` | Update one comment |
| `DELETE` | `/api/communities/:communityId/forum/comments/:commentId` | Anonymize one comment |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/likes/toggle` | Toggle a post reaction |
| `POST` | `/api/communities/:communityId/forum/comments/:commentId/likes/toggle` | Toggle a comment reaction |
| `POST` | `/api/communities/:communityId/forum/polls/:pollId/vote` | Vote in a forum poll |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/pin` | Pin a post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/unpin` | Unpin a post |

---

## 1. Create post

`POST /api/communities/:communityId/forum/posts`

### Request

```json
{
  "title": "Pool timetable discussion",
  "description": "Let's discuss the change before voting",
  "category": "poll",
  "poll": {
    "title": "Summer pool timetable",
    "description": "Choose the preferred option",
    "endsAt": "2026-04-05T18:00:00.000Z",
    "options": [
      { "title": "Option A" },
      { "title": "Option B" }
    ]
  }
}
```

### Validation rules

| Field | Rules |
|---|---|
| `title` | Required, trimmed, max `160` |
| `description` | Required, trimmed, max `2000` |
| `category` | Required; `announcement`, `request`, `question` or `poll` |
| `poll.title` | Required only for `category=poll`, max `160` |
| `poll.description` | Optional, max `2000` |
| `poll.endsAt` | Optional UTC ISO instant later than the current backend time |
| `poll.options` | Required only for `category=poll`, min `2`, max `5` |

### Success

- Status: `201 Created`
- Response returns one `Post item`

### Business rules

- Only `category=poll` can include the `poll` block
- Non-poll categories must not include a `poll` block
- Forum polls do not create calendar events

---

## 2. List posts

`GET /api/communities/:communityId/forum/posts`

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `20` |
| `sortBy` | No | `createdAt`, `likes` or `lastActivityAt`; default `createdAt` |
| `category` | No | `announcement`, `request`, `question` or `poll` |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |

### Success

- Status: `200 OK`

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Business rules

- `from` and `to` filter by post creation date
- `from` cannot be later than `to`

---

## 3. Get post detail

`GET /api/communities/:communityId/forum/posts/:postId`

### Success

- Status: `200 OK`
- Response returns one `Post item`

---

## 4. Update post

`PATCH /api/communities/:communityId/forum/posts/:postId`

### Request

Any non-empty subset of:

```json
{
  "title": "Updated title",
  "description": "Updated text"
}
```

### Success

- Status: `200 OK`
- Response returns the updated `Post item`

### Business rules

- Only editable post fields can change
- The actor must be allowed to edit the target post
- Deleted posts cannot be updated

---

## 5. Delete post

`DELETE /api/communities/:communityId/forum/posts/:postId`

Soft-deletes the post. If the post owns a poll, the associated poll is soft-deleted as well.

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "postId": "uuid"
}
```

---

## 6. Create comment

`POST /api/communities/:communityId/forum/posts/:postId/comments`

### Request

```json
{
  "content": "I prefer the current timetable"
}
```

### Success

- Status: `201 Created`
- Response returns one `Comment item`

Creating a comment also updates the parent post `lastActivityAt`.

---

## 7. List comments

`GET /api/communities/:communityId/forum/posts/:postId/comments`

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `20` |
| `sortBy` | No | `createdAt` or `likes`; default `createdAt` |

### Success

- Status: `200 OK`

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## 8. Update comment

`PATCH /api/communities/:communityId/forum/comments/:commentId`

### Request

```json
{
  "content": "Updated comment"
}
```

### Success

- Status: `200 OK`
- Response returns the updated `Comment item`

---

## 9. Delete comment

`DELETE /api/communities/:communityId/forum/comments/:commentId`

The comment row is preserved but anonymized.

### Success

- Status: `200 OK`
- Response returns the resulting `Comment item`

### Behavior notes

- `isDeleted` becomes `true`
- `author` becomes `null`
- `likesCount` becomes `0`
- Visible content becomes the standardized deleted-content message defined by the service

---

## 10. Toggle reactions

### Toggle post reaction

`POST /api/communities/:communityId/forum/posts/:postId/likes/toggle`

```json
{
  "postId": "uuid",
  "likesCount": 4
}
```

### Toggle comment reaction

`POST /api/communities/:communityId/forum/comments/:commentId/likes/toggle`

```json
{
  "commentId": "uuid",
  "likesCount": 2
}
```

Both endpoints return status `200 OK`.

---

## 11. Vote on poll

`POST /api/communities/:communityId/forum/polls/:pollId/vote`

### Request

```json
{
  "optionId": "uuid"
}
```

### Success

- Status: `200 OK`

```json
{
  "voted": true,
  "pollId": "uuid",
  "optionId": "uuid",
  "votedAt": "2026-04-02T12:00:00.000Z"
}
```

### Business rules

- The poll must remain open
- The selected option must belong to that poll
- Only one vote per member and poll is allowed

---

## 12. Pin or unpin post

### Pin

`POST /api/communities/:communityId/forum/posts/:postId/pin`

### Unpin

`POST /api/communities/:communityId/forum/posts/:postId/unpin`

### Success

Both endpoints return status `200 OK`:

```json
{
  "postId": "uuid",
  "pinned": true
}
```

Pinning and unpinning require active administrative access in the community.

---

## Common forum error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User lacks operational access to the community | `403` | `FORBIDDEN` |
| User lacks administrative access for pinning | `403` | `FORBIDDEN` |
| Target post, comment or poll does not exist | `404` | `NOT_FOUND` |
| Poll is closed or target content is already deleted | `409` | `CONFLICT` |
| User attempts to vote twice on the same poll | `409` | `CONFLICT` |
| Invalid params, query values or body payload | `422` | `VALIDATION_ERROR` |
