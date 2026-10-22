---
order: 2
title: Add an API module
description: Add a NestJS module with a controller, service and validated DTOs.
last_verified: 2026-10-23
---

# Add an API module

## Structure

```
apps/server/src/projects/
├── dto/create-project.dto.ts
├── projects.controller.ts
├── projects.module.ts
└── projects.service.ts
```

Register the module in `apps/server/src/app.module.ts`.

## Rules

- Controllers stay thin and never import Prisma; services hold the logic and use
  `PrismaService`.
- Validate input with class-validator DTOs. The global validation pipe strips unknown fields.
- Protect the controller with `CustomAuthGuard`.
- Throw Nest HTTP exceptions (`NotFoundException`, `BadRequestException`, …) with clear
  messages.
- Add a `*.service.spec.ts` for each service.

## Database changes

Edit `packages/db/prisma/schema.prisma`, then run `pnpm db:migrate` to create and apply a
migration.
