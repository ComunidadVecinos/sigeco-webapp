# News API

> API index: [docs/api/README.md](./README.md)

Community news board with optional image and optional automatic calendar projection.

Base path: `/api/communities/:communityId/news`

---

## Key rules

- All endpoints require session
- Any member of the community, including suspended members, can read news
- Only active admins can create, edit, delete news or delete its image
- Every field with date and time is now returned as **UTC ISO**
- `eventStartsAt` and `eventEndsAt` replace the old nested `event` block

---

## News item

```json
{
  "id": "uuid",
  "title": "Corte de agua programado",
  "description": "El suministro se interrumpirá por mantenimiento.",
  "imageUrl": "/uploads/images/communities/<communityId>/news/<newsId>/image.png",
  "creator": {
    "alias": "Presi"
  },
  "createdAt": "2026-04-02T18:00:00.000Z",
  "editedAt": null,
  "isEvent": true,
  "eventStartsAt": "2026-04-10T17:30:00.000Z",
  "eventEndsAt": "2026-04-10T18:30:00.000Z"
}
```

Notes:

- `imageUrl`, `editedAt` and `eventEndsAt` may be `null`
- `eventStartsAt` and `eventEndsAt` are UTC ISO instants
- `creator.alias` becomes `"Usuario eliminado"` if the original author deletes the account

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/news` | Create news |
| `GET` | `/api/communities/:communityId/news` | List paginated news |
| `GET` | `/api/communities/:communityId/news/:newsId` | Get one news item |
| `PATCH` | `/api/communities/:communityId/news/:newsId` | Update one news item |
| `DELETE` | `/api/communities/:communityId/news/:newsId/image` | Delete only the attached image |
| `DELETE` | `/api/communities/:communityId/news/:newsId` | Soft-delete one news item |

---

## 1. Create news

`POST /api/communities/:communityId/news`

Supported content types:

- `application/json`
- `multipart/form-data`

JSON example:

```json
{
  "title": "Junta extraordinaria",
  "description": "Se convoca una reunión para aprobar el presupuesto.",
  "eventStartsAt": "2026-04-10T17:30:00.000Z",
  "eventEndsAt": "2026-04-10T18:30:00.000Z"
}
```

Multipart example:

```ts
const formData = new FormData();
formData.append('title', 'Junta extraordinaria');
formData.append('description', 'Se convoca una reunión para aprobar el presupuesto.');
formData.append('eventStartsAt', '2026-04-10T17:30:00.000Z');
formData.append('eventEndsAt', '2026-04-10T18:30:00.000Z');
formData.append('image', file);
```

Validation:

- `title`: required, max `160`
- `description`: required, max `4000`
- `image`: optional JPG/PNG up to `5 MB`
- `eventStartsAt`: optional UTC ISO instant
- `eventEndsAt`: optional UTC ISO instant
- if `eventEndsAt` exists, it must be later than `eventStartsAt`

Success:

- `201 Created`
- returns one `News item`

---

## 2. List news

`GET /api/communities/:communityId/news`

Query params:

| Field | Required | Notes |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `search` | No | Case-insensitive filter over `title` |
| `from` | No | Lower bound business day, `YYYY-MM-DD` |
| `to` | No | Upper bound business day, `YYYY-MM-DD` |
| `eventType` | No | `event` or `nonEvent` |

Success:

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

Notes:

- pagination is 1-based
- `from` and `to` filter by `createdAt` using the business day in `Europe/Madrid`

---

## 3. Update news

`PATCH /api/communities/:communityId/news/:newsId`

Allowed editable fields:

- `title`
- `description`
- `eventStartsAt`
- `eventEndsAt`
- `image`

Example:

```json
{
  "title": "Junta extraordinaria actualizada",
  "eventStartsAt": "2026-04-10T18:00:00.000Z",
  "eventEndsAt": "2026-04-10T19:00:00.000Z"
}
```

To remove event status:

```json
{
  "eventStartsAt": null,
  "eventEndsAt": null
}
```

Notes:

- if no new image is sent, the current image is preserved
- if a new image is sent, it replaces the previous one
- if `multipart/form-data` is used to remove the event while replacing the image, send `eventStartsAt = null` and `eventEndsAt = null` as literal string values
- text-only changes do not reproject calendar unless the event schedule changes

---

## 4. Delete image

`DELETE /api/communities/:communityId/news/:newsId/image`

Returns the updated `News item` with `imageUrl: null`.

---

## 5. Delete news

`DELETE /api/communities/:communityId/news/:newsId`

Success:

```json
{
  "deleted": true,
  "newsId": "uuid"
}
```

---

## Calendar projection

- `NEWS` automatic entries are created from `eventStartsAt` / `eventEndsAt`
- backend segments them by business day in `Europe/Madrid`
- calendar responses still expose those segments as UTC instants
- deleting the news item removes all linked automatic calendar entries

---

## Frontend notes

- treat `id` as UUID string
- use `description`, not legacy `content`
- show `createdAt`, `editedAt`, `eventStartsAt` and `eventEndsAt` by converting UTC to `Europe/Madrid`
- do not rebuild a nested `event` object client-side; the API no longer uses it
