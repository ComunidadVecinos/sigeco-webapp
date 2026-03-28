# Requests API

> API index: [docs/api/README.md](./README.md)

This module manages community requests created by users and reviewed by community administrators.

Base path:

- `/api/requests`

---

## Overview

### What this module does

- Creates `JOIN` requests to access a community by access code
- Creates `UPDATE_INFO` requests to modify community membership/property data
- Lists the authenticated user's non-archived requests
- Lists pending requests of a community for admins
- Lets users cancel or archive their own requests
- Lets admins approve or reject pending requests

### What frontend should know first

- All endpoints require an authenticated session
- Request types currently implemented are `JOIN` and `UPDATE_INFO`
- Request statuses currently used are `PENDING`, `APPROVED`, `REJECTED` and `CANCELLED`
- Archived requests are hidden from user-facing lists
- Admin review endpoints operate on the community of the request itself

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `GET /api/requests/mine` | Authenticated user |
| `POST /api/requests` with `type=JOIN` | Authenticated user |
| `POST /api/requests` with `type=UPDATE_INFO` | Authenticated user with membership in target community |
| `GET /api/requests` | Active admin in `query.communityId` |
| `POST /api/requests/:requestId/cancel` | Owner of that request |
| `POST /api/requests/:requestId/archive` | Owner of that request |
| `POST /api/requests/:requestId/approve` | Active admin in the request community |
| `POST /api/requests/:requestId/reject` | Active admin in the request community |

Important:

- Ownership checks are enforced on cancel/archive
- Admin review permissions are resolved against the request's own `communityId`
- A user can have at most one pending visible request per community

---

## Common response shapes

### Request details address

Requests reuse the common address summary shape:

```json
{
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "streetNumberKm": "12",
  "block": "A",
  "floor": "2",
  "door": "B",
  "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta B"
}
```

### User request item

Used by `GET /api/requests/mine`.

```json
{
  "id": "uuid",
  "type": "JOIN",
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO"
  },
  "proposedAlias": "Ana",
  "proposedAddress": {
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "streetNumberKm": "12",
    "block": "A",
    "floor": "2",
    "door": "B",
    "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta B"
  },
  "requestComment": "Quiero unirme a la comunidad",
  "status": "PENDING",
  "createdAt": "2026-03-28T18:00:00.000Z",
  "resolvedAt": null
}
```

### Pending community request item

Used by `GET /api/requests`.

```json
{
  "id": "uuid",
  "type": "JOIN",
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO"
  },
  "requesterName": "Ana Garcia",
  "proposedAlias": "Ana",
  "proposedAddress": {
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "streetNumberKm": "12",
    "block": "A",
    "floor": "2",
    "door": "B",
    "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta B"
  },
  "requestComment": "Quiero unirme a la comunidad",
  "status": "PENDING",
  "createdAt": "2026-03-28T18:00:00.000Z"
}
```

### Managed request summary

Used by cancel, archive, approve and reject responses.

```json
{
  "id": "uuid",
  "type": "JOIN",
  "status": "APPROVED",
  "createdAt": "2026-03-28T18:00:00.000Z",
  "resolvedAt": "2026-03-29T10:00:00.000Z",
  "cancelledAt": null,
  "archivedAt": null
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/requests/mine` | List my non-archived requests |
| `GET` | `/api/requests` | List pending community requests for admins |
| `POST` | `/api/requests` | Create a `JOIN` or `UPDATE_INFO` request |
| `POST` | `/api/requests/:requestId/cancel` | Cancel my pending request |
| `POST` | `/api/requests/:requestId/archive` | Archive one of my resolved/cancelled requests |
| `POST` | `/api/requests/:requestId/approve` | Approve a pending request |
| `POST` | `/api/requests/:requestId/reject` | Reject a pending request |

---

## 1. List my requests

`GET /api/requests/mine`

Returns the authenticated user's non-archived requests.

### Request

Requires:

- valid `sid` cookie

No query params.

### Success

- Status: `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "JOIN",
      "community": {
        "id": "uuid",
        "name": "Comunidad SIGECO"
      },
      "proposedAlias": "Ana",
      "proposedAddress": {
        "country": "España",
        "province": "Madrid",
        "municipality": "Madrid",
        "streetType": "Calle",
        "streetName": "Mayor",
        "postalCode": "28001",
        "streetNumberKm": "12",
        "block": "A",
        "floor": "2",
        "door": "B",
        "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta B"
      },
      "requestComment": "Quiero unirme a la comunidad",
      "status": "PENDING",
      "createdAt": "2026-03-28T18:00:00.000Z",
      "resolvedAt": null
    }
  ]
}
```

### Behavior notes

- Archived requests are excluded
- Items are ordered by `createdAt` descending

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |

---

## 2. List pending community requests

`GET /api/requests`

Returns the pending visible requests of a community for administrative review.

### Request

Requires:

- valid `sid` cookie
- active admin access in `communityId`

### Query params

| Param | Required | Rules |
|---|---|---|
| `communityId` | Yes | UUID |
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `10` |
| `type` | No | `JOIN` or `UPDATE_INFO` |

### Success

- Status: `200 OK`

```json
{
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO"
  },
  "page": 1,
  "pageSize": 10,
  "total": 2,
  "items": [
    {
      "id": "uuid",
      "type": "JOIN",
      "community": {
        "id": "uuid",
        "name": "Comunidad SIGECO"
      },
      "requesterName": "Ana Garcia",
      "proposedAlias": "Ana",
      "proposedAddress": {
        "country": "España",
        "province": "Madrid",
        "municipality": "Madrid",
        "streetType": "Calle",
        "streetName": "Mayor",
        "postalCode": "28001",
        "streetNumberKm": "12",
        "block": "A",
        "floor": "2",
        "door": "B",
        "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta B"
      },
      "requestComment": "Quiero unirme a la comunidad",
      "status": "PENDING",
      "createdAt": "2026-03-28T18:00:00.000Z"
    }
  ]
}
```

### Behavior notes

- Only requests with `status=PENDING` and `archivedAt=null` are returned
- Items are ordered by `createdAt` descending

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in `communityId` |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid query params |

---

## 3. Create request

`POST /api/requests`

Creates either a `JOIN` request or an `UPDATE_INFO` request.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

The endpoint uses a discriminated union on `type`.

---

### 3.1 Create `JOIN` request

Use this to request access to a community by access code.

```json
{
  "type": "JOIN",
  "accessCode": "SGECA234",
  "proposedAlias": "Ana",
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "streetNumberKm": "12",
  "block": "A",
  "floor": "2",
  "door": "B",
  "requestComment": "Quiero unirme a la comunidad"
}
```

Validation rules:

| Field | Rules |
|---|---|
| `type` | Must be `JOIN` |
| `accessCode` | Required, valid 8-char community access code |
| `proposedAlias` | Required, trimmed, max `120` |
| `country` | Required, max `100` |
| `province` | Required, max `120` |
| `municipality` | Required, max `120` |
| `streetType` | Required, max `50` |
| `streetName` | Required, max `255` |
| `postalCode` | Required, valid Spanish postal code |
| `streetNumberKm` | Required, valid street number / km format |
| `block` | Optional, max `30` |
| `floor` | Optional, max `30` |
| `door` | Optional, max `30` |
| `requestComment` | Optional, max `2000` |

Business rules:

- `accessCode` must resolve to an active community
- User must not already belong to that community
- User must not already have a pending visible request for that community

---

### 3.2 Create `UPDATE_INFO` request

Use this to request an update of membership/property data in a community the user already belongs to.

```json
{
  "type": "UPDATE_INFO",
  "communityId": "uuid",
  "proposedAlias": "Ana",
  "country": "España",
  "province": "Madrid",
  "municipality": "Madrid",
  "streetType": "Calle",
  "streetName": "Mayor",
  "postalCode": "28001",
  "streetNumberKm": "12",
  "block": "A",
  "floor": "2",
  "door": "B",
  "requestComment": "Quiero actualizar mis datos"
}
```

Validation rules:

| Field | Rules |
|---|---|
| `type` | Must be `UPDATE_INFO` |
| `communityId` | Required, UUID |
| `proposedAlias` | Required, trimmed, max `120` |
| `country` | Required, max `100` |
| `province` | Required, max `120` |
| `municipality` | Required, max `120` |
| `streetType` | Required, max `50` |
| `streetName` | Required, max `255` |
| `postalCode` | Required, valid Spanish postal code |
| `streetNumberKm` | Required, valid street number / km format |
| `block` | Optional, max `30` |
| `floor` | Optional, max `30` |
| `door` | Optional, max `30` |
| `requestComment` | Optional, max `2000` |

Business rules:

- User must belong to `communityId`
- User must not already have a pending visible request for that community

Important for frontend:

- `proposedAlias` is required by backend for `UPDATE_INFO`
- The current frontend service may treat alias as optional, but the backend contract does not

### Success

- Status: `201 Created`

```json
{
  "message": "Solicitud de alta creada correctamente.",
  "community": {
    "id": "uuid",
    "name": "Comunidad SIGECO"
  },
  "request": {
    "id": "uuid",
    "type": "JOIN",
    "status": "PENDING",
    "createdAt": "2026-03-28T18:00:00.000Z"
  },
  "details": {
    "proposedAlias": "Ana",
    "label": "Vivienda de Ana"
  }
}
```

The message for `UPDATE_INFO` is:

```text
Solicitud de actualización de datos creada correctamente.
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to community for `UPDATE_INFO` |
| `404` | `NOT_FOUND` | Access code not found or community not found |
| `409` | `CONFLICT` | User already belongs to community or already has a pending request for that community |
| `422` | `VALIDATION_ERROR` | Invalid body |

---

## 4. Cancel request

`POST /api/requests/:requestId/cancel`

Cancels one of the authenticated user's own pending requests.

### Request

Requires:

- valid `sid` cookie
- `requestId` path param as UUID

No request body.

### Business rules

- Request must belong to the authenticated user
- Archived requests cannot be cancelled
- Only `PENDING` requests can be cancelled

### Success

- Status: `200 OK`

```json
{
  "message": "Solicitud cancelada correctamente.",
  "request": {
    "id": "uuid",
    "type": "JOIN",
    "status": "CANCELLED",
    "createdAt": "2026-03-28T18:00:00.000Z",
    "resolvedAt": null,
    "cancelledAt": "2026-03-29T10:00:00.000Z",
    "archivedAt": null
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Request does not belong to user or is already archived |
| `404` | `NOT_FOUND` | Request not found |
| `409` | `CONFLICT` | Request is not pending |
| `422` | `VALIDATION_ERROR` | Invalid `requestId` |

---

## 5. Archive request

`POST /api/requests/:requestId/archive`

Archives one of the authenticated user's own non-archived requests.

### Request

Requires:

- valid `sid` cookie
- `requestId` path param as UUID

No request body.

### Business rules

- Request must belong to the authenticated user
- Already archived requests cannot be archived again
- Only `APPROVED`, `REJECTED` or `CANCELLED` requests can be archived

### Success

- Status: `200 OK`

```json
{
  "message": "Solicitud archivada correctamente.",
  "request": {
    "id": "uuid",
    "type": "JOIN",
    "status": "APPROVED",
    "createdAt": "2026-03-28T18:00:00.000Z",
    "resolvedAt": "2026-03-29T10:00:00.000Z",
    "cancelledAt": null,
    "archivedAt": "2026-03-30T11:00:00.000Z"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Request does not belong to user or is already archived |
| `404` | `NOT_FOUND` | Request not found |
| `409` | `CONFLICT` | Request is not in an archivable state |
| `422` | `VALIDATION_ERROR` | Invalid `requestId` |

---

## 6. Approve request

`POST /api/requests/:requestId/approve`

Approves a pending request and materializes its effects.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "resolutionMessage": "Solicitud aprobada"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `resolutionMessage` | Optional, trimmed, max `2000` |

### Business rules

- Caller must be active admin in the request community
- Archived requests are treated as not found
- Only `PENDING` requests can be approved

Effects when approving `JOIN`:

- Creates a new `MEMBER` membership, or reopens a previously ended one
- Creates or updates the related property
- If the user has no `lastActiveMembershipId`, it is set to the new membership
- Active sessions with `activeMembershipId=null` may be updated to the new membership

Effects when approving `UPDATE_INFO`:

- Updates the active membership alias
- Creates or updates the related property

### Success

- Status: `200 OK`

```json
{
  "message": "Solicitud aprobada correctamente.",
  "request": {
    "id": "uuid",
    "type": "JOIN",
    "status": "APPROVED",
    "createdAt": "2026-03-28T18:00:00.000Z",
    "resolvedAt": "2026-03-29T10:00:00.000Z",
    "cancelledAt": null,
    "archivedAt": null
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in the request community |
| `404` | `NOT_FOUND` | Request not found or archived |
| `409` | `CONFLICT` | Request is no longer approvable because of its state or current membership state |
| `422` | `VALIDATION_ERROR` | Invalid params/body |

### Frontend notes

- Approval can modify memberships and properties immediately
- After approval, frontend should refresh both the pending requests list and the affected user/community context views

---

## 7. Reject request

`POST /api/requests/:requestId/reject`

Rejects a pending request without changing memberships or properties.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "resolutionMessage": "Solicitud rechazada"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `resolutionMessage` | Optional, trimmed, max `2000` |

### Business rules

- Caller must be active admin in the request community
- Archived requests are treated as not found
- Only `PENDING` requests can be rejected

### Success

- Status: `200 OK`

```json
{
  "message": "Solicitud rechazada correctamente.",
  "request": {
    "id": "uuid",
    "type": "JOIN",
    "status": "REJECTED",
    "createdAt": "2026-03-28T18:00:00.000Z",
    "resolvedAt": "2026-03-29T10:00:00.000Z",
    "cancelledAt": null,
    "archivedAt": null
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in the request community |
| `404` | `NOT_FOUND` | Request not found or archived |
| `409` | `CONFLICT` | Request is not pending |
| `422` | `VALIDATION_ERROR` | Invalid params/body |

---

## Common request error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User does not own the request for cancel/archive | `403` | `FORBIDDEN` |
| User is not an active admin for request review | `403` | `FORBIDDEN` |
| Invalid UUID path/query param | `422` | `VALIDATION_ERROR` |
| Invalid create payload | `422` | `VALIDATION_ERROR` |
| Access code not found | `404` | `NOT_FOUND` |
| Request not found | `404` | `NOT_FOUND` |
| Request or membership state no longer allows transition | `409` | `CONFLICT` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "communityId",
        "location": "query",
        "message": "El campo communityId debe ser un UUID válido"
      }
    ]
  }
}
```
