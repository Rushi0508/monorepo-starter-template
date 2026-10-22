---
order: 10
title: Limitations
description: What Sauerobase does not do today. Read before promising anything or scoping the next phase.
last_verified: 2026-10-08
---

# Limitations

What Sauerobase doesn't do today. Read this before you promise a customer anything, plan a process around the system or scope the next phase. Unless it's in the [configuration list](#what-you-can-change-without-development) at the bottom, changing any of it is development work.

## No approvals, roles or separation of duties

Anyone who can sign in can create warehouse orders, change the product costs behind margin reporting, delete products, finalize or delete demand plans and remove other users, and none of it needs a second person. Separating those duties is development work. See [Roles and access](./roles.md).

## Nobody is told when something fails

Sauerobase has no alerts of any kind: no email, message or escalation. Someone has to look at a screen to find out something went wrong.

Some failures show in one place only:

| What can fail | Where it shows |
| --- | --- |
| A pickup request email to Manuel Brothers | The transfer shows the email as not sent |
| A delivery request email for a SimplyDepo order | The order's timeline shows "Not sent" |
| Delivery paperwork or a pickup confirmation that couldn't be processed | Marked failed on the Inbound Emails page |
| The Folk metrics push | Data Pipeline Health only. Folk keeps showing the last values written |
| A Folk webhook Sauerobase couldn't process | Data Pipeline Health only. Folk doesn't send it again, and the nightly reconcile usually catches up |

Others leave no trace on any screen:

| What can fail unseen | What the business loses |
| --- | --- |
| Judging a reply from Manuel Brothers | The acknowledgement is missed for good |
| A product on a transfer that isn't stocked at Manuel Brothers in Shopify | The whole transfer stays Pending, with the reason on a red info icon, until the product is added to that location in Shopify ([Rule 36](./business-rules.md)) |
| Email that arrives during an inbox outage | That paperwork is skipped for good |
| A SimplyDepo order first seen more than 24 hours after it was placed | No delivery request is ever sent ([Rule 46](./business-rules.md)) |
| Picking a Folk customer that's already linked to another company | The customer moves to the new company without warning, and the old company's Folk figures stop including it |

Data Pipeline Health can look all green while any of these has stopped a process. Pickup and POD processing and the transfer check don't appear there.

## Figures aren't live

Each feed refreshes on its own schedule, so stock, delivery, Folk and demand figures can be hours old. A paused feed's figures stop moving until someone resumes it, and the only sign is its status on [Data Pipeline Health](../02-features/information-currency.md).

## Delivery paperwork can be lost

The shared inbox is the one connection that doesn't catch up after an outage. If it's down long enough, email received in that window is skipped and can't be recovered inside Sauerobase; it has to be forwarded or sent again. Reconnecting the inbox does the same thing: processing restarts from that moment and anything earlier is never picked up ([Rule 39](./business-rules.md)).

## Things that cannot be corrected or undone

| You can't | What happens instead |
| --- | --- |
| Cancel or amend a transfer to Manuel Brothers | Fix it in BlueBox |
| Resend an email to Manuel Brothers | Tell Manuel Brothers another way |
| Correct an acknowledgement or pickup that was recorded wrong | The record stays wrong; it can't be set or cleared by hand |
| Undo a deleted custom product column | Its values are removed from every product in one step |
| Undo a deleted demand plan | Any plan can be deleted, finalized ones included, with everything in it |
| Edit an order, customer or product listing | Make the change in Shopify. They're read-only here by design |

## Margin depends on the costs entered

A cost that hasn't been entered in SKU settings counts as zero, so margin reads too high for those products ([Rule 11](./business-rules.md)).

## AI reading can be wrong, and nothing measures it

Four steps are judged by an AI model; they're listed in [Connected systems](./connected-systems.md#automated-judgment). The worst case is guarded: quantities are capped at what's outstanding, so a misread figure can't cause an over-delivery ([Rule 42](./business-rules.md)). Two failures aren't guarded: a paperwork line matched to the wrong product on the order, and a reply judged wrong in either direction. Nothing measures how often either happens, and an acknowledgement can't be corrected afterwards.

## No accounting data

The QuickBooks connection is paused, and no screen, report or figure uses accounting data. Making it useful is development work.

## Missing tools people expect

| Not available | Notes |
| --- | --- |
| Export of reports and dashboards | Only these can be taken out: help-center pages (PDF, Word, Markdown), the SKU settings and demand plan grids (CSV or Excel, from the right-click menu) and the plan import template |
| Bulk product upload | Products are added one at a time. Demand plan numbers can be imported from a CSV or Excel file |
| Scheduled or emailed reports | Everything is on screen only |
| Search across business data | Each screen searches its own data. The ⌘K search finds pages, help-center articles and training videos, not orders or customers |
| Attachment archive | Paperwork attachments stay in Gmail and aren't copied here |
| Change history for settings, users, Folk mappings or transfers | Only product changes (SKU settings) and demand plans keep an activity trail |

## Capacity and scale haven't been tested

| Question | Where it stands |
| --- | --- |
| Can it process delivery paperwork fast enough at peak? | Paperwork is handled one email at a time, oldest first. Never tested against a known peak |
| Do wide date ranges slow reports down? | The revenue and delivery reports load the whole range at once, so the load grows with the range. No limit is enforced |
| Are there usage limits on the connected systems? | Not established |

## What you can change without development

Anyone signed in can change these today:

- Delivery targets for wholesale and consumer orders
- Product prices and costs, in SKU settings
- The Manuel Brothers email address and any copied addresses
- Which Folk groups are tracked
- Which Gmail account paperwork arrives in
- Who has access to the system
- The product master list and its custom columns
- Whether each data feed is paused or running
