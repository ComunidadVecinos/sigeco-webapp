# SIGECO

SIGECO is a final-year academic project developed at the **Universidad Complutense de Madrid**. It is a web application for managing residential communities, including authentication, users, communities, requests, members, forum, news, incidents, reservations, voting, documents, calendar, and help content.

The repository is designed to run locally with Docker Compose and includes a seeded environment for review and functional testing.

## Quick start

### Requirements

- `Git`
- `Docker Desktop` or `Docker Engine + Docker Compose`

### Run the project

```bash
git clone https://github.com/ComunidadVecinos/sigeco-webapp.git
cd sigeco-webapp
cp .env.example .env
docker compose up -d --build
```

### Check that startup finished correctly

```bash
docker compose ps
docker compose logs -f db_init
```

## Local access

- Application: http://localhost
- MailPit inbox: http://localhost/mail

## Demo access

The local database is seeded automatically.

- Shared password: `Sigeco-2026!`
- Seeded users:
  - `president@ucm.es` — president of `Comunidad SIGECO`
  - `vice@ucm.es` — vice president of `Comunidad SIGECO`
  - `member@ucm.es` — regular member of `Comunidad SIGECO` with a pending `UPDATE_INFO` request
  - `suspended@ucm.es` — suspended member of `Comunidad SIGECO`
  - `double@ucm.es` — member of `Comunidad SIGECO` and president of `Comunidad SIGECO Norte`
  - `access@ucm.es` — member of `Comunidad SIGECO Norte` after an approved `JOIN` request
  - `nocommunity@ucm.es` — user without any community

## Useful commands

```bash
# Start or rebuild the stack
docker compose up -d --build

# Stop services
docker compose down

# Reset the local environment
docker compose down -v --remove-orphans
docker compose up -d --build

# Backend logs
docker compose logs -f backend

# Apply migrations
docker compose exec backend npm run db:deploy

# Rerun the seed
docker compose exec backend npm run db:seed

# Reset the database
docker compose exec backend npm run db:reset
```

## Project structure

- `frontend/`: React application
- `backend/`: Express API, Prisma schema, seed, and business logic
- `nginx/`: reverse proxy for local access
- `docs/`: architecture, database, and API documentation

## Documentation

- [Architecture overview](./docs/architecture/overview.md)
- [Database overview](./docs/database/overview.md)
- [API documentation](./docs/api/README.md)
