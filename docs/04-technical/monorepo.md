---
order: 1
title: Monorepo layout
description: What each app and package is for, and the rules for importing between them.
last_verified: 2026-10-23
---

# Monorepo layout

## Apps

| Path | What it is |
| --- | --- |
| `apps/web` | Next.js web app, including the Help Center at `/docs` |
| `apps/server` | NestJS API, served under `/api` |

## Packages

| Path | What it is |
| --- | --- |
| `packages/db` | Prisma schema, migrations and the generated client |
| `packages/ui` | shadcn/ui components and the shared Tailwind theme |
| `packages/schemas` | Zod schemas shared by web and API |
| `packages/types` | Shared TypeScript types |
| `packages/enums` | Shared enums |
| `packages/constants` | Shared constants |
| `packages/utils` | Shared helpers |
| `packages/mail` | Email sending and templates |
| `packages/docs` | Reads the `docs/` folder for the Help Center |
| `packages/typescript-config` | Base `tsconfig` files |

## Import rules

dependency-cruiser enforces these on every commit (`pnpm depcruise`):

- Apps never import each other; they share code through packages.
- Packages never import apps.
- The web app never imports the database package; it reads data through the API.
- Controllers never import Prisma; only services do.
- No circular imports.
