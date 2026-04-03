# SIGECO API Documentation

This directory is the API documentation hub for the current SIGECO backend.

- Base path: `/api`
- Public uploaded assets: `/uploads/*`
- Main formats: `application/json` and `multipart/form-data`
- Auth model: signed session cookie (`sid`)

---

## Start here

1. Read [API Conventions](./conventions.md).
2. Read [Authentication](./auth.md) before integrating protected flows.
3. Use module pages for maintained backend areas.

---

## Common contract notes

- Protected routes require browser credentials.
- Success responses do not use a global `data` wrapper.
- Error responses do use the standard `error.code`, `error.message`, `error.details`.
- Most resource identifiers are UUID strings.
- Every field with date and time now travels as **ISO 8601 UTC**.
- Backend still uses `Europe/Madrid` internally as business timezone.
- Frontend must render UTC instants in `Europe/Madrid`.

Development helpers:

- Prisma Studio from Docker:
  `docker compose run --rm -p 5555:5555 backend npx prisma studio --hostname 0.0.0.0 --port 5555`
- Quick SQL shell:
  `docker compose exec db psql -U postgres -d appdb`

---

## Maintained module docs

- [API Conventions](./conventions.md)
- [Authentication](./auth.md)
- [Communities](./communities.md)
- [Help Center](./help.md)
- [Members](./members.md)
- [Requests](./requests.md)
- [Users](./users.md)
- [Forum](./forum.md)
- [Calendar](./calendar.md)
- [News](./news.md)
- [Voting](./voting.md)

Draft placeholders:

- [Documents](./documents.md)
- [Incidents](./incidents.md)
- [Reservations](./reservations.md)
