# Reservations API

> API index: [docs/api/README.md](./README.md)

This module manages reservable community spaces, availability and bookings.

Base path: `/api/communities/:communityId/reservations`

---

## Access rules

| Endpoint group | Required access |
|---|---|
| Space detail, availability, calendar, my bookings, booking detail and booking creation | Operational membership in the community |
| Space create, update, status change and delete | Active administrative access in the community |
| Community booking list | Active administrative access in the community |

Shared business rules:

- Suspended members cannot access this module
- Only administrators can query inactive spaces
- New bookings are rejected when the selected space is inactive
- Reservation dates use `YYYY-MM-DD`
- Monthly space calendars use `YYYY-MM`

---

## Common resource shapes

### Space item

```json
{
  "id": "uuid",
  "name": "Social room",
  "description": "Meetings and neighborhood activities",
  "colorHex": "#1F6FEB",
  "isActive": true,
  "totalCapacity": 20,
  "occupancyMode": "SHARED",
  "maxSeatsPerBooking": 6,
  "openingTime": "09:00",
  "closingTime": "21:00",
  "slotMinutes": 60,
  "allowedDays": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "maxConsecutiveSlots": 2,
  "minAdvanceMinutes": 60,
  "maxAdvanceDays": 30,
  "cancellationNoticeMinutes": 120,
  "createdAt": "2026-04-14T12:00:00.000Z",
  "updatedAt": "2026-04-14T12:00:00.000Z"
}
```

### Booking item

```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "date": "2026-04-20",
  "startTime": "18:00",
  "endTime": "20:00",
  "slotCount": 2,
  "requestedSeats": 4,
  "startsAt": "2026-04-20T16:00:00.000Z",
  "endsAt": "2026-04-20T18:00:00.000Z",
  "createdAt": "2026-04-14T12:00:00.000Z",
  "updatedAt": "2026-04-14T12:00:00.000Z",
  "cancelledAt": null,
  "cancellationReason": null,
  "canCancel": true,
  "space": {
    "id": "uuid",
    "name": "Social room",
    "colorHex": "#1F6FEB",
    "isActive": true,
    "occupancyMode": "SHARED",
    "totalCapacity": 20,
    "maxSeatsPerBooking": 6
  },
  "owner": {
    "membershipId": "uuid",
    "alias": "Neighbor 3A",
    "role": "MEMBER"
  },
  "cancelledBy": null
}
```

### Booking rules payload

```json
{
  "maxConsecutiveSlots": 2,
  "minAdvanceMinutes": 60,
  "maxAdvanceDays": 30,
  "cancellationNoticeMinutes": 120,
  "oneBookingPerDay": true
}
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/reservations/spaces` | Create a reservable space |
| `GET` | `/api/communities/:communityId/reservations/spaces` | List spaces |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Get one space |
| `PATCH` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Update one space |
| `PATCH` | `/api/communities/:communityId/reservations/spaces/:spaceId/status` | Change one space status |
| `DELETE` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Soft-delete one space |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId/availability` | Get one-day availability |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId/calendar` | Get one space monthly occupancy |
| `POST` | `/api/communities/:communityId/reservations/bookings` | Create one booking |
| `GET` | `/api/communities/:communityId/reservations/bookings/me` | List my bookings |
| `GET` | `/api/communities/:communityId/reservations/bookings/:bookingId` | Get one booking |
| `POST` | `/api/communities/:communityId/reservations/bookings/:bookingId/cancel` | Cancel one booking |
| `GET` | `/api/communities/:communityId/reservations/bookings` | List community bookings for administrators |

---

## 1. Create space

`POST /api/communities/:communityId/reservations/spaces`

### Request

```json
{
  "name": "Pool",
  "description": "Swimming slots",
  "colorHex": "#0EA5E9",
  "isActive": true,
  "totalCapacity": 12,
  "occupancyMode": "SHARED",
  "maxSeatsPerBooking": 4,
  "openingTime": "10:00",
  "closingTime": "20:00",
  "slotMinutes": 60,
  "allowedDays": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": true
  },
  "maxConsecutiveSlots": 2,
  "minAdvanceMinutes": 60,
  "maxAdvanceDays": 30,
  "cancellationNoticeMinutes": 120
}
```

### Validation and business rules

- `name` is required and limited to `160` characters
- `description` is optional
- `colorHex` must use `#RRGGBB`
- `openingTime` and `closingTime` must use `HH:mm`
- `openingTime` must be earlier than `closingTime`
- The daily schedule must be divisible by `slotMinutes`
- At least one allowed day must be enabled
- `maxConsecutiveSlots` cannot exceed the number of slots available in one day
- `maxSeatsPerBooking` is only valid in `SHARED` mode and cannot exceed `totalCapacity`

### Success

- Status: `201 Created`

```json
{
  "space": {}
}
```

The `space` object follows the `Space item` shape documented above.

---

## 2. List spaces

`GET /api/communities/:communityId/reservations/spaces`

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `10` |
| `search` | No | Case-insensitive match over `name` and `description` |
| `status` | No | `active`, `inactive` or `all`; default `active` |

### Success

- Status: `200 OK`

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

Items in the `items` array follow the `Space item` shape.

---

## 3. Get one space

`GET /api/communities/:communityId/reservations/spaces/:spaceId`

### Success

- Status: `200 OK`

```json
{
  "space": {}
}
```

---

## 4. Update one space

`PATCH /api/communities/:communityId/reservations/spaces/:spaceId`

### Request

Any non-empty subset of the editable space fields may be sent.

```json
{
  "description": "Updated description",
  "slotMinutes": 30,
  "allowedDays": {
    "saturday": true,
    "sunday": false
  }
}
```

### Business rules

- The final merged configuration must remain valid
- Structural changes are blocked while the space still has future active bookings
- `description` and `maxSeatsPerBooking` may be explicitly set to `null`

### Success

- Status: `200 OK`
- Response returns `{ "space": ... }`

---

## 5. Change space status

`PATCH /api/communities/:communityId/reservations/spaces/:spaceId/status`

### Request

```json
{
  "isActive": false
}
```

### Success

- Status: `200 OK`
- Response returns `{ "space": ... }`

---

## 6. Delete one space

`DELETE /api/communities/:communityId/reservations/spaces/:spaceId`

### Success

- Status: `200 OK`

```json
{
  "deleted": true,
  "spaceId": "uuid"
}
```

Deletion is logical.

---

## 7. Get one-day availability

`GET /api/communities/:communityId/reservations/spaces/:spaceId/availability?date=2026-04-20`

### Query params

| Param | Required | Rules |
|---|---|---|
| `date` | Yes | `YYYY-MM-DD` |

### Success

- Status: `200 OK`

```json
{
  "space": {},
  "bookingRules": {
    "maxConsecutiveSlots": 2,
    "minAdvanceMinutes": 60,
    "maxAdvanceDays": 30,
    "cancellationNoticeMinutes": 120,
    "oneBookingPerDay": true
  },
  "date": "2026-04-20",
  "slots": [
    {
      "slotIndex": 0,
      "startTime": "10:00",
      "endTime": "11:00",
      "available": true,
      "bookedSeats": 0,
      "remainingCapacity": 12
    }
  ]
}
```

### Availability rules

- `available` is `false` when the space is inactive
- `available` is `false` when the selected business day is not enabled for that space
- In `EXCLUSIVE` mode, any overlapping active booking blocks the whole slot
- In `SHARED` mode, `remainingCapacity` reflects the free seats for each slot

---

## 8. Get space calendar

`GET /api/communities/:communityId/reservations/spaces/:spaceId/calendar?month=2026-04`

### Query params

| Param | Required | Rules |
|---|---|---|
| `month` | Yes | `YYYY-MM` |

### Success

- Status: `200 OK`

```json
{
  "month": "2026-04",
  "items": [
    {
      "bookingId": "uuid",
      "date": "2026-04-20",
      "startTime": "18:00",
      "endTime": "20:00",
      "requestedSeats": 4,
      "status": "ACTIVE"
    }
  ]
}
```

This monthly view does not expose booking owner data.

---

## 9. Create booking

`POST /api/communities/:communityId/reservations/bookings`

### Request

```json
{
  "spaceId": "uuid",
  "date": "2026-04-20",
  "startTime": "18:00",
  "slotCount": 2,
  "requestedSeats": 4
}
```

### Validation and business rules

- `spaceId` must be a valid UUID
- `startTime` must align with the configured slot grid
- The booking must finish before the configured closing time
- `slotCount` must not exceed `maxConsecutiveSlots`
- The booking must respect `minAdvanceMinutes` and `maxAdvanceDays`
- Only one active booking per member, space and day is allowed
- `EXCLUSIVE` mode forbids any overlapping booking
- `SHARED` mode requires enough remaining capacity across all selected slots
- `requestedSeats` cannot exceed `totalCapacity`
- In `SHARED` mode, `requestedSeats` must also respect `maxSeatsPerBooking` when configured

### Success

- Status: `201 Created`

```json
{
  "booking": {}
}
```

The `booking` object follows the `Booking item` shape.

Creating a booking also creates the linked personal `RESERVATION` event in the community calendar.

---

## 10. List my bookings

`GET /api/communities/:communityId/reservations/bookings/me`

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `10` |
| `scope` | No | `upcoming`, `past`, `cancelled` or `all`; default `upcoming` |
| `spaceId` | No | UUID |

### Success

- Status: `200 OK`

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

Items in the `items` array follow the `Booking item` shape.

---

## 11. Get one booking

`GET /api/communities/:communityId/reservations/bookings/:bookingId`

Accessible to the booking owner and to administrators of the same community.

### Success

- Status: `200 OK`

```json
{
  "booking": {}
}
```

---

## 12. Cancel one booking

`POST /api/communities/:communityId/reservations/bookings/:bookingId/cancel`

### Request

```json
{
  "reason": "Maintenance window"
}
```

`reason` is optional.

### Business rules

- Administrators can cancel any active booking in the community
- Non-admin users can cancel only their own active bookings
- Non-admin cancellation must still respect the configured `cancellationNoticeMinutes`

### Success

- Status: `200 OK`

```json
{
  "booking": {}
}
```

Cancelling a booking also soft-deletes the linked reservation calendar event.

---

## 13. List community bookings

`GET /api/communities/:communityId/reservations/bookings`

### Query params

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, min `1`, default `1` |
| `pageSize` | No | Integer, min `1`, max `100`, default `10` |
| `status` | No | `active`, `cancelled` or `all`; default `active` |
| `spaceId` | No | UUID |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |

### Success

- Status: `200 OK`

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

Items in the `items` array follow the `Booking item` shape.

---

## Common reservation error cases

| Scenario | Status | Code |
|---|---|---|
| Missing or invalid session | `401` | `UNAUTHORIZED` |
| User lacks operational or administrative community access | `403` | `FORBIDDEN` |
| Non-admin user requests inactive spaces | `403` | `FORBIDDEN` |
| Target space or booking does not exist | `404` | `NOT_FOUND` |
| Invalid params, query or body payload | `422` | `VALIDATION_ERROR` |
| Space configuration or requested booking range is invalid | `422` | `VALIDATION_ERROR` |
| Space or booking state prevents the requested action | `409` | `CONFLICT` |
