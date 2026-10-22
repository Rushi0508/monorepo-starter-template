# Project conventions

pnpm + Turborepo monorepo: `apps/web` (Next.js 16), `apps/server` (NestJS 12), shared code
in `packages/*`. See README.md for setup.

## General

- TypeScript everywhere. Biome formats and lints (tabs, single quotes, semicolons).
- Conventional Commits, enforced by commitlint.
- Shared Zod schemas go in `@repo/schemas`, shared types in `@repo/types`, helpers in
  `@repo/utils`. Apps never import each other; packages never import apps.
- File names: React components `PascalCase.tsx`, everything else `kebab-case.ts`
  (hooks are `useThing.ts`). DTOs are `*.dto.ts`, tests `*.spec.ts`.

## Web (`apps/web`)

- Components never call HTTP directly. Calls go through a service class in `services/`
  (static methods on top of `ApiClient`), and data fetching through TanStack Query hooks in
  `queries/`.
- The web app never imports `@repo/db`; it reads data through the API.
- Forms use react-hook-form + `zodResolver` with schemas from `@repo/schemas`, rendered with
  the shadcn `Field` components.
- UI comes from `@repo/ui` (shadcn on Base UI). Base UI uses the `render` prop instead of
  `asChild`, e.g. `<Button render={<Link href='/' />} nativeButton={false}>`.
- Every async view handles loading, empty and error states.

## Server (`apps/server`)

- Module → controller → service. Controllers stay thin and never import Prisma; only
  services use `PrismaService`.
- Request validation uses class-validator DTOs. The global `ValidationPipe` strips unknown
  fields.
- Routes require a session by default; use `@AllowAnonymous()` for public ones.
- Throw Nest HTTP exceptions with clear messages; `GlobalExceptionFilter` shapes the
  response.
- Every service gets a `*.service.spec.ts`. The unit-test coverage gate is 100%.

## Database (`packages/db`)

- Edit `prisma/schema.prisma`, then run `pnpm db:migrate`. Never edit an applied migration.
- Use `$transaction` for multi-step writes and index the columns you filter on.
