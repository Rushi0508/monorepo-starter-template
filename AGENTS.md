# Project conventions

pnpm + Turborepo monorepo: `apps/web` (Next.js 16, React 19), `apps/server` (NestJS 11,
Prisma 7, Better Auth), and shared code in `packages/*`. Setup is in README.md and
`docs/03-developer-setup`.

## General

- TypeScript everywhere. Biome formats and lints (tabs, single quotes, semicolons); there is
  no ESLint or Prettier.
- Conventional Commits, enforced by commitlint. The pre-commit hook runs gitleaks, Biome,
  typecheck and dependency-cruiser; fix failures rather than skipping hooks.
- File names: React components `PascalCase.tsx`, everything else `kebab-case.ts`; hooks are
  `useThing.ts`, DTOs `*.dto.ts`, tests `*.spec.ts`.
- Comment only non-obvious logic.

## Shared packages

- `@repo/schemas` (Zod), `@repo/types`, `@repo/enums`, `@repo/constants`, `@repo/utils` and
  `@repo/mail` compile to `dist/`. They build on install and in watch mode under
  `pnpm dev`; after editing one outside `pnpm dev`, run its `build` script.
- `@repo/db` holds the Prisma schema and generated client. `@repo/ui` holds the shadcn/ui
  components (Radix-based) and `globals.css`.
- Import rules (`pnpm depcruise`): apps never import each other, packages never import apps,
  the web app never imports `@repo/db`, controllers never import Prisma, no circular imports.

## Web (`apps/web`)

- Components never call HTTP directly. Each API area has a service class in `services/`
  (static methods over `ApiClient` from `lib/api-client.ts`) and TanStack Query hooks in
  `queries/` that components use.
- Pages under `app/(main)` render inside `AppSidebar` (sidebar, top bar, breadcrumbs) and
  `AuthProvider`. Register new pages in `config/routes.ts`; that drives the sidebar,
  breadcrumbs and ⌘K search. Start pages with `PageHeader`.
- On detail pages, call `useBreadcrumbSegment(id, name)` so the breadcrumb shows a name.
- Keep list filters in the URL with `useQueryFilters`.
- Forms use react-hook-form + `zodResolver` with schemas from `@repo/schemas`, rendered with
  the `Form` components from `@repo/ui`. Show results with `sonner` toasts.
- Reuse `components/general` (tables, pickers, dialogs, badges, loaders) before writing new
  UI. Use theme colours (`bg-background`, `text-muted-foreground`, `border-border`, …), not
  fixed colours, so light and dark mode both work.
- Fonts: Google Sans (`font-sans`) for text, Source Serif 4 (`font-heading`) for headings.

## Server (`apps/server`)

- Module → controller → service. Controllers stay thin; only services use `PrismaService`.
- Protect controllers with `@UseGuards(CustomAuthGuard)` and `@ApiCookieAuth()`; read the
  user with `@Session() session: UserSession`; mark public routes with `@AllowAnonymous()`.
- Validate input with class-validator DTOs (use `@Trim()` on strings, `PaginationDto` for
  lists). The global `ValidationPipe` strips unknown fields.
- Throw Nest HTTP exceptions with clear messages; `GlobalExceptionFilter` shapes errors.
- Configuration comes only from `src/common/env-config.ts`; add new variables there and to
  `.env.example`.

## Database (`packages/db`)

- Edit `prisma/schema.prisma`, then `pnpm db:migrate` to create and apply a migration.
  Never edit an applied migration.
- Use `$transaction` for multi-step writes and index columns you filter on.

## Docs (`docs/`)

- Markdown pages with frontmatter (`title`, `description`, `order`, `last_verified`),
  grouped in numbered folders: business, features, developer setup, technical, developer
  guides. Update the relevant page when behaviour changes. See
  `docs/05-developer-guides/writing-docs.md`.
