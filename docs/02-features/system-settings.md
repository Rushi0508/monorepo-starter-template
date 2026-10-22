---
order: 12
title: Configuration
description: The shared inbox connection, tracked Folk groups, delivery targets and Manuel Brothers email addresses.
last_verified: 2026-10-02
---

# Configuration

A small set of settings that change how Sauerobase behaves without any development. They reach a long way: the inbox connection decides whether any email is read or sent, the Manuel Brothers addresses decide who hears about transfers and orders, and the delivery targets reshape delivery reporting. Operations looks after them, but everyone who can sign in can change them ([Rule 49](../01-business/business-rules.md)), and nothing records who changed a setting or when.

| Setting | What it affects | How it saves |
| --- | --- | --- |
| Gmail connection | The shared inbox Sauerobase reads (delivery paperwork, pickup emails, Manuel Brothers replies) and sends from (emails to Manuel Brothers) | Immediately |
| Folk groups | Which Folk groups are pulled into [Folk Mapping](./folk-mapping.md) and get order metrics | Immediately |
| DTC max transit days | The on-time target for consumer and point-of-sale orders | **Save changes** |
| B2B max transit days | The on-time target for wholesale orders | **Save changes** |
| Distributor email: Primary | The recipient of both Manuel Brothers emails (pickup requests and new-order delivery requests) | **Save changes** |
| Distributor email: CC | More recipients, comma-separated | **Save changes** |

![Configuration page with the inbox connection, delivery targets and distributor email addresses](/images/docs/configuration.jpg)

Product costs aren't set here. Cost of goods and fulfillment costs are set per product in [SKU Settings](./product-master-data.md).

## Gmail connection

- **Connect Google** signs in to the shared Google account. The page then shows which account is connected and since when.
- **Change account** connects a different account in its place.
- **Disconnect** stops Sauerobase reading and sending email from that inbox, with no confirmation step. Delivery paperwork and pickup emails stop arriving on [Inbound Emails](./inbound-emails.md), Manuel Brothers replies stop being picked up as acknowledgements, and emails to Manuel Brothers can't be sent.
- Only email received after the inbox was connected is ever processed, and reconnecting starts again from that moment ([Rule 39](../01-business/business-rules.md)).
- Sign-in codes for Sauerobase users are sent separately and don't depend on this connection.

## Folk groups

Pick the Folk groups whose companies Sauerobase should track. Adding a group takes effect right away; run **Seed from Folk** on the Folk Mapping page to pull its companies in.

Removing a group asks for confirmation, then removes its companies from Folk Mapping and stops their order metrics. Linked customers are unlinked, not deleted, and nothing changes in Folk.

## Delivery targets

Each target must be a whole number of at least one day. An order is on time when its transit time is within the target for its channel ([Rule 16](../01-business/business-rules.md)). There's only the consumer and wholesale split, with no per-channel targets.

On-time percentages are worked out fresh each time a report opens, so a new target changes every past period's figure immediately, and there's no record of what the target used to be.

## Manuel Brothers email addresses

Both fields are checked when saving: the primary must be a valid email address, and CC must be a comma-separated list of valid addresses. Either can be left blank, and only one distributor (Manuel Brothers) can be addressed.

A blank primary address switches off both Manuel Brothers emails. No pickup requests or new-order delivery requests go out, and no error shows ([Rule 30](../01-business/business-rules.md)). The transfers and orders themselves carry on.

**Save changes** writes all four form fields together, so clearing a field and saving removes what was there.
