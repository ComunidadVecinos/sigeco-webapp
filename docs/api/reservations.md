# Reservations API

> API index: [docs/api/README.md](./README.md)

Reservable spaces, availability, and bookings.

Base path: `/api/communities/:communityId/reservations`

## Access rules

| Endpoint group | Required access |
|---|---|
| Space detail, availability, space calendar, my bookings, booking detail, and booking creation | Operational membership in the community |
| Space create, update, status change, and delete | Active administrative access |
| Community booking list | Active administrative access |

Shared rules:

- Suspended members cannot use this module
- Inactive spaces cannot receive new bookings
- Reservation dates use `YYYY-MM-DD`
- Monthly space calendars use `YYYY-MM`

## Resource shapes

Space item:

```json
{
  "id": "uuid",
  "name": "Social room",
  "description": "Meetings and community activities",
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
  "cancellationNoticeMinutes": 120
}
```

Booking item:

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
  "endsAt": "2026-04-20T18:00:00.000Z"
}
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communities/:communityId/reservations/spaces` | Create a space |
| `GET` | `/api/communities/:communityId/reservations/spaces` | List spaces |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Get one space |
| `PATCH` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Update one space |
| `PATCH` | `/api/communities/:communityId/reservations/spaces/:spaceId/status` | Change space status |
| `DELETE` | `/api/communities/:communityId/reservations/spaces/:spaceId` | Delete one space |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId/availability` | Get one-day availability |
| `GET` | `/api/communities/:communityId/reservations/spaces/:spaceId/calendar` | Get one month of occupancy |
| `POST` | `/api/communities/:communityId/reservations/bookings` | Create one booking |
| `GET` | `/api/communities/:communityId/reservations/bookings/me` | List my bookings |
| `GET` | `/api/communities/:communityId/reservations/bookings/:bookingId` | Get one booking |
| `POST` | `/api/communities/:communityId/reservations/bookings/:bookingId/cancel` | Cancel one booking |
| `GET` | `/api/communities/:communityId/reservations/bookings` | List community bookings |

## Space contract

Create requests must include the full space configuration. Update requests accept any non-empty subset of editable fields.

Core rules:

- `name` is required and limited to `160` characters
- `colorHex` must use `#RRGGBB`
- `openingTime` and `closingTime` use `HH:mm`
- `openingTime` must be earlier than `closingTime`
- at least one allowed day must be enabled
- `occupancyMode` is `EXCLUSIVE` or `SHARED`
- `maxSeatsPerBooking` applies only to `SHARED` spaces

List spaces query:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `search` | No | Filter over `name` and `description` |
| `status` | No | `active`, `inactive`, or `all` |

## Availability and calendar

Availability query:

| Param | Required | Rules |
|---|---|---|
| `date` | Yes | `YYYY-MM-DD` |

Calendar query:

| Param | Required | Rules |
|---|---|---|
| `month` | Yes | `YYYY-MM` |

## Booking contract

Create request:

```json
{
  "spaceId": "uuid",
  "date": "2026-04-20",
  "startTime": "18:00",
  "slotCount": 2,
  "requestedSeats": 4
}
```

Cancel request:

```json
{
  "reason": "Schedule conflict"
}
```

Rules:

- `spaceId` must be a valid UUID
- `date` must use `YYYY-MM-DD`
- `startTime` must use `HH:mm`
- `slotCount` must be a positive integer
- `requestedSeats` defaults to `1`
- `reason` is optional

My bookings query:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `scope` | No | `upcoming`, `past`, `cancelled`, or `all` |
| `spaceId` | No | UUID |

Admin bookings query:

| Param | Required | Rules |
|---|---|---|
| `page` | No | Integer, default `1` |
| `pageSize` | No | Integer, default `10`, max `100` |
| `status` | No | `active`, `cancelled`, or `all` |
| `spaceId` | No | UUID |
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |
