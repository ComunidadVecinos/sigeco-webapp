# SIGECO API Documentation

This directory is the API documentation hub for the current SIGECO backend.

- Base path (behind nginx): `/api`
- Public uploaded assets: `/uploads/*`
- Main formats: `application/json` and `multipart/form-data` for avatar uploads
- Auth model: signed session cookie (`sid`)

This index is the canonical entry point for API docs from the project root `README.md`.

---

## Start here

1. Read [API Conventions](./conventions.md) for cross-cutting rules shared by the backend.
2. Read [Authentication](./auth.md) before integrating any protected flow.
3. Use module pages only as references for the areas that are already maintained.

---

## Current documentation status

| Area | Status | Notes |
|---|---|---|
| [API Conventions](./conventions.md) | Maintained | Shared contract details needed by frontend |
| [Authentication](./auth.md) | Maintained | Session lifecycle and auth endpoints |
| [Communities](./communities.md) | Maintained | Core community admin endpoints |
| [Help Center](./help.md) | Maintained | Global and community help endpoints |
| [Members](./members.md) | Maintained | Community member admin and lifecycle endpoints |
| [Requests](./requests.md) | Maintained | User and admin request workflows |
| [Users](./users.md) | Maintained | Authenticated profile and self-service endpoints |
| [Forum](./forum.md) | Draft | Structured placeholder for a future module |
| [Calendar](./calendar.md) | Maintained | Community month view and personal event endpoints |
| [Announcements](./announcements.md) | Draft | Structured placeholder for a future module |
| [Documents](./documents.md) | Draft | Structured placeholder for a future module |
| [Incidents](./incidents.md) | Draft | Structured placeholder for a future module |
| [Voting](./votes.md) | Draft | Structured placeholder for a future module |
| [Reservations](./reservations.md) | Draft | Structured placeholder for a future module |

---

## Common contract notes

- Protected routes require the browser session cookie and frontend requests must send credentials.
- Successful responses do not use a global `data` wrapper. Each endpoint returns its domain payload directly.
- Error responses do use a common envelope: `error.code`, `error.message`, and optional `error.details`.
- Most resource identifiers exposed by the API are UUID strings.
- Datetime fields are usually returned as ISO 8601 strings. Some business-date fields use `YYYY-MM-DD`, and some time-only fields use `HH:mm`.

For the exact shared rules and examples, see [API Conventions](./conventions.md).

---

## Module index

- [API Conventions](./conventions.md)
- [Authentication](./auth.md)
- [Communities](./communities.md)
- [Help Center](./help.md)
- [Members](./members.md)
- [Requests](./requests.md)
- [Users](./users.md)
- [Forum](./forum.md)
- [Calendar](./calendar.md)
- [Announcements](./announcements.md)
- [Documents](./documents.md)
- [Incidents](./incidents.md)
- [Voting](./votes.md)
- [Reservations](./reservations.md)
