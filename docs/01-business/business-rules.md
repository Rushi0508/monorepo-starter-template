---
order: 6
title: Business Rules
description: Every rule Sauerobase enforces, numbered, and where each one can be changed.
last_verified: 2026-10-08
---

# Business rules

Every rule Sauerobase enforces. The last column says where to change it: SKU settings or Configuration if you can do it yourself, code if it needs a developer.

## Order channels and revenue reporting

| # | Rule | Change in |
| --- | --- | --- |
| 1 | Every order gets exactly one channel. The first match wins: point of sale is DTC-POS, then SimplyDepo is WS-DSD, then a wholesale tag is WS-ECOM, and everything else is DTC. No order is ever assigned to AMAZON, WS-CHAINS or ALTERNATIVE, so they stay empty. They're for planning and pricing ([the seven channels](./purpose-and-scope.md#what-the-seven-channels-are)). Tags are read two ways. The channel on an order and the channel split on the revenue page treat any tag containing "b2b" or "wholesale", in any capitals, as wholesale. The channel filter only matches the exact tags B2B, b2b, B2B-Shopify, wholesale and Wholesale. So an order tagged "Wholesale-Retail" shows as WS-ECOM, but the DTC filter picks it up and the WS-ECOM filter doesn't. | Code |
| 2 | Point-of-sale orders count as consumer orders for delivery targets. WS-ECOM, WS-DSD, WS-CHAINS and ALTERNATIVE are measured against the wholesale target, and DTC, DTC-POS and AMAZON against the consumer target. Fulfillment cost is set per channel, point of sale included (Rule 10). | Code |
| 3 | A new order's channel and full detail aren't final until the scheduled full order refresh picks it up. The instant update when an order is placed can't spot point-of-sale or SimplyDepo orders, so they show as DTC or WS-ECOM until then. The **shopify-orders** feed on [Data Pipeline Health](../02-features/information-currency.md) shows when the refresh last ran. | Code |
| 4 | Cancelled orders are left out of revenue, margin and product breakdowns. They still show in order lists. | Code |
| 5 | Only completed refunds reduce revenue and margin. Pending or failed refunds don't count, and a refund with no successful payment back counts as zero. Tax refunded on products comes out of the refund, since tax was never revenue. Tax refunded on shipping isn't recorded separately, so it stays in the refund. | Code |
| 6 | Multi-pack bundles are split into their component products during the full order refresh. The bundle's price and discount are spread across the components by value, and the bundle line drops out of reporting. | Code |
| 7 | Revenue lands on the day the order was placed. On screen, date filters and daily charts use whole days in your own time zone. The AI assistant always uses Sauero's business time zone, Mountain time (America/Denver). So a late-evening order can land on different days for two people in different time zones. Totals at the edges of a range can differ slightly. | Code |

## Cost and margin

| # | Rule | Change in |
| --- | --- | --- |
| 8 | Cost of goods is set per product: materials, production and shipping to the warehouse. It's the same in every channel and drives all margin reporting. | SKU settings |
| 9 | Retired. Production runs no longer carry a cost per case. All product costs are entered in SKU settings (Rules 8 and 10). | - |
| 10 | Fulfillment cost (storage, pick, pack and shipping) is set per product and per channel, and drives contribution margin. When iDrive reports an order's actual shipping charge, it replaces the entered shipping. Storage, pick and pack always use the entered costs. | SKU settings |
| 11 | A missing cost counts as zero, whether it's a product's cost of goods or its fulfillment cost for one channel. Gross and contribution margin read too high until someone enters it. | SKU settings |
| 12 | Each order uses the costs in force on the day it was placed. Costs carry a start date and older versions are kept, so a new cost doesn't rewrite past periods. | Code |

## Delivery performance

| # | Rule | Change in |
| --- | --- | --- |
| 13 | An order counts as delivered when iDrive records a delivery date. Shopify's fulfillment status isn't used. | Code |
| 14 | Transit time runs from dispatch to delivery, both as iDrive records them. | Code |
| 15 | Lead time runs from the order being placed to delivery. It includes Sauero's own processing time, so it's always longer than transit time. | Code |
| 16 | On time means transit time met the target for the order's channel. Wholesale orders are measured against the wholesale target, everything else against the consumer target. | Configuration (the targets), code (the definition) |
| 17 | With no delivery targets set, both default to seven days. A saved target has to be at least one day. See [Configuration](../02-features/system-settings.md). | Configuration |
| 18 | Delivery figures cover every order the filters match. Moving between pages doesn't change the headline numbers. | Code |

## Product codes and change history

| # | Rule | Change in |
| --- | --- | --- |
| 19 | A product code can exist only once in the master list. The check ignores capitals and includes a product's old codes (Rule 61). Creating or renaming a product with a duplicate code is refused, with a message saying the code already exists. | Code |
| 20 | Manuel Brothers stock only shows products in the master list, matched directly or through an old code (Rule 61). That covers the Manuel Brothers screen and its side of the inventory overview. The Bluebox screen shows everything iDrive reports, listed or not. It's the most common reason Manuel Brothers stock looks missing. | Code |
| 21 | Emptying a custom field deletes it instead of saving a blank. A field with only spaces counts as empty. | Code |
| 22 | Repeated edits to the same field by the same person within ten seconds are saved as one change, keeping the original and final values. | Code |
| 23 | Changing a value and changing it back within those ten seconds leaves no history entry. | Code |
| 24 | Deleting a custom column wipes its values from every product in a single all-or-nothing step. There's no undo. | Code |
| 25 | Product change history stays readable after the product, the column or the person is deleted. | Code |
| 61 | A renamed product keeps its old codes. Orders, stock and iDrive records under an old code still count against it. Matching ignores capitals and surrounding spaces. No other product can take an old code while the original product is in the master list. A product can be renamed back to one of its own old codes. | Code |

## Manuel Brothers transfers

| # | Rule | Change in |
| --- | --- | --- |
| 26 | A transfer is only created once BlueBox accepts the pickup order. If BlueBox rejects it, nothing is saved and you see an error. | Code |
| 27 | A transfer needs at least one product, each with a quantity of one or more. | Code |
| 28 | The product picker only offers products from the master list. Nothing behind the screen re-checks the code, so a transfer created another way, like directly through the API, goes to iDrive as typed. | Code |
| 29 | Pickup is always a Monday morning. Transfers created Monday to Thursday are ready the following Monday, and Friday to Sunday the Monday after next. iDrive needs orders in by Thursday to prepare them on Friday. The date is set at creation and recalculated every time the transfer is shown. | Code |
| 30 | Neither Manuel Brothers email (pickup requests and new-order delivery requests) goes out until a Manuel Brothers address is set, and no error shows. The **Send pickup email to Manuel Brothers** box is ticked by default and can be unticked on any transfer. With no address, or with the box unticked, the transfer is still created but Manuel Brothers is never told. It can then never be acknowledged or confirmed as picked up (Rule 62). See [Limitations](./limitations.md). | Configuration (the address), each transfer (the box) |
| 31 | A failed email never cancels the transfer, because the BlueBox order already exists and cancelling would leave the two out of step. The transfer shows as never notified, and it can't be resent. If the BlueBox packing slip can't be fetched, the email goes without it. | Code |
| 32 | A Manuel Brothers reply only counts as an acknowledgement if it confirms the order. An automated read sorts confirmations from questions, corrections and out-of-office replies. | Code |
| 33 | Only the first acknowledgement on a transfer is recorded. Later replies in the same thread are ignored. | Code |
| 34 | BlueBox is checked automatically on a schedule, and a transfer closes when it reports shipped, delivered or cancelled. Shipped counts as delivered, because Manuel Brothers collects from the warehouse. Shipped or delivered adds to Manuel Brothers stock, and cancelled closes with no stock change. | Code |
| 35 | A transfer can complete without Manuel Brothers ever acknowledging it. | Code |
| 36 | A transfer is added to Shopify in full or not at all. If any product isn't stocked at the Manuel Brothers location in Shopify, or Shopify refuses the update, nothing is added, the transfer stays **Pending** with a red info icon showing the reason, and it's retried on every check. | Code |
| 62 | A Bill of Lading only confirms transfers whose pickup request was sent and acknowledged. Pickup emails are the ones in the shared inbox with "pickup" in the subject and a readable attachment. The transfer numbers (MB-...) are read from the attachment, and each transfer that was sent and acknowledged is marked **Picked up**. If the document carries any other MB number, with no matching transfer or one not yet sent or acknowledged, the email is marked failed. The ready transfers are still confirmed. This keeps the team's own pickup requests, which also land in the inbox, from counting as confirmations. | Code |

## Proof of delivery emails

| # | Rule | Change in |
| --- | --- | --- |
| 37 | Only emails in the shared inbox with the whole word "POD" or "PODs" in the subject count as delivery paperwork. An email about a podcast won't match. | Code |
| 38 | The email also needs at least one readable attachment: a photo, scan, PDF or Word document. Anything else is ignored. | Code |
| 39 | Only email received after the inbox was connected gets processed. Older paperwork can't be picked up, and reconnecting the inbox starts over from that moment. | Code |
| 40 | Documents are processed one at a time, oldest first, on a schedule. | Code |
| 41 | An order that's already fully delivered is skipped before anything goes to SimplyDepo, which is what makes re-running a document safe. | Code |
| 42 | Quantities read from a document are capped at what's still outstanding, so a misread can't cause an over-delivery. | Code |
| 43 | A failed document stays failed until someone retries it. Nothing retries automatically. | Code |
| 44 | A document can't be marked as handled while it's processing. You're asked to wait. | Code |

## New-order emails to Manuel Brothers

| # | Rule | Change in |
| --- | --- | --- |
| 45 | Only SimplyDepo orders trigger a delivery request email, checked on the full order refresh. An order that's already cancelled when the refresh sees it doesn't trigger one. | Code |
| 46 | Orders more than 24 hours old never trigger one, so a first or catch-up refresh doesn't email Manuel Brothers about every past order. But if the refresh stops for more than a day, new orders pass the cutoff and are never announced. | Code |
| 47 | Each order gets at most one email, sent the first time the full refresh sees it. The send time shows as **Delivery request** in the order's **Email flow**, linked to the thread, or "Not sent" if it never went. There's no resend. | Code |

## Sign-in and user access

| # | Rule | Change in |
| --- | --- | --- |
| 48 | Nobody can sign in until an existing user adds them. An unknown email address is told it's not in the system before any sign-in code is sent. | Code |
| 49 | Everyone who can sign in has the same full access. There are no permission levels. See [Roles and access](./roles.md). | Code |
| 50 | You can't delete your own account. | Code |
| 51 | Deleting a user ends their access immediately. Their product change history stays readable. | Code |

## Data refreshes

| # | Rule | Change in |
| --- | --- | --- |
| 52 | A refresh that's already running won't start a second time. | Code |
| 53 | A failed refresh loses nothing. Its starting point only moves forward on success, so the next attempt covers the same ground plus anything new. | Code |
| 54 | A refresh interrupted mid-run blocks that feed until it's cleared. Only a server restart or **Force Run** clears it, and no refresh has a time limit. Open the feed on [Data Pipeline Health](../02-features/information-currency.md) and use **Force Run**. It clears the block and starts again without skipping anything. This is the incident you're most likely to hit ([Limitations](./limitations.md)). | Code |

## Demand planning

| # | Rule | Change in |
| --- | --- | --- |
| 55 | Only one base plan can be a draft at a time. While one exists, creating a plan, **Start next cycle**, **Make base plan** on a scenario and **Unlock plan** are all refused with the draft's name. Finalize or delete the draft first. Scenario drafts don't count. | Code |
| 56 | Each month can have only one base plan, and a second is refused. Forecast accuracy scores one plan per month. A plan belongs to the month (Mountain time) it was created in, and that never changes. **Start next cycle** and **Make base plan** use the current month or the month after the source plan, whichever is later. | Code |
| 57 | Only base plans are finalized; scenarios are saved instead. Finalizing needs at least one product, locks the plan and freezes the actuals it was built on. A finalized plan or saved scenario can't be edited until it's unlocked or reopened. Only finalized base plans count toward forecast accuracy. | Code |
| 58 | A plan copies each product's cost of goods, fulfillment cost and channel price from SKU settings. It does that when it's created and when a product is added to a draft. Later changes in SKU settings don't touch it, so edit prices inside a draft plan instead. **Start next cycle** and new scenarios copy the source plan's prices, not today's SKU settings. | Code |

## Folk sync

| # | Rule | Change in |
| --- | --- | --- |
| 59 | Only companies in tracked Folk groups sync, on every Folk refresh and every change Folk reports. Untracking a group deletes the mappings for its companies. | Configuration (which groups are tracked) |
| 60 | Order figures (the (auto) fields) are only written to a Folk company once it's **Mapped**: linked to at least one customer, by a person or by the nightly reconcile creating the customer in Shopify. A suggested match (**Pending**) isn't used until someone accepts it, and a rejected one isn't offered again. Folk status and account type are only read back for mapped companies. | Code |
