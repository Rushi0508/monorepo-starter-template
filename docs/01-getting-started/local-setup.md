---
order: 2
title: Local setup
description: Install dependencies, configure environment files and run the apps.
last_verified: 2026-10-23
---

# Local setup

## Requirements

- Node.js 24
- pnpm 10 (`corepack enable`)
- PostgreSQL (local install or hosted)

## Install

```bash
pnpm install
```

Installing also sets up the git hooks and generates the Prisma client.

## Environment files

Each app reads its own `.env` file. Copy the examples and fill in the values:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Set `BETTER_AUTH_SECRET` in `apps/server/.env` (`openssl rand -base64 32`) and point
`DATABASE_URL` at your PostgreSQL database. The SMTP settings are only needed in production,
where the sign-in code is emailed.

## Database

```bash
pnpm db:migrate   # create the database if needed and apply migrations
```

## Run

```bash
pnpm dev
```

The web app runs on http://localhost:3000 and the API on http://localhost:3001. Swagger
docs are at http://localhost:3001/api/docs outside production.

## First sign-in

Only users that exist in the database can sign in. Add yourself once with Prisma Studio
(`pnpm db:studio`) by creating a row in `users` with your name and email. After that,
add everyone else from the **Users** page.

Outside production the one-time password is always `123456` and is also printed in the
API logs. See [Authentication](../architecture/authentication.md).

## Run with Docker

The `Dockerfile` builds both apps into one image, and `docker-compose.yml` runs it with the
two `.env` files:

```bash
docker build -t starter .
APP_IMAGE=starter docker compose up -d
```

The container applies pending migrations on start, then serves the web app on port 3000 and
the API on 3001.
