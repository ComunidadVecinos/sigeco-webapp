# API Documentation

This directory contains the current HTTP contract for the SIGECO backend.

Base API path: `/api`

Core technical reference: [conventions.md](./conventions.md)

---

## Top-level modules

| Module | Base path | Document |
|---|---|---|
| Authentication | `/api/auth` | [auth.md](./auth.md) |
| Users | `/api/users` | [users.md](./users.md) |
| Help | `/api/help` | [help.md](./help.md) |
| Requests | `/api/requests` | [requests.md](./requests.md) |
| Communities | `/api/communities` | [communities.md](./communities.md) |

---

## Community subresources

These modules are mounted under `/api/communities/:communityId/...` and inherit the target community from the parent path.

| Module | Base path | Document |
|---|---|---|
| Members | `/api/communities/:communityId/members` | [members.md](./members.md) |
| Help | `/api/communities/:communityId/help` | [help.md](./help.md) |
| Calendar | `/api/communities/:communityId/calendar` | [calendar.md](./calendar.md) |
| Voting | `/api/communities/:communityId/voting` | [voting.md](./voting.md) |
| Forum | `/api/communities/:communityId/forum` | [forum.md](./forum.md) |
| News | `/api/communities/:communityId/news` | [news.md](./news.md) |
| Incidents | `/api/communities/:communityId/incidents` | [incidents.md](./incidents.md) |
| Documents | `/api/communities/:communityId/documents` | [documents.md](./documents.md) |
| Reservations | `/api/communities/:communityId/reservations` | [reservations.md](./reservations.md) |

---

## Technical endpoints

| Path | Description |
|---|---|
| `GET /api/health` | Lightweight health endpoint for deployment and diagnostics |
| `/uploads/*` | Public static asset surface used by files already exposed by the API |

`/uploads/*` is only the public URL space for assets already exposed by API payloads.
