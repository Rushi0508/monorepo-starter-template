# Monorepo Starter Template

Next.js + NestJS monorepo with email OTP sign-in, Prisma/PostgreSQL, shadcn/ui and a built-in
Help Center.

## Quick start

```bash
pnpm install
cp apps/server/.env.example apps/server/.env   # set DATABASE_URL and BETTER_AUTH_SECRET
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm dev                                       # web on :3000, API on :3001
```

Only users in the database can sign in. Add your first user with `pnpm db:studio`, then use
the **Users** page. Outside production the one-time password is `123456`.

## Documentation

The Help Center at http://localhost:3000/docs is rendered from the [`docs`](./docs) folder.
Start with [Local setup](./docs/03-developer-setup/local-setup.md), and see
[Writing docs](./docs/05-developer-guides/writing-docs.md) to add pages.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run every app in watch mode |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` / `pnpm format:fix` | Biome lint and format, with fixes |
| `pnpm test:unit` | Server unit tests |
| `pnpm depcruise` | Check import rules |
| `pnpm db:migrate` / `pnpm db:studio` | Create and apply migrations / open Prisma Studio |
