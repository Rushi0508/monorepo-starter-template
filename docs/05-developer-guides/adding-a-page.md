---
order: 1
title: Add a page
description: Add a new page to the web app with sidebar, breadcrumbs and search.
last_verified: 2026-10-23
---

# Add a page

## 1. Create the route

Add a folder under `apps/web/app/(main)`, for example `app/(main)/projects/page.tsx`.
Pages inside `(main)` get the sidebar, header and sign-in check automatically.

## 2. Add it to the navigation

Add an entry to `apps/web/config/routes.ts`. That one entry puts the page in the sidebar,
the breadcrumbs and the ⌘K search.

## 3. Fetch data

- Add a service in `apps/web/services` that calls the API through `ApiClient`.
- Add a TanStack Query hook in `apps/web/queries` that uses the service.
- Call the hook from your component. Components never call the API directly.

## 4. Use the shared components

Start the page with `PageHeader`, and reuse `components/general` (tables, date pickers,
dialogs, badges, loaders) before building new UI.

## Dynamic breadcrumbs

On a detail page such as `/projects/[id]`, call `useBreadcrumbSegment(id, project.name)`
so the breadcrumb shows the name instead of the id.
