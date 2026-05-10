# Forum API

> API index: [docs/api/README.md](./README.md)

Community posts, comments, reactions, pinned posts, and forum polls.

Base path: `/api/communities/:communityId/forum`

## Access rules

- All endpoints require an authenticated session
- Forum access requires an operational membership in the target community
- Suspended members cannot use this module
- Administrative access is required only for pin and unpin operations

Clients send category values in lowercase:

- `announcement`
- `request`
- `question`
- `poll`

Responses return the stored enum values in uppercase.

## Resource shapes

Post item:

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

Comment item:

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

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/forum/posts` | Create a post |
| `GET` | `/api/communities/:communityId/forum/posts` | List posts |
| `GET` | `/api/communities/:communityId/forum/posts/:postId` | Get one post |
| `PATCH` | `/api/communities/:communityId/forum/posts/:postId` | Update one post |
| `DELETE` | `/api/communities/:communityId/forum/posts/:postId` | Delete one post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/comments` | Create a comment |
| `GET` | `/api/communities/:communityId/forum/posts/:postId/comments` | List comments |
| `PATCH` | `/api/communities/:communityId/forum/comments/:commentId` | Update one comment |
| `DELETE` | `/api/communities/:communityId/forum/comments/:commentId` | Delete one comment |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/likes/toggle` | Toggle a post like |
| `POST` | `/api/communities/:communityId/forum/comments/:commentId/likes/toggle` | Toggle a comment like |
| `POST` | `/api/communities/:communityId/forum/polls/:pollId/vote` | Vote in a forum poll |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/pin` | Pin a post |
| `POST` | `/api/communities/:communityId/forum/posts/:postId/unpin` | Unpin a post |

## Create and update posts

Create request:

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

Update request:

```json
{
  "title": "Updated title",
  "description": "Updated text"
}
```

Rules:

- `title` is required on creation and limited to `160` characters
- `description` is required on creation and limited to `2000` characters
- `poll` is required only when `category` is `poll`
- forum poll options must contain between `2` and `5` items
- update requests must include at least one editable field

## List queries

Posts query:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `20`, max `100` |
| `sortBy` | No | `createdAt`, `likes`, or `lastActivityAt` |
| `category` | No | `announcement`, `request`, `question`, or `poll` |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |

Comments query:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `20`, max `100` |
| `sortBy` | No | `createdAt` or `likes` |

List responses return `items` plus a standard `pagination` block.

## Comments and reactions

Create comment request:

```json
{
  "content": "I prefer the current timetable"
}
```

Update comment request:

```json
{
  "content": "Updated comment"
}
```

Poll vote request:

```json
{
  "optionId": "uuid"
}
```

Like, pin, and unpin endpoints do not require a request body.
