# Communities API

> API index: [docs/api/README.md](./README.md)

This module manages community creation and the main administrative operations over an existing community.

Base path: `/api/communities`

---

This page documents only the endpoints implemented in the `communities` module itself.

### Related subresources mounted under the same path

These routes are mounted from `communities`, but belong to other modules:

- `/api/communities/:communityId/members/*`
- `/api/communities/:communityId/help/*`
- `/api/communities/:communityId/calendar/*`
- `/api/communities/:communityId/voting/*`
- `/api/communities/:communityId/forum/*`
- `/api/communities/:communityId/news/*`
- `/api/communities/:communityId/incidents/*`
- `/api/communities/:communityId/documents/*`
- `/api/communities/:communityId/reservations/*`

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `POST /api/communities` | Authenticated user |
| `GET /:communityId/summary` | Administrative membership in that community |
| `POST /:communityId/admin/access-code/regenerate` | Administrative membership in that community |
| `PATCH /:communityId` | Administrative membership in that community |
| `PUT /:communityId/avatar` | Administrative membership in that community |
| `DELETE /:communityId/avatar` | Administrative membership in that community |
| `DELETE /:communityId` | Administrative membership in that community **and** actor must be `PRESIDENT` |

Administrative access means `PRESIDENT` or `VICE_PRESIDENT`. Suspended memberships do not count as administrative access.

---

## Common response shapes

### Address summary

Several responses return the shared address summary shape:

```json
{
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "streetNumberKm": "12",
  "block": null,
  "floor": null,
  "door": null,
  "formatted": "Calle Mayor 12"
}
```

### Leader summary

```json
{
  "membershipId": "uuid",
  "alias": "Pablo Presidente",
  "role": "PRESIDENT"
}
```

### Active membership summary

Returned after operations that may change the caller's active context:

```json
{
  "membershipId": "uuid",
  "communityId": "uuid",
  "role": "MEMBER",
  "alias": "Ana"
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities` | Create a community |
| `GET` | `/api/communities/:communityId/summary` | Get administrative summary |
| `POST` | `/api/communities/:communityId/admin/access-code/regenerate` | Regenerate access code |
| `PATCH` | `/api/communities/:communityId` | Update editable community fields |
| `PUT` | `/api/communities/:communityId/avatar` | Upload or replace avatar |
| `DELETE` | `/api/communities/:communityId/avatar` | Delete current avatar |
| `DELETE` | `/api/communities/:communityId` | Soft-delete community |

---

## 1. Create community

`POST /api/communities`

Creates a new community, creates the creator membership with role `PRESIDENT`, creates the creator property and updates the current session active membership.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "community": {
    "name": "Comunidad SIGECO",
    "cif": "H12345678",
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "streetNumberKm": "12"
  },
  "creatorProperty": {
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "streetNumberKm": "12",
    "block": "A",
    "floor": "1",
    "door": "B"
  },
  "alias": "Ana"
}
```

### Validation rules

#### `community`

| Field | Rules |
|---|---|
| `name` | Required, max 160 |
| `cif` | Required, normalized to uppercase, accepts spaces/hyphens, must match community owners CIF format `H` + 8 digits |
| `country` | Required, max 100 |
| `province` | Required, max 120 |
| `municipality` | Required, max 120 |
| `streetType` | Required, max 50 |
| `streetName` | Required, max 255 |
| `postalCode` | Required, valid Spanish postal code |
| `streetNumberKm` | Required, max 30, normalized to uppercase, must match accepted street number / km formats |

#### `creatorProperty`

Same required address fields as `community`, plus:

| Field | Rules |
|---|---|
| `block` | Optional, max 30 |
| `floor` | Optional, max 30 |
| `door` | Optional, max 30 |

#### Root fields

| Field | Rules |
|---|---|
| `alias` | Required, max 120 |

### Success

- Status: `201 Created`

```json
{
  "message": "Comunidad creada correctamente.",
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO",
    "cif": "H-12345678",
    "accessCode": "SGECA234"
  },
  "membership": {
    "id": "uuid",
    "role": "PRESIDENT",
    "alias": "Ana",
    "joinedAt": "2026-03-28T18:00:00.000Z"
  },
  "creatorProperty": {
    "id": "uuid",
    "label": "Vivienda de Ana",
    "address": "Calle Mayor 12, Bloque A, Piso 1, Puerta B",
    "province": "Madrid",
    "municipality": "Madrid"
  },
  "activeMembershipId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `422` | `VALIDATION_ERROR` | Invalid request body |
| `409` | `CONFLICT` | CIF already used or community creation context invalid |

## 2. Get community administrative summary

`GET /api/communities/:communityId/summary`

Returns the administrative summary used by the admin area.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- administrative access in the target community

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO",
    "cif": "H-12345678",
    "address": {
      "country": "España",
      "province": "Madrid",
      "municipality": "Madrid",
      "streetType": "Calle",
      "streetName": "Mayor",
      "postalCode": "28001",
      "streetNumberKm": "12",
      "block": null,
      "floor": null,
      "door": null,
      "formatted": "Calle Mayor 12"
    },
    "avatar": "/uploads/images/communities/<communityId>/avatar.png",
    "createdAt": "2026-03-28T18:00:00.000Z",
    "president": {
      "membershipId": "uuid",
      "alias": "Pablo Presidente",
      "role": "PRESIDENT"
    },
    "vicePresident": {
      "membershipId": "uuid",
      "alias": "Veronica Vicepresidente",
      "role": "VICE_PRESIDENT"
    },
    "neighborsCount": 5
  }
}
```

### Field notes

| Field | Notes |
|---|---|
| `avatar` | Public URL or `null` |
| `president` | May be `null` |
| `vicePresident` | May be `null` |
| `neighborsCount` | Count of current non-ended, non-deleted memberships |

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User belongs to community but is not an active admin |
| `404` | `NOT_FOUND` | Community not found |

---

## 3. Regenerate access code

`POST /api/communities/:communityId/admin/access-code/regenerate`

Generates a new unique 8-character access code for the community.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- administrative access in the target community

No request body.

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "accessCode": "SGECB345"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `500` | `INTERNAL_ERROR` | Rare failure generating a unique code after retries |

## 4. Update community basic data

`PATCH /api/communities/:communityId`

Partial update of the editable basic fields of a community.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

Any non-empty subset of:

```json
{
  "name": "Comunidad SIGECO Norte",
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Avenida",
  "streetName": "Europa",
  "postalCode": "28002",
  "streetNumberKm": "14"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `name` | Optional, max 160 |
| `country` | Optional, max 100 |
| `province` | Optional, max 120 |
| `municipality` | Optional, max 120 |
| `streetType` | Optional, max 50 |
| `streetName` | Optional, max 255 |
| `postalCode` | Optional, valid Spanish postal code |
| `streetNumberKm` | Optional, max 30, valid street number / km format |

Additional rules:

- Request body is strict: unknown fields are rejected
- At least one editable field must be sent

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO Norte",
    "cif": "H-12345678",
    "address": {
      "country": "España",
      "province": "Madrid",
      "municipality": "Madrid",
      "streetType": "Avenida",
      "streetName": "Europa",
      "postalCode": "28002",
      "streetNumberKm": "14",
      "block": null,
      "floor": null,
      "door": null,
      "formatted": "Avenida Europa 14"
    },
    "accessCode": "SGECB345",
    "createdAt": "2026-03-28T18:00:00.000Z"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid body or no editable fields sent |

---

## 5. Upload or replace community avatar

`PUT /api/communities/:communityId/avatar`

Uploads a new avatar image and replaces the previous one if it exists.

### Request

```http
Content-Type: multipart/form-data
Cookie: sid=<session_cookie>
```

Form field:

| Field | Type | Required |
|---|---|---|
| `avatar` | File | Yes |

Upload rules:

| Rule | Value |
|---|---|
| Allowed MIME types | `image/jpeg`, `image/png` |
| Max size | `5 MB` |
| Binary signature validation | Yes |

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "avatarFileId": "uuid",
    "avatarUrl": "/uploads/images/communities/<communityId>/avatar.png"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `413` | `FILE_TOO_LARGE` | File exceeds max size |
| `415` | `FILE_TYPE_UNSUPPORTED` | Rejected MIME type |
| `422` | `VALIDATION_ERROR` | Missing file or invalid binary image |

## 6. Delete community avatar

`DELETE /api/communities/:communityId/avatar`

Deletes the current avatar of the community without affecting the rest of the community data.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- administrative access in the target community

No request body.

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "avatarUrl": null
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `409` | `CONFLICT` | Community does not currently have an avatar |

---

## 7. Delete community

`DELETE /api/communities/:communityId`

Soft-deletes the community and closes all active memberships in it.

This operation also:

- cancels pending community requests
- clears session references pointing to memberships in that community
- recalculates the caller's active membership
- frees the previous unique identifiers by mutating stored `cif` and `accessCode`

### Access restrictions

- Requires authenticated session
- Requires administrative access in the community
- Actor must be `PRESIDENT`

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "confirmationText": "ELIMINAR COMUNIDAD",
  "currentPassword": "Password1!"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `confirmationText` | Required, non-empty, must match exact expected value in service |
| `currentPassword` | Required, non-empty, must match current user's password |

Exact confirmation text expected by backend:

```text
ELIMINAR COMUNIDAD
```

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "communityId": "uuid",
  "activeMembership": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "role": "MEMBER",
    "alias": "Ana"
  }
}
```

`activeMembership` may be `null` if the user no longer has any active membership after deletion.

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin or is not `PRESIDENT` |
| `404` | `NOT_FOUND` | Community or current user not found |
| `409` | `CONFLICT` | Community already deleted or invalid state for deletion |
| `422` | `VALIDATION_ERROR` | Invalid body |
| `422` | `CONFIRMATION_TEXT_MISMATCH` | Confirmation text does not match |
| `422` | `CURRENT_PASSWORD_INVALID` | Current password is wrong |

## Common community error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User is not an active admin in the target community | `403` | `FORBIDDEN` |
| Community UUID is valid but community does not exist | `404` | `NOT_FOUND` |
| Body validation fails | `422` | `VALIDATION_ERROR` |
| Community avatar deletion requested but no avatar exists | `409` | `CONFLICT` |
| Duplicate CIF on create | `409` | `CONFLICT` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "confirmationText",
        "location": "body",
        "message": "El texto de confirmación no coincide con el valor esperado"
      }
    ]
  }
}
```
