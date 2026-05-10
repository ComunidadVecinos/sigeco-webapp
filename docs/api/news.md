# News API

> API index: [docs/api/README.md](./README.md)

Community news board with optional images and optional calendar projection.

Base path: `/api/communities/:communityId/news`

## Access rules

- All endpoints require an authenticated session
- Any community member, including suspended members, can read news
- Only active administrators can create, edit, delete news, or delete a news image
- API timestamps are returned as UTC ISO instants

## News item shape

```json
{
  "id": "uuid",
  "title": "Scheduled water outage",
  "description": "Water service will be interrupted for maintenance.",
  "imageUrl": "/uploads/images/communities/<communityId>/news/<newsId>/image.png",
  "creator": {
    "alias": "Board President"
  },
  "createdAt": "2026-04-02T18:00:00.000Z",
  "editedAt": null,
  "isEvent": true,
  "eventStartsAt": "2026-04-10T17:30:00.000Z",
  "eventEndsAt": "2026-04-10T18:30:00.000Z"
}
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/news` | Create news |
| `GET` | `/api/communities/:communityId/news` | List news |
| `GET` | `/api/communities/:communityId/news/:newsId` | Get one news item |
| `PATCH` | `/api/communities/:communityId/news/:newsId` | Update one news item |
| `DELETE` | `/api/communities/:communityId/news/:newsId/image` | Delete the attached image |
| `DELETE` | `/api/communities/:communityId/news/:newsId` | Delete one news item |

## Create and update contract

Supported request content types:

- `application/json`
- `multipart/form-data`

Create request:

```json
{
  "title": "Extraordinary board meeting",
  "description": "A meeting is scheduled to approve the budget.",
  "eventStartsAt": "2026-04-10T17:30:00.000Z",
  "eventEndsAt": "2026-04-10T18:30:00.000Z"
}
```

Multipart requests may also include an `image` file.

Editable fields:

- `title`
- `description`
- `eventStartsAt`
- `eventEndsAt`
- `image`

Rules:

- `title` is required on creation and limited to `160` characters
- `description` is required on creation and limited to `4000` characters
- `image` is optional and must be a JPG or PNG file up to `5 MB`
- `eventStartsAt` and `eventEndsAt` are optional
- if `eventEndsAt` is present, it must be later than `eventStartsAt`
- sending both event fields as `null` removes the event projection
- update requests must include at least one text change or a new image

## List query

`GET /api/communities/:communityId/news`

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `search` | No | Case-insensitive filter over `title` |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |
| `eventType` | No | `all`, `event`, or `nonEvent` |

Returns:

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

## Delete responses

Deleting the image returns the updated news item with `imageUrl: null`.

Deleting the news item returns:

```json
{
  "deleted": true,
  "newsId": "uuid"
}
```
