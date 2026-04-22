# Calendar API

> API index: [docs/api/README.md](./README.md)

Community month view and personal event management.

Base path: `/api/communities/:communityId/calendar`

---

## Key rules

- All endpoints require session
- Any community member, including suspended members, can use this module
- Automatic and personal events share the same public DTO
- The public API now exposes only `startsAt` and `endsAt` as **UTC ISO**
- Backend still stores and segments events by business day in `Europe/Madrid`

---

## Event DTO

```json
{
  "id": "uuid",
  "title": "Reserva pista 2",
  "type": "RESERVATION",
  "startsAt": "2026-04-10T16:00:00.000Z",
  "endsAt": "2026-04-10T17:00:00.000Z"
}
```

`type` is one of:

- `PERSONAL`
- `NEWS`
- `RESERVATION`
- `VOTING`

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/calendar?month=YYYY-MM` | Get visible events of one month |
| `POST` | `/api/communities/:communityId/calendar/personal` | Create a personal event |
| `PATCH` | `/api/communities/:communityId/calendar/personal/:eventId` | Update one owned personal event |
| `DELETE` | `/api/communities/:communityId/calendar/personal/:eventId` | Soft-delete one owned personal event |

---

## 1. Get month events

`GET /api/communities/:communityId/calendar?month=YYYY-MM`

Success:

```json
{
  "month": "2026-04",
  "content": [
    {
      "id": "uuid",
      "title": "Junta extraordinaria",
      "type": "NEWS",
      "startsAt": "2026-04-03T17:00:00.000Z",
      "endsAt": "2026-04-03T18:00:00.000Z"
    }
  ]
}
```

Notes:

- there is no pagination
- one automatic `NEWS` or `VOTING` source may appear as several entries in the same month
- the selected month is still a business-month filter expressed as `YYYY-MM`

---

## 2. Create personal event

`POST /api/communities/:communityId/calendar/personal`

```json
{
  "title": "Llamar al administrador",
  "startsAt": "2026-04-12T08:00:00.000Z",
  "endsAt": "2026-04-12T08:30:00.000Z"
}
```

Validation:

- `title`: required, max `160`
- `startsAt`: required UTC ISO instant
- `endsAt`: required UTC ISO instant

Rules:

- personal events must start and end on the same business day in `Europe/Madrid`
- `endsAt` must be later than `startsAt`

---

## 3. Update personal event

`PATCH /api/communities/:communityId/calendar/personal/:eventId`

Any non-empty subset of:

```json
{
  "title": "Llamar al presidente",
  "startsAt": "2026-04-13T09:00:00.000Z",
  "endsAt": "2026-04-13T09:30:00.000Z"
}
```

The final merged event still has to respect:

- same business day in `Europe/Madrid`
- `endsAt > startsAt`

---

## 4. Delete personal event

`DELETE /api/communities/:communityId/calendar/personal/:eventId`

Success:

```json
{
  "deleted": true,
  "eventId": "uuid"
}
```

