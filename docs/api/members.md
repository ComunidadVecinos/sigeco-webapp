# Members API

> API index: [docs/api/README.md](./README.md)

This module manages community member listing, voluntary leave, expulsion, administrative role assignment or removal and membership suspension.

Base path:

- `/api/communities/:communityId/members`

---

## Scope

This module manages community member listing, voluntary leave, expulsion, administrative role assignment or removal and membership suspension.

---

## Access rules

| Endpoint group | Required access |
|---|---|
| `GET /api/communities/:communityId/members` | Active admin in that community |
| `POST /api/communities/:communityId/members/me/leave` | Membership in that community |
| `POST /api/communities/:communityId/members/:memberId/expel` | Active admin in that community |
| `PUT /api/communities/:communityId/members/:memberId/roles/:role` | Active admin in that community |
| `PUT /api/communities/:communityId/members/:memberId/suspension` | Active admin in that community |
| `DELETE /api/communities/:communityId/members/:memberId/suspension` | Active admin in that community |

Important:

- Community membership read access includes suspended members
- Administrative access requires `PRESIDENT` or `VICE_PRESIDENT` and the membership must not be currently suspended
- Some actions add extra business rules on top of administrative access

---

## Common response shapes

### Member summary

Used by the list endpoint.

```json
{
  "membershipId": "uuid",
  "alias": "Marta Miembro",
  "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
  "role": "MEMBER",
  "createdAt": "2026-03-28T18:00:00.000Z",
  "suspensionStatus": "ACTIVE",
  "suspendedAt": null,
  "suspendedUntil": null,
  "suspensionReason": null,
  "property": {
    "label": "2A",
    "country": "España",
    "province": "Madrid",
    "municipality": "Madrid",
    "streetType": "Calle",
    "streetName": "Mayor",
    "postalCode": "28001",
    "streetNumberKm": "12",
    "block": "A",
    "floor": "2",
    "door": "A",
    "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta A"
  }
}
```

Notes:

- `profileImageUrl` may be `null`
- `property` may be `null`
- `suspensionStatus` is one of `ACTIVE` or `INACTIVE`

### Role member summary

Used in role transfer responses.

```json
{
  "membershipId": "uuid",
  "communityId": "uuid",
  "alias": "Pablo Presidente",
  "role": "PRESIDENT"
}
```

### Suspended member summary

Used in suspension responses.

```json
{
  "membershipId": "uuid",
  "communityId": "uuid",
  "alias": "Sara Suspendida",
  "role": "MEMBER",
  "suspendedAt": "2026-03-28T18:00:00.000Z",
  "suspendedUntil": "2026-04-15T00:00:00.000Z",
  "suspensionStatus": "INACTIVE",
  "suspensionReason": "Incumplimiento temporal"
}
```

### Active membership summary

Returned after actions that may change the caller's active context:

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
| `GET` | `/api/communities/:communityId/members` | List community members |
| `POST` | `/api/communities/:communityId/members/me/leave` | Leave current community |
| `POST` | `/api/communities/:communityId/members/:memberId/expel` | Expel a member |
| `PUT` | `/api/communities/:communityId/members/:memberId/roles/:role` | Transfer, assign or remove an admin role |
| `PUT` | `/api/communities/:communityId/members/:memberId/suspension` | Suspend a member |
| `DELETE` | `/api/communities/:communityId/members/:memberId/suspension` | Cancel an active suspension |

---

## 1. List community members

`GET /api/communities/:communityId/members`

Returns a paginated list of active members of the target community.

### Request

Requires:

- valid `sid` cookie
- `communityId` path param as UUID
- active administrative access in that community

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `10` |
| `q` | No | Trimmed text search |
| `joinedAfter` | No | Valid date |
| `joinedBefore` | No | Valid date |
| `suspensionStatus` | No | `ACTIVE` or `INACTIVE` |

Filtering rules:

- `q` searches member `alias` and property address fields
- `joinedAfter` / `joinedBefore` are inclusive and are applied to the membership join timestamp used internally by backend
- `joinedAfter` cannot be later than `joinedBefore`
- `suspensionStatus=ACTIVE` returns members with no active suspension
- `suspensionStatus=INACTIVE` returns members with a future `suspendedUntil`

Ordering:

- `createdAt` descending
- `id` ascending as tie-breaker

### Success

- Status: `200 OK`

```json
{
  "items": [
    {
      "membershipId": "uuid",
      "alias": "Marta Miembro",
      "profileImageUrl": "/uploads/images/users/<userId>/avatar.png",
      "role": "MEMBER",
      "createdAt": "2026-03-28T18:00:00.000Z",
      "suspensionStatus": "ACTIVE",
      "suspendedAt": null,
      "suspendedUntil": null,
      "suspensionReason": null,
      "property": {
        "label": "2A",
        "country": "España",
        "province": "Madrid",
        "municipality": "Madrid",
        "streetType": "Calle",
        "streetName": "Mayor",
        "postalCode": "28001",
        "streetNumberKm": "12",
        "block": "A",
        "floor": "2",
        "door": "A",
        "formatted": "Calle Mayor 12, Bloque A, Piso 2, Puerta A"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User is not an active admin in that community |
| `404` | `NOT_FOUND` | Community not found |
| `422` | `VALIDATION_ERROR` | Invalid path/query params |

---

## 2. Leave current community

`POST /api/communities/:communityId/members/me/leave`

Lets the authenticated user leave a community.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "confirm": true
}
```

### Validation rules

| Field | Rules |
|---|---|
| `confirm` | Required, must be literal `true` |

Business rules:

- The user must belong to the community
- Suspended members can still leave
- A `PRESIDENT` cannot leave the community through this endpoint

### Success

- Status: `200 OK`

```json
{
  "leftCommunity": true,
  "communityId": "uuid",
  "activeMembership": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "role": "MEMBER",
    "alias": "Ana"
  }
}
```

`activeMembership` may be `null` if the user has no remaining memberships.

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to the community |
| `404` | `NOT_FOUND` | Community or user not found |
| `409` | `CONFLICT` | User is `PRESIDENT` or membership state is not valid |
| `422` | `VALIDATION_ERROR` | Invalid body |

## 3. Expel a member

`POST /api/communities/:communityId/members/:memberId/expel`

Closes the target membership and removes that user from the community.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "confirm": true,
  "reason": "Incumplimiento grave"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `confirm` | Required, must be literal `true` |
| `reason` | Optional, trimmed, max `2000` |

Business rules:

- Caller must have active admin access in the community
- Target membership must exist and still be active
- A `PRESIDENT` cannot be expelled

### Success

- Status: `200 OK`

```json
{
  "expelled": true,
  "communityId": "uuid",
  "memberId": "uuid"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Target member or community not found |
| `409` | `CONFLICT` | Target is `PRESIDENT` or membership cannot be finalized |
| `422` | `VALIDATION_ERROR` | Invalid params/body |

---

## 4. Transfer, assign or remove admin role

`PUT /api/communities/:communityId/members/:memberId/roles/:role`

Assigns one of the unique community administrative roles or removes the vice-presidency from the current vice-president.

Allowed role values:

- `MEMBER`
- `PRESIDENT`
- `VICE_PRESIDENT`

### Request

Requires:

- valid `sid` cookie
- `communityId` and `memberId` path params as UUID
- `role` path param as `PRESIDENT`, `VICE_PRESIDENT` or `MEMBER`
- active administrative access in the community

No request body.

### Business rules

#### When `role=PRESIDENT`

- Only the current `PRESIDENT` can transfer the presidency
- The previous president is downgraded to `MEMBER`
- The target becomes the new `PRESIDENT`

#### When `role=VICE_PRESIDENT`

- Caller must be `PRESIDENT` or `VICE_PRESIDENT`
- Target cannot currently be `PRESIDENT`
- A `PRESIDENT` cannot assign `VICE_PRESIDENT` to themself
- The previous vice-president, if different, is downgraded to `MEMBER`

#### When `role=MEMBER`

- Only the current `PRESIDENT` can perform this action
- The target must currently be the active `VICE_PRESIDENT`
- No new vice-president is assigned automatically
- The target is downgraded to `MEMBER`

### Success

- Status: `200 OK`

```json
{
  "targetMember": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "alias": "Veronica Vicepresidente",
    "role": "VICE_PRESIDENT"
  },
  "actorMembership": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "alias": "Pablo Presidente",
    "role": "PRESIDENT"
  }
}
```

Notes:

- The final `targetMember.role` depends on the requested role
- When `role=MEMBER`, the response returns the downgraded vice-president with role `MEMBER`

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller lacks required admin role for the requested transfer |
| `404` | `NOT_FOUND` | Target member or community not found |
| `409` | `CONFLICT` | Requested role transition is not allowed or update failed |
| `422` | `VALIDATION_ERROR` | Invalid params |

## 5. Suspend a member

`PUT /api/communities/:communityId/members/:memberId/suspension`

Applies a temporary suspension to a community membership.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "suspendedUntil": "2026-04-15T00:00:00.000Z",
  "suspensionReason": "Incumplimiento temporal"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `suspendedUntil` | Required, valid date, must be later than current time |
| `suspensionReason` | Optional, trimmed, max `2000` |

Business rules:

- Caller must have active admin access in the community
- Target membership must exist and still be active
- A `PRESIDENT` cannot be suspended

### Success

- Status: `200 OK`

```json
{
  "member": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "alias": "Sara Suspendida",
    "role": "MEMBER",
    "suspendedAt": "2026-03-28T18:00:00.000Z",
    "suspendedUntil": "2026-04-15T00:00:00.000Z",
    "suspensionStatus": "INACTIVE",
    "suspensionReason": "Incumplimiento temporal"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin or target is `PRESIDENT` |
| `404` | `NOT_FOUND` | Target member or community not found |
| `409` | `CONFLICT` | Suspension could not be applied |
| `422` | `VALIDATION_ERROR` | Invalid params/body |

---

## 6. Cancel member suspension

`DELETE /api/communities/:communityId/members/:memberId/suspension`

Removes the active suspension of a membership.

### Request

Requires:

- valid `sid` cookie
- `communityId` and `memberId` path params as UUID
- active admin access in the community

No request body.

### Business rules

- Target membership must exist and still be active
- Target must currently have an active suspension

### Success

- Status: `200 OK`

```json
{
  "member": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "alias": "Sara Suspendida",
    "role": "MEMBER",
    "suspendedAt": null,
    "suspendedUntil": null,
    "suspensionStatus": "ACTIVE",
    "suspensionReason": null
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | Caller is not an active admin in that community |
| `404` | `NOT_FOUND` | Target member or community not found |
| `409` | `CONFLICT` | Target is not currently suspended or suspension could not be cleared |
| `422` | `VALIDATION_ERROR` | Invalid params |

---

## Common member error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| User belongs to community but is not an active admin | `403` | `FORBIDDEN` |
| User does not belong to community | `403` | `FORBIDDEN` |
| Community or member UUID is invalid | `422` | `VALIDATION_ERROR` |
| Community does not exist | `404` | `NOT_FOUND` |
| Target membership does not exist or already ended | `404` | `NOT_FOUND` |
| Requested role/suspension transition is not allowed | `409` | `CONFLICT` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "confirm",
        "location": "body",
        "message": "Debes confirmar la operación"
      }
    ]
  }
}
```
