# SIGECO

**(Si)stema de (Ge)stion de (Co)munidades**

SIGECO is a web-based application for managing residential and homeowners communities.

It is developed as a **university academic project** and is designed to run **locally** using **Docker Compose**, which orchestrates all application components in a reproducible environment.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Scope and Limitations](#2-project-scope-and-limitations)
3. [Requirements](#3-requirements)
4. [Installation and Quick Start](#4-installation-and-quick-start)
5. [Core Functional Modules](#5-core-functional-modules)
6. [Architecture and Technology Stack](#6-architecture-and-technology-stack)
7. [Development Commands](#7-development-commands)
8. [Documentation](#8-documentation)

---

## 1. Overview

SIGECO provides a modular system designed to manage users, communities, and administrative processes within residential environments.

The main goal of this project is to demonstrate the design and implementation of a full-stack web application with a coherent and realistic functional domain, rather than to deliver a production-ready solution.

---

## 2. Project Scope and Limitations

This project is academic in nature and intentionally limited in scope.

Included:
- Local execution using Docker Compose.
- Cookie-based authentication with signed HttpOnly session cookie.
- Pre-seeded data for functional testing.
- Development email inbox via MailPit.

Explicitly excluded:
- Production deployment.
- Third-party auth providers.
- Cloud services and scalability concerns.
- Advanced security hardening.

---

## 3. Requirements

To run SIGECO locally, the following tools are required:

- Git
- Docker Desktop (Docker Engine + Docker Compose)

---

## 4. Installation and Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ComunidadVecinos/sigeco-webapp.git
cd sigeco-webapp
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

### 3. Build and start all services

```bash
docker compose up -d --build
```

Optional checks:

- Backend API conventions: [docs/api/README.md](./docs/api/README.md)
- Temporal contract summary:
  - any field with date and time is exposed as UTC ISO
  - backend keeps `Europe/Madrid` only as internal business timezone
  - frontend must render those UTC instants in `Europe/Madrid`

```bash
docker compose ps
docker compose logs -f db_init
```

### 4. Access local services

- Frontend: http://localhost
- Backend API (proxied by nginx): `http://localhost/api/*`
- MailPit UI (proxied by nginx): http://localhost/mail

Development note: abrir http://localhost/mail para ver emails de recovery/notifications.

---

### Authentication and Sessions (Quick Note)

SIGECO uses signed cookie-based sessions. Session behavior:
- Cookie name: `sid` (HttpOnly, Path=/, SameSite configurable).
- Session cookie is signed server-side with `SESSION_SECRET` and validated on each request.
- On password change/reset, previous cookies are invalidated via auth versioning.
- Frontend requests must include credentials (`credentials: "include"`).

### MailPit and forgot-password flow

`POST /api/auth/forgot-password` generates a temporary password and sends it via SMTP to MailPit in local development:

- SMTP host (from backend container): `mailpit`
- SMTP port: `1025`
- UI inbox: http://localhost/mail

### Seed demo accounts

The local database is seeded automatically on first startup.

- Shared password for demo users: `Sigeco-2026!`
- Example accounts: `president@ucm.es`, `vice@ucm.es`, `member@ucm.es`, `suspended@ucm.es`, `nocommunity@ucm.es`

---

## 5. Core Functional Modules

SIGECO is organised into the following functional modules:

- Authentication
- Communities
- Administration
- News Board
- Forum
- Common Areas Booking
- Incident Management
- Voting
- Documents
- Calendar
- Help & FAQ

Community administration currently covers community creation, administrative summary, basic data edition, access-code regeneration, avatar upload/deletion, and logical deletion of the community.

---

## 6. Architecture and Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Reverse Proxy | Nginx |
| Dev Email | MailPit |
| DevOps | Docker + Docker Compose |

---

## 7. Development Commands

### Docker lifecycle

```bash
# Start all services
docker compose up -d --build

# Restart all services keeping data
docker compose down
docker compose up -d --build

# Restart from a clean state (removes DB/storage volumes)
docker compose down -v --remove-orphans
docker compose up -d --build

# Stop and remove containers/networks
docker compose down
```

### Logs

```bash
docker compose logs -f db
docker compose logs -f db_init
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f mailpit
```

### Rebuild individual services

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
docker compose up -d --build nginx
```

### Database operations

```bash
# Apply migrations
docker compose exec backend npm run db:deploy

# Create migration (development)
docker compose exec backend npm run db:migrate -- --name <migration_name>

# Seed
docker compose exec backend npm run db:seed

# Reset DB (destructive)
docker compose exec backend npm run db:reset

# Prisma Studio (open http://localhost:5555)
docker compose run --rm -p 5555:5555 backend npx prisma studio --hostname 0.0.0.0 --port 5555
```

Notes:

- `db:seed` and `db:reset` are intended to be rerunnable in local development.
- The seed clears dependent module data first, including `forum`, `voting`, `calendar` and `news`, before deleting memberships and users.
- If you want a completely clean local environment, `docker compose down -v --remove-orphans` is still the safest option because it also recreates Docker volumes.
- Current business timezone semantics are documented in [docs/api/conventions.md](./docs/api/conventions.md): every backend field with date and time now travels as a UTC ISO instant, while `Europe/Madrid` remains only as the internal business timezone used to interpret, validate and segment community dates.

### Inspect DB quickly from Docker

```bash
docker compose exec db psql -U postgres -d appdb
```

Inside `psql`:

```sql
\dt
SELECT * FROM users LIMIT 20;
```

Recommended note:

- If Prisma Studio fails from Windows with `P1001` while Docker is healthy, prefer the Docker command above instead of running Prisma locally.
- For quick manual inspection without Studio, `psql` inside the `db` container is the simplest fallback.

---

## 8. Documentation

Technical documentation is located in `/docs`:

- [Architecture overview](docs/architecture/overview.md)
- [Database documentation](docs/database/overview.md)
- [API docs index](docs/api/README.md)
