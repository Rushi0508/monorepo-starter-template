---
order: 2
title: Authentication
description: How sign-in works with email one-time passwords and Better Auth.
last_verified: 2026-10-23
---

# Authentication

Sign-in uses an email one-time password (OTP), handled by Better Auth running inside the
API under `/api/auth`.

## Sign-in flow

1. The user enters their email on `/login`.
2. The API checks the email belongs to a user in the database. Unknown emails are rejected.
3. The API creates a 6-digit code, valid for 10 minutes with 3 attempts.
4. The user enters the code and receives a session cookie that lasts 30 days.

## One-time passwords

- **Outside production** the code is always `123456` and is printed in the API logs.
- **In production** a random code is emailed through the SMTP settings in
  `apps/server/.env`.

## Protecting routes

- **API**: controllers use `CustomAuthGuard`. Read the signed-in user with
  `@Session() session: UserSession`, and mark public routes with `@AllowAnonymous()`.
- **Web**: `proxy.ts` redirects signed-out visitors to `/login`, and `AuthProvider` loads
  the current user for every page inside `app/(main)`.

The auth configuration lives in `apps/server/src/common/auth.ts`.
