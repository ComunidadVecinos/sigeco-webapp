# Calendar API

> API index: [docs/api/README.md](./README.md)

Community month view and personal calendar events.

Base path: `/api/communities/:communityId/calendar`

## Access rules

- All endpoints require an authenticated session
- Any community member can use this module, including suspended members
- Automatic events and personal events share the same public DTO
- API timestamps are returned as UTC ISO instants

## Event shape

```json
{
  "id": "uuid",
  "title": "Board meeting",
  "type": "NEWS",
  "startsAt": "2026-04-10T17:00:00.000Z",
  "endsAt": "2026-04-10T18:00:00.000Z"
}
```

`type` is one of `PERSONAL`, `NEWS`, `RESERVATION`, or `VOTING`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/communities/:communityId/calendar?month=YYYY-MM` | List one month of events |
| `POST` | `/api/communities/:communityId/calendar/personal` | Create a personal event |
| `PATCH` | `/api/communities/:communityId/calendar/personal/:eventId` | Update one owned personal event |
| `DELETE` | `/api/communities/:communityId/calendar/personal/:eventId` | Delete one owned personal event |

## Month query

`GET /api/communities/:communityId/calendar?month=YYYY-MM`

Returns:

```json
{
  "month": "2026-04",
  "content": []
}
```

- `month` is required and must use `YYYY-MM`
- The response is not paginated

## Personal events

Create request:

```json
{
  "title": "Call the administrator",
  "startsAt": "2026-04-12T08:00:00.000Z",
  "endsAt": "2026-04-12T08:30:00.000Z"
}
```

Update request:

```json
{
  "title": "Call the president"
}
```

Rules:

- `title` is required on creation and limited to `160` characters
- `startsAt` and `endsAt` must be valid ISO instants
- `endsAt` must be later than `startsAt`
- The final event must remain within the same business day in `Europe/Madrid`

Delete response:

```json
{
  "deleted": true,
  "eventId": "uuid"
}
```
