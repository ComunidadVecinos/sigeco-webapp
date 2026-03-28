# Users API

> API index: [docs/api/README.md](./README.md)

This module exposes self-service operations for the authenticated user profile.

Base path: `/api/users`

---

## Overview

### What this module does

- Returns the aggregated profile of the authenticated user
- Updates the user's basic profile data
- Changes the active community context used by the current session
- Uploads or replaces the user's avatar
- Soft-deletes the current account

### What this module does not do

- It does **not** expose public profile lookup endpoints
- It does **not** expose administrative user management
- All routes in this module operate only on `/me`

---

## Access rules

All endpoints in this module require a valid authenticated session cookie.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users/me` | Get the authenticated profile summary |
| `PATCH` | `/api/users/me` | Update the authenticated profile |
| `PUT` | `/api/users/me/active-community` | Change the active community context |
| `PUT` | `/api/users/me/avatar` | Upload or replace the profile avatar |
| `DELETE` | `/api/users/me` | Delete the authenticated account |

---

## Common response shapes

### Profile response

`GET /me` and `PATCH /me` return the same shape:

```json
{
  "id": "uuid",
  "firstName": "Ana",
  "lastName": "Garcia",
  "email": "ana@ucm.es",
  "phone": "600123456",
  "profileImageUrl": "/uploads/users/avatar.jpg",
  "activeCommunityId": "uuid",
  "communities": [
    {
      "communityId": "uuid",
      "name": "Comunidad SIGECO",
      "role": "MEMBER",
      "address": "Calle Mayor 12",
      "addressDetails": {
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
      "province": "Madrid",
      "municipality": "Madrid",
      "memberSince": "2026-01-10T09:30:00.000Z",
      "alias": "Ana Vecina",
      "suspensionActive": false,
      "suspensionUntil": null
    }
  ]
}
```

Notes:

- `profileImageUrl` is a public URL or `null`
- `activeCommunityId` is the community selected in the current access context or `null`
- `communities` includes only memberships that are not deleted, not ended, and belong to non-deleted communities
- `communities` is ordered by `joinedAt` ascending
- `address` is a UI-friendly string and may be `null`
- `addressDetails` may be `null` when the membership has no active property

### Active community change response

`PUT /me/active-community` returns a reduced access-context payload:

```json
{
  "activeMembership": {
    "membershipId": "uuid",
    "communityId": "uuid",
    "role": "VICE_PRESIDENT",
    "alias": "Ana Admin"
  },
  "context": {
    "actorType": "DelegatedAdmin"
  }
}
```

Possible `context.actorType` values:

| Value | Meaning |
|---|---|
| `RegisteredUserNoCommunity` | User has no active community membership |
| `StandardMember` | User is a normal community member |
| `DelegatedAdmin` | User is `VICE_PRESIDENT` |
| `PrincipalAdmin` | User is `PRESIDENT` |

---

## 1. Get my profile

`GET /api/users/me`

Returns the aggregated profile of the authenticated user.

### Request

Requires valid `sid` cookie.

No request body.

### Success

- Status: `200 OK`

Response shape: see [Profile response](#profile-response).

### Backend behavior relevant to frontend

- `profileImageUrl` is derived from the stored avatar file and may be `null`
- `communities[].address` uses the property's formatted address when available, otherwise the property label, otherwise `null`
- `communities[].suspensionActive` is computed from `suspendedAt` and `suspendedUntil`

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `500` | `INTERNAL_ERROR` | Backend could not resolve the current profile/context |

---

## 2. Update my profile

`PATCH /api/users/me`

Updates the authenticated user's basic profile data.

Important:

- Even though the method is `PATCH`, backend expects the full editable profile payload
- `phone` is optional, but `firstName`, `lastName` and `email` are required

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "firstName": "Ana",
  "lastName": "Garcia",
  "email": "ana@ucm.es",
  "phone": "600 123 456"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `firstName` | Required, trimmed, letters/spaces/apostrophe/hyphen only |
| `lastName` | Required, trimmed, letters/spaces/apostrophe/hyphen only |
| `email` | Required, valid email, normalized to lowercase, must end with `@ucm.es` |
| `phone` | Optional, 9 digits, spaces allowed, normalized before saving |

### Success

- Status: `200 OK`

Response shape: same as `GET /api/users/me`.

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `422` | `VALIDATION_ERROR` | Invalid body |
| `422` | `EMAIL_ALREADY_REGISTERED` | Another user already uses that email |
| `422` | `PHONE_ALREADY_REGISTERED` | Another user already uses that phone |

---

## 3. Change active community

`PUT /api/users/me/active-community`

Changes the active community context for both the current session and the persisted user preference.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "communityId": "uuid"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `communityId` | Required, valid UUID |

### Backend behavior relevant to frontend

- Backend updates both the current session and `lastActiveMembershipId` on the user
- The target community must exist and the user must still belong to it
- Suspended memberships can still be selected as active context, as long as the membership is not deleted or ended
- The response returns the recalculated `actorType`

### Success

- Status: `200 OK`

Response shape: see [Active community change response](#active-community-change-response).

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `403` | `FORBIDDEN` | User does not belong to that community |
| `404` | `ACTIVE_COMMUNITY_NOT_FOUND` | Community does not exist |
| `422` | `ACTIVE_COMMUNITY_INVALID` | `communityId` is missing or not a valid UUID |

---

## 4. Update my avatar

`PUT /api/users/me/avatar`

Uploads or replaces the current profile avatar.

### Request

```http
Content-Type: multipart/form-data
Cookie: sid=<session_cookie>
```

Form field:

| Field | Type | Rules |
|---|---|---|
| `avatar` | File | Required, JPG or PNG, max `5 MB` |

Example:

```ts
const formData = new FormData();
formData.append('avatar', file);

await axios.put('/api/users/me/avatar', formData, {
  withCredentials: true,
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Backend behavior relevant to frontend

- Backend validates both the reported MIME type and the binary signature of the uploaded file
- Upload replaces the previous avatar if one already exists
- Response returns the new public URL ready to render

### Success

- Status: `200 OK`

```json
{
  "profileImageUrl": "/uploads/users/avatar.jpg"
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `404` | `NOT_FOUND` | Authenticated user no longer exists |
| `413` | `FILE_TOO_LARGE` | File exceeds `5 MB` |
| `415` | `FILE_TYPE_UNSUPPORTED` | File is not a valid JPG/PNG |
| `422` | `VALIDATION_ERROR` | Missing `avatar` file |
| `503` | `STORAGE_UNAVAILABLE` | Storage layer could not persist the file |

---

## 5. Delete my account

`DELETE /api/users/me`

Soft-deletes the authenticated account and clears the current session cookie.

### Request

```http
Content-Type: application/json
Cookie: sid=<session_cookie>
```

```json
{
  "email": "ana@ucm.es",
  "confirmationText": "ELIMINAR MI CUENTA"
}
```

### Validation rules

| Field | Rules |
|---|---|
| `email` | Required, valid email, normalized to lowercase, must match the authenticated user's current email |
| `confirmationText` | Required, non-empty string, must be exactly `ELIMINAR MI CUENTA` |

### Backend behavior relevant to frontend

- On success, backend invalidates all active sessions of the user
- The current response clears the `sid` cookie
- Memberships are ended and soft-deleted
- Related properties of those memberships are soft-deleted
- The avatar DB record is removed and the stored file is deleted asynchronously
- The response includes a `futureDataPolicy` object with pending cleanup notes for other domains

### Success

- Status: `200 OK`

```json
{
  "message": "Cuenta eliminada correctamente.",
  "futureDataPolicy": {
    "votesCalendarReservations": "pending_soft_delete_or_disassociation",
    "authorship": "pending_anonymization"
  }
}
```

### Expected errors

| Status | Code | Notes |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing, invalid or expired session |
| `409` | `CONFLICT` | Account could not be deleted in its current state |
| `422` | `VALIDATION_ERROR` | Invalid body |
| `422` | `ACCOUNT_DELETION_EMAIL_MISMATCH` | `email` does not match the authenticated user |
| `422` | `CONFIRMATION_TEXT_MISMATCH` | `confirmationText` is not exactly `ELIMINAR MI CUENTA` |
| `500` | `ACCOUNT_DELETION_FAILED` | Backend failed during account deletion |

---

## Common users error cases

| Scenario | Status | Code |
|---|---|---|
| Missing session cookie | `401` | `UNAUTHORIZED` |
| Invalid or expired session | `401` | `UNAUTHORIZED` |
| Invalid profile payload | `422` | `VALIDATION_ERROR` |
| Email already in use when updating profile | `422` | `EMAIL_ALREADY_REGISTERED` |
| Phone already in use when updating profile | `422` | `PHONE_ALREADY_REGISTERED` |
| Invalid active community payload | `422` | `ACTIVE_COMMUNITY_INVALID` |
| Selected active community does not exist | `404` | `ACTIVE_COMMUNITY_NOT_FOUND` |
| Missing avatar file | `422` | `VALIDATION_ERROR` |
| Invalid account deletion confirmation text | `422` | `CONFIRMATION_TEXT_MISMATCH` |
| Email mismatch during account deletion | `422` | `ACCOUNT_DELETION_EMAIL_MISMATCH` |

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      {
        "field": "email",
        "location": "body",
        "message": "El correo electrónico debe coincidir con el del usuario autenticado"
      }
    ]
  }
}
```

---

## Frontend integration notes

- Call `GET /api/users/me` after login if frontend needs the full profile, avatar and community summaries
- Treat `PATCH /api/users/me` as a full form submit, not as a partial patch
- Use the `activeCommunityId` in this module together with the auth `context` when frontend needs to keep community-scoped UI synchronized
- Treat returned `profileImageUrl` values as directly renderable public URLs
