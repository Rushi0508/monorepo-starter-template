# Monorepo Starter Template

Next.js + NestJS monorepo with email OTP login, Prisma/PostgreSQL, and a shadcn/ui
(Base UI) component library.

| Path                         | What it is                                                        |
| ---------------------------- | ----------------------------------------------------------------- |
| `apps/web`                   | Next.js 16 app (App Router, React 19, Tailwind 4, TanStack Query) |
| `apps/server`                | NestJS 12 API (Better Auth, Prisma, Swagger, pino logging)        |
| `packages/ui`                | shadcn/ui components on Base UI, shared Tailwind theme            |
| `packages/db`                | Prisma schema, migrations and generated client                    |
| `packages/schemas`           | Zod schemas shared by web and server                              |
| `packages/types`             | Shared TypeScript types                                           |
| `packages/utils`             | Shared helpers                                                    |
| `packages/typescript-config` | Base `tsconfig` files                                             |

## Requirements

- Node.js 24.9+ (`nvm use` reads `.nvmrc`)
- pnpm 10 (`corepack enable`)
- Docker, for the local Postgres

## Getting started

```bash
pnpm install
cp apps/server/.env.example apps/server/.env   # set BETTER_AUTH_SECRET: openssl rand -base64 32
cp apps/web/.env.example apps/web/.env
docker compose up -d                           # Postgres on localhost:5432
pnpm db:migrate                                # apply migrations
pnpm dev                                       # web on :3000, API on :3001
```

Open http://localhost:3000, enter any email and use the OTP **`123456`**. The first
sign-in creates the user.

API docs (non-production only): http://localhost:3001/api/docs

## Auth

Better Auth runs inside the NestJS API under `/api/auth`, using the email OTP plugin with a
fixed code (`STATIC_OTP` in `apps/server/src/common/auth.ts`). To send real codes, replace
`generateOTP` and `sendVerificationOTP` there with a generated code and an email provider.
- Every API route requires a session by default. Mark public routes with `@AllowAnonymous()`.
- Read the current user in a controller with `@Session() session: UserSession`.
- On the web, `proxy.ts` redirects signed-out visitors to `/login`, and `AuthProvider`
  loads the current user for everything under `app/(main)`.

## Scripts

| Command                         | What it does                                               |
| ------------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                      | Run every app and package in watch mode                    |
| `pnpm build`                    | Production build                                           |
| `pnpm typecheck`                | Type-check every package                                   |
| `pnpm lint` / `pnpm format:fix` | Biome lint and format (with fixes)                         |
| `pnpm test:unit`                | Server unit tests                                          |
| `pnpm depcruise`                | Check import boundaries (see `.dependency-cruiser.cjs`)    |
| `pnpm db:migrate`               | Create and apply a migration after editing `schema.prisma` |
| `pnpm db:studio`                | Open Prisma Studio                                         |

## Adding UI components

```bash
cd apps/web
pnpm dlx shadcn@latest add dialog
```

Components land in `packages/ui/src/components` and are imported as
`@repo/ui/components/<name>`.

## Git hooks

`pnpm install` sets up lefthook. Each commit runs gitleaks, Biome, type-checking and
dependency-cruiser, and the message must follow Conventional Commits.

## TypeScript versions

Everything uses TypeScript 7 except `apps/server` and dependency-cruiser, which stay on
TypeScript 6. The Nest CLI, its Swagger plugin, ts-jest and dependency-cruiser all need the
TypeScript compiler API, which TypeScript 7.0 does not ship yet; it is expected in 7.1.
