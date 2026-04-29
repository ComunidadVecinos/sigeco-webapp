# Incidents API

> API index: [docs/api/README.md](./README.md)

Community incidents board with optional image, paginated list, soft-delete and administrative state management.

Base path: `/api/communities/:communityId/incidents`

---

## Key rules

- All endpoints require session
- Any operational member of the community can list, view and create incidents
- Suspended members cannot access this module
- Only the author can edit an incident and only while it remains pending
- The author can delete only pending incidents
- Active admins can delete incidents in any state and can manage status transitions
- The default list filter is `status=open`, which returns only `pending` and `inProgress`
- `resolved` and `cancelled` incidents are hidden by default from the main list, but remain accessible by explicit filter and by detail endpoint
- Every field with date and time is returned as **UTC ISO**

---

## Incident item

```json
{
  "id": "uuid",
  "title": "Luz fundida en portal",
  "description": "La bombilla de la entrada principal no funciona.",
  "status": "pending",
  "imageUrl": "/uploads/images/communities/<communityId>/incidents/<incidentId>/image.png",
  "author": {
    "alias": "Vecino 3B"
  },
  "createdAt": "2026-04-06T18:00:00.000Z",
  "editedAt": null
}
```

Notes:

- `status` can be `pending`, `inProgress`, `resolved` or `cancelled`
- `imageUrl` and `editedAt` may be `null`
- `author.alias` becomes `"Usuario eliminado"` if the original author deletes the account
- `editedAt` changes after a successful edit and also after deleting the attached image

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/incidents` | Create incident |
| `GET` | `/api/communities/:communityId/incidents` | List incidents with summary |
| `GET` | `/api/communities/:communityId/incidents/:incidentId` | Get one incident |
| `PATCH` | `/api/communities/:communityId/incidents/:incidentId` | Update one pending incident |
| `DELETE` | `/api/communities/:communityId/incidents/:incidentId/image` | Delete only the attached image |
| `DELETE` | `/api/communities/:communityId/incidents/:incidentId` | Soft-delete one incident |
| `POST` | `/api/communities/:communityId/incidents/:incidentId/status` | Update incident status |

---

## 1. Create incident

`POST /api/communities/:communityId/incidents`

Supported content types:

- `application/json`
- `multipart/form-data`

JSON example:

```json
{
  "title": "Luz fundida en portal",
  "description": "La bombilla de la entrada principal no funciona."
}
```

Multipart requests use the same text fields and may also include an `image` file.

Validation:

- `title`: required, max `160`
- `description`: required, max `4000`
- `image`: optional JPG/PNG up to `5 MB`
- in multipart mode, the file field name must be `image`
- in multipart mode, extra text fields are rejected

Success:

- `201 Created`
- returns one `Incident item` in `pending`

---

## 2. List incidents

`GET /api/communities/:communityId/incidents`

Query params:

| Field | Required | Notes |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `status` | No | `open`, `pending`, `inProgress`, `resolved`, `cancelled`, `all`; default `open` |

Success:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 0
  },
  "summary": {
    "total": 0,
    "pending": 0,
    "inProgress": 0,
    "resolved": 0,
    "cancelled": 0
  }
}
```

Notes:

- pagination is 1-based
- `status = open` returns `pending` and `inProgress`
- `resolved` and `cancelled` are therefore excluded from the default list
- items are ordered by latest activity first: the most recently updated incidents appear before older ones
- a recent status change can move an older incident above more recently created ones
- `summary` always counts the whole community scope, not only the current page

---

## 3. Get incident detail

`GET /api/communities/:communityId/incidents/:incidentId`

Returns one `Incident item`.

Notes:

- active incidents in any public status can be retrieved by id
- soft-deleted incidents are not exposed by detail and return `404 Not Found`

---

## 4. Update incident

`PATCH /api/communities/:communityId/incidents/:incidentId`

Supported content types:

- `application/json`
- `multipart/form-data`

Allowed editable fields:

- `title`
- `description`
- `image`

Notes:

- all fields are optional, but the request must include at least one editable field or a new `image`
- only the author can update the incident
- only `pending` incidents can be updated
- if no new image is sent, the current image is preserved
- if a new image is sent, it replaces the previous one
- in multipart mode, extra text fields are rejected
- any successful edit updates `editedAt`

---

## 5. Delete image

`DELETE /api/communities/:communityId/incidents/:incidentId/image`

Returns the updated `Incident item` with `imageUrl: null`.

Rules:

- only the author can remove the image
- only `pending` incidents can remove the image
- deleting the image also updates `editedAt`
- deleting the image when no image exists returns `409 Conflict`

---

## 6. Delete incident

`DELETE /api/communities/:communityId/incidents/:incidentId`

Success:

```json
{
  "deleted": true,
  "incidentId": "uuid"
}
```

Rules:

- the author can delete only if status is `pending`
- active admins can delete in any state
- deletion is logical; after that, the incident no longer appears in list endpoints and detail returns `404 Not Found`

---

## 7. Update status

`POST /api/communities/:communityId/incidents/:incidentId/status`

Example:

```json
{
  "status": "inProgress"
}
```

Allowed target values:

- `inProgress`
- `resolved`
- `cancelled`

Allowed transitions:

- `pending -> inProgress | resolved | cancelled`
- `inProgress -> resolved | cancelled`
- `resolved -> inProgress`
- `cancelled -> inProgress`

Notes:

- only active admins can change status
- sending the same current status returns `409 Conflict`
- there is no public transition back to `pending`

Returns the updated `Incident item`.

---

## Common incidents error cases

- `404 Not Found` if the community or incident does not exist
- `403 Forbidden` if the user does not belong to the community or lacks the required role
- `409 Conflict` for invalid state transitions, sending the same status again, editing non-pending incidents, deleting a missing image or deleting an already deleted incident
- `422 Unprocessable Entity` for an update request that sends no editable fields and no image
- `422 Unprocessable Entity` for invalid body, params, query or multipart fields

