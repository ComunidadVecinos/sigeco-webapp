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
- Stateful authentication based on PostgreSQL sessions.
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

```bash
docker compose ps
docker compose logs -f db_init
```

### 4. Access local services

- Frontend: http://localhost
- Backend API (proxied by nginx): `http://localhost/api/*`
- Swagger/OpenAPI: `http://localhost/api/docs` (also available at `/docs` in backend)
- MailPit UI: http://localhost:8025

Development note: abrir http://localhost:8025 para ver emails de recovery/notifications.

---

### Authentication and Sessions (Quick Note)

SIGECO uses **stateful sessions** stored in PostgreSQL. Session behavior:
- Cookie name: `sid` (HttpOnly, Path=/, SameSite configurable).
- Session validity is checked server-side (`revoked_at IS NULL` and `expires_at > now`).
- On password change/reset, all user sessions are revoked.
- Frontend requests must include credentials (`credentials: "include"`).

Cleanup:
- Expired/revoked sessions can be removed with:

```bash
docker compose exec backend npm run sessions:cleanup
```

This command is manual by default. If needed, schedule it via cron/job.

### MailPit and forgot-password flow

`POST /api/auth/forgot-password` generates a temporary password and sends it via SMTP to MailPit in local development:

- SMTP host (from backend container): `mailpit`
- SMTP port: `1025`
- UI inbox: http://localhost:8025

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

# Stop and remove containers/networks/volumes
docker compose down -v --remove-orphans
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

# Prisma Studio
docker compose exec backend npm run prisma:studio

# Cleanup expired/revoked sessions
docker compose exec backend npm run sessions:cleanup
```

### Inspect DB quickly from Docker

```bash
docker compose exec db psql -U postgres -d appdb
```

Inside `psql`:

```sql
\dt
SELECT * FROM users LIMIT 20;
SELECT * FROM sessions LIMIT 20;
```

---

## 8. Documentation

Technical documentation is located in `/docs`:

- [API docs index](docs/api/README.md)
- [Architecture](docs/architecture.md)
- [Database design](docs/database.md)
