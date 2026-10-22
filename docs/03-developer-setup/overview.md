---
order: 1
title: Project overview
description: What this starter includes and how the pieces fit together.
last_verified: 2026-10-23
---

# Project overview

This is a pnpm + Turborepo monorepo with a Next.js web app and a NestJS API, sharing code
through workspace packages.

## What's included

- **Web app** (`apps/web`): Next.js App Router, React, Tailwind CSS, shadcn/ui components,
  TanStack Query, and a sidebar layout with breadcrumbs and ⌘K search.
- **API** (`apps/server`): NestJS with Prisma (PostgreSQL), Better Auth, Swagger docs,
  request validation and structured logging.
- **Help Center** (`/docs` in the web app): these pages, rendered from the `docs/` folder,
  with search, PDF/Word export and training videos.
- **Tooling**: Biome for lint and format, lefthook git hooks, commitlint, gitleaks and
  dependency-cruiser.

## Where to go next

- [Local setup](./local-setup.md) gets the project running on your machine.
- [Monorepo layout](../technical/monorepo.md) explains what lives where.
- [Writing docs](../developer-guides/writing-docs.md) shows how to add pages like this one.
