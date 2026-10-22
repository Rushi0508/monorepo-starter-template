---
order: 3
title: Roles and Access
description: Who can sign in, what everyone can do, and what nobody can do.
last_verified: 2026-10-02
---

# Roles and access

There are no roles. Everyone who can sign in has full access to everything ([Rule 49](./business-rules.md)): no permission levels, no read-only accounts, no split between operations and commercial, and no approval rights that only some people have. Anyone who can see a screen can act on it.

## What every user can see

| They can | Notes |
| --- | --- |
| See every order, customer and revenue figure | No restriction by channel, region or value |
| See all stock, lot and expiry information | |
| See every demand plan, scenario and forecast | |

## What every user can do in other systems

| They can | Notes |
| --- | --- |
| Create a stock transfer to Manuel Brothers | Places a real order with BlueBox, and can email Manuel Brothers a pickup request |
| Process, mark as processed or delete inbound emails | Delivery paperwork and pickup confirmations on the Inbound Emails page |
| Connect or disconnect the shared Gmail inbox | Disconnecting stops all inbox automation |
| Confirm, deny or pick Folk mappings | Linking a customer starts writing its metrics to Folk |
| Choose which Folk groups are tracked | Removing a group drops its mappings |
| Connect an AI assistant to Sauerobase | The assistant can read business data but can't change anything. See [AI Assistant](../02-features/ai-assistant-access.md) |

## What every user can change

| They can | Notes |
| --- | --- |
| Add, edit and delete products and custom columns in SKU settings | Deleting a column removes its values from every product |
| Change product prices and costs | These drive margin reporting |
| Create, edit, import, finalize, unlock and delete demand plans | Finalized plans included |
| Create, duplicate, save, reopen, promote and delete scenarios | |
| Record and edit production runs | |
| Change system settings | Delivery targets and the Manuel Brothers email addresses. Changing a delivery target changes past on-time reporting too |
| Pause, resume, trigger or force-run data feeds | On [Data Pipeline Health](../02-features/information-currency.md) |
| Add, edit and remove training videos | In the Help Center |
| Add and remove users | Any user can remove any other, even all of them |

Creating a transfer has no confirmation step beyond the form and no second approver. Any user can finalize or delete any demand plan without sign-off, and a deleted plan can't be recovered. If the business needs separation of duties, like stopping the people who report on margin from changing product costs, that's development work. What nobody can do, from editing orders to undoing a deleted plan, is listed in [Limitations](./limitations.md#things-that-cannot-be-corrected-or-undone).

## Getting access

Access is by invitation only:

1. An existing user adds the person's email address on the Users page.
2. That person signs in with a one-time code emailed to them, or with their Google account.

Someone who hasn't been added can't sign in either way and is told they're not in the system ([Rule 48](./business-rules.md)). Adding someone is the only gate.

| Sign-in detail | How it works |
| --- | --- |
| Emailed code | Six digits, valid for 10 minutes, three attempts |
| Staying signed in | A session lasts 30 days and extends as long as the person keeps using Sauerobase |
| Removing a user | Ends their access immediately ([Rule 51](./business-rules.md)) |
| Your own account | You can't delete it ([Rule 50](./business-rules.md)) |

## Notifications

Sauerobase doesn't notify its own users about anything: failures, finished work or documents waiting for attention. The only emails it sends go to Manuel Brothers, and the only email a user gets is their own sign-in code. See [Limitations](./limitations.md#nobody-is-told-when-something-fails).
