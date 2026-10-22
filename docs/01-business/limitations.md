---
order: 4
title: Scope and limitations
description: What the product does not do yet, so expectations are clear.
last_verified: 2026-10-23
---

# Scope and limitations

These are known gaps in the current version. Each is a deliberate scope decision, not a
bug, and can be added when needed.

## Access

- **No roles.** Everyone who can sign in has the same access, including managing users.
- **No self sign-up.** People must be added by someone who already has access.
- **Email cannot be edited.** Remove the person and add them again instead.
- **No single sign-on.** Sign-in is by emailed code only; Google or Microsoft sign-in is
  not available.

## Activity and history

- **No audit log.** The app does not record who added, renamed or removed someone, or who
  changed a training video.

## Training videos

- **Loom and Tella only.** Other video links are rejected.
- **Anyone can edit or delete any video,** not only the person who added it.

## Email delivery

- Sign-in codes are emailed only in the production environment. Test environments use a
  fixed code instead, so they must never hold real data.
