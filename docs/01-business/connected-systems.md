---
order: 4
title: Connected Systems
description: Every outside system Sauerobase talks to, what each feed brings in, what goes out, what runs on its own, and what happens when a system is down.
last_verified: 2026-10-08
---

# Connected systems and automation

What each system sends Sauerobase, what goes back, which system is the authority, what runs without anyone acting, and what the business notices when a system is down. When a figure changes and nobody knows why, the answer is usually here. Every scheduled feed has a row on [Data Pipeline Health](../02-features/information-currency.md) with how often it runs, when it last succeeded, how long it took and its last error. POD processing, pickup confirmation processing, the transfer check and the emails to Manuel Brothers run on their own but have no row there, so their results only show where the work lands: the Inbound Emails page, the transfer list and each order's timeline.

```
                         ┌──────────────────────┐
  Shopify ──────────────►│                      │──────────► Shopify (distributor stock)
  BlueBox / iDrive ─────►│                      │──────────► BlueBox (transfer orders)
  SimplyDepo (Zapier) ──►│        Sauero        │──────────► SimplyDepo (completed deliveries)
  Gmail inbox ──────────►│                      │──────────► Gmail (pickup + delivery requests)
  Folk CRM ─────────────►│                      │──────────► Folk (order metrics)
  QuickBooks (paused) ──►│                      │
                         └──────────────────────┘
```

## What breaks when a system is down

A failed feed loses nothing, because the next successful run covers the gap ([Rule 53](./business-rules.md)). Gmail, the shared inbox, is the exception, and the only outage that can lose data for good.

| If this is down | What happens | Catches up on its own? |
| --- | --- | --- |
| Shopify | New orders stop appearing, stock stops updating and the scheduled refreshes fail on Data Pipeline Health. Manuel Brothers stock updates from finished transfers fail and are tried again on the next transfer check | Yes, except delivery request emails: an order first seen more than 24 hours after it was placed is never announced ([Rule 46](./business-rules.md)) |
| BlueBox | Creating a transfer fails and nothing is recorded ([Rule 26](./business-rules.md)), so a transfer never exists here without existing at iDrive. Stock and delivery figures go stale, and open transfers stay open until BlueBox is back | Yes |
| SimplyDepo or Zapier | Delivery paperwork fails and waits on the Inbound Emails page ([Rule 43](./business-rules.md)). Delivery request emails still go out, without the order PDF. The catalog refresh fails on Data Pipeline Health | Yes, once someone retries the paperwork |
| Folk | The metrics push and nightly reconcile fail on Data Pipeline Health, and Folk shows the last values written. Folk doesn't resend a webhook that arrives while Sauerobase can't process it, so the nightly reconcile picks up the change | Yes |
| QuickBooks | Nothing, because the feed is paused and nothing depends on it | n/a |
| Gmail | No delivery paperwork or pickup confirmations are picked up, no acknowledgements are noticed, and no pickup or delivery requests go out (the transfer or order shows them as not sent) | No. After a long enough outage, email received during it is skipped ([Rule 39](./business-rules.md)) and has to be forwarded or sent to the inbox again |
| Document reading (the AI model) | Delivery paperwork and pickup confirmations fail and wait on the Inbound Emails page. Replies can't be judged, so those acknowledgements are missed | Partly. Paperwork waits for someone to retry it, and a missed acknowledgement isn't looked at again |
| Google sign-in | People sign in with the emailed code instead | Yes |

## Shopify

| Feed | What it brings in | What a user notices |
| --- | --- | --- |
| Real-time order updates | Order created, edited, paid, fulfilled or cancelled | Orders appear almost at once |
| Real-time refunds | Refunds as they happen | Revenue adjusts |
| Real-time fulfillments | Dispatches as they happen | Fulfillment status moves |
| Real-time subscriptions | Subscription contract changes, sent by Shopify Flow | Subscription details update |
| Orders (scheduled) | Re-reads orders in full: channel, refunds, fulfillment history | The channel becomes correct, and SimplyDepo orders trigger a delivery request |
| Inventory | Stock by location, including Manuel Brothers | Stock figures move |
| Analytics | Website sessions, conversion and traffic sources | Dashboard traffic figures move |
| Products | Products and variants | New products become available |
| Customers | Customers and addresses | New customers and address changes appear |
| Demand actuals (calculated) | Rolls Shopify orders into monthly units and net revenue per channel and product | Actuals in demand planning and forecast accuracy move |

- Point-of-sale and SimplyDepo orders show as consumer or wholesale until the scheduled order refresh identifies them ([Rule 3](./business-rules.md)).
- Goes out: Manuel Brothers stock levels, when BlueBox reports a transfer shipped or delivered; and new customers created for unmatched Folk companies at the nightly Folk reconcile.
- Authority: Shopify, for everything except Manuel Brothers stock levels after a transfer, which Sauerobase writes. Sauerobase also creates customers in Shopify for Folk companies with no matching customer; from then on Shopify owns them like any other customer.

## BlueBox (iDrive)

iDrive is the third-party logistics provider that holds and ships stock, and BlueBox is its system.

| Feed | What it brings in | What a user notices |
| --- | --- | --- |
| Orders | Warehouse orders, dispatch and delivery dates, delivery status and carrier tracking scans | Delivery dates and tracking scans update, and transfers can close |
| Kitting orders | Kitting jobs with component and finished-kit quantities | Kit orders update on the BlueBox inventory page |
| Shipments | Outbound shipments and the orders in them | Shipment groupings update |
| Inventory | Stock by product and lot, with expiry dates | Stock levels and expiry dates move |
| Inbound shipments (ASNs) | Shipments arriving at iDrive, with received and damaged quantities | Arriving stock and received quantities update |

- Goes out: a pickup order whenever a transfer to Manuel Brothers is created, and a request for that order's packing slip to attach to the pickup email.
- Authority: BlueBox, for everything physical: what stock exists, when it shipped, when it was delivered and what it cost to ship. Delivery performance uses BlueBox's records, not Shopify's.

## Transfers to Manuel Brothers

A background check regularly compares every open transfer with Sauerobase's copy of the BlueBox orders:

- Shipped or delivered: Manuel Brothers stock in Shopify goes up by the transferred quantities, and the transfer closes.
- Cancelled: the transfer closes with no stock change.
- Neither yet: nothing happens, and it's checked again next time.

Because the check reads the local copy, a transfer only closes after the BlueBox orders feed has picked up the change, and if that feed is paused or failing, transfers stay open. If any product on the transfer isn't stocked at Manuel Brothers in Shopify, nothing is added and the transfer stays Pending, with the reason on a red info icon, until it's fixed ([Rule 36](./business-rules.md)). This is why nobody has to chase a transfer, and also why one can sit open for days with nothing to do. See [Distributor replenishment](../03-workflows/distributor-replenishment.md).

## SimplyDepo

Where WS-DSD orders are placed. Sauerobase reaches SimplyDepo through a Zapier connection, not directly, so if Zapier or that connection is down, SimplyDepo is unreachable even when SimplyDepo itself is fine. SimplyDepo orders arrive through Shopify: SimplyDepo creates each order in Shopify, and Sauerobase recognizes it by the app that created it. No orders are pulled from SimplyDepo directly.

- Comes in: the product catalog on a schedule (the SimplyDepo products feed, used for product cross-checks), an individual order looked up when delivery paperwork is processed, and an order PDF attached to the delivery request email to Manuel Brothers.
- Goes out: completed deliveries, once delivery paperwork (POD) has been read and matched.
- Authority: SimplyDepo, for what's already been delivered against an order. Sauerobase reads that figure before recording anything, which is what makes re-processing a document safe ([Rule 41](./business-rules.md)).

A separate Zapier automation outside Sauerobase adds new SimplyDepo customers to Folk. See [New customer to Folk](../03-workflows/new-customer-to-folk.md).

## Folk

The sales team's CRM. Sauerobase links each Folk company to one or more Sauerobase customers, then writes that customer's ordering figures back onto the company in Folk. See [Folk mapping](../02-features/folk-mapping.md) for the screen.

| Feed | What it does | What a user notices |
| --- | --- | --- |
| Folk metrics push | Writes order metrics to the (auto) fields of every mapped Folk company, on a schedule | Folk company cards update |
| Folk nightly reconcile | Re-reads the tracked Folk groups, suggests matches for new companies, creates Shopify customers for unmatched ones, drops removed ones, pushes metrics and refreshes Last Contact | New companies appear on the Folk mapping page, unmatched ones become Shopify customers, and Last Contact updates |
| Folk webhooks (real time) | Reacts when a Folk company is created, edited, deleted or moved between groups | The Folk mapping page stays in step with Folk |

- Comes in: companies in the Folk groups chosen as tracked groups on the Configuration page; each company's name, group membership, addresses, emails and phones (used to suggest a match and to create a Shopify customer for an unmatched company), SD Customer ID, Status and Account Type; and the most recent interaction, shown as "Last Contact" on the customer page.
- Goes out: order metrics written to the fields ending in (auto) on mapped Folk companies: first and last order date, days since last order, last order value and quantity, average order size, lifetime revenue and orders, store count, retail velocity and the Sauero customer codes. Only changed values are sent, and only fields Sauerobase owns are ever written.
- Authority: Folk, for the relationship itself: status, account type and contact history. Sauerobase, for the (auto) fields; an edit to one in Folk is overwritten on the next push.

## QuickBooks Online

The feed would bring in ledger entries, supplier bills, customer invoices and payments, and nothing goes out. It's paused on Data Pipeline Health, so it doesn't run, and nothing in the app displays accounting data. QuickBooks is the authority for its own data.

## The shared inbox

Gmail is the one company mailbox that paperwork arrives in and Manuel Brothers emails go out from. It's connected and disconnected on the Configuration page, and the Gmail inbox check feed picks up new mail on a schedule. Each email is looked at once, the checks run in this order, and the first one that applies wins:

```
New email
   │
   ├─► 1. Reply on a transfer's pickup-request thread?
   │       └─► AI judges: does it confirm the transfer?
   │             yes → transfer marked acknowledged. Done.
   │             no  → carry on to step 2.
   │
   ├─► 2. Subject mentions "pickup" and has a readable attachment?
   │       └─► Stored as a pickup confirmation. Done.
   │
   ├─► 3. Subject contains the word "POD" or "PODs" and has a readable attachment?
   │       └─► Stored as delivery paperwork. Done.
   │
   └─► Anything else is ignored.
```

Stored pickup confirmations and delivery paperwork show on the **Inbound Emails** page, and two background processes work through them ([Rules 32, 37 and 38](./business-rules.md)):

| Process | What it does | What a user notices |
| --- | --- | --- |
| Delivery paperwork (POD) | Takes the oldest waiting POD, reads it, matches its lines to the SimplyDepo order and records the completed delivery in SimplyDepo ([Rules 40 to 42](./business-rules.md)) | The email shows as processed or failed, and the order's timeline shows "POD received" and "POD processed" |
| Pickup confirmations | Takes the oldest waiting pickup email, reads the MB-#### transfer numbers off the attachment and marks those transfers picked up | "Bill of Lading received" appears on the transfer |

Both handle one email at a time, oldest first, so a large batch clears gradually. A pickup confirmation only counts for a transfer whose pickup request was already sent and acknowledged ([Rule 62](./business-rules.md)). Anything that fails stays failed until someone presses **Process** on the Inbound Emails page ([Rule 43](./business-rules.md)).

Attachments aren't copied into Sauerobase. They stay in Gmail and are fetched when needed, so deleting an email eventually makes its attachments unviewable here. The mailbox is the authority for what was received. When Gmail is down, email can be lost for good (see [What breaks when a system is down](#what-breaks-when-a-system-is-down)).

## Emails sent without anyone asking

| Email | When it goes | Where you can see it went |
| --- | --- | --- |
| Pickup request, with the BlueBox packing slip | When a stock transfer is created with the email option ticked | "Email sent" on the transfer |
| Delivery request, with the SimplyDepo order PDF | When the scheduled order refresh first sees an order that came from SimplyDepo, is less than 24 hours old and isn't cancelled ([Rules 45 and 46](./business-rules.md)) | "Delivery request" on the order's timeline |

Both go to the Manuel Brothers address in settings, plus any copied addresses, and are sent from the shared inbox. Replies land back in the same inbox, which is how acknowledgements get picked up. If no address is set, nothing is sent and no error shows ([Rule 30](./business-rules.md)). If sending fails, the transfer or order shows the email as not sent, and there's no resend button.

## Automated judgment

Four decisions are made by an AI model from Google, not by fixed logic:

| Decision | What it does |
| --- | --- |
| Reading delivery paperwork | Pulls out the invoice number, products and case quantities |
| Matching lines | Decides which line on the SimplyDepo order each paperwork line belongs to |
| Reading pickup confirmations | Finds the MB-#### transfer numbers on a Bill of Lading |
| Judging a reply | Decides whether a reply confirms a transfer or is a question |

Sauerobase sends the model the document, the order's product lines or the text of the reply, and gets back structured data or a yes/no judgment. The model has no authority: its output is treated as a suggestion, and quantities are capped at what's still outstanding before anything is recorded ([Rule 42](./business-rules.md)). It can still be wrong, and what's guarded and what isn't is in [Limitations](./limitations.md#ai-reading-can-be-wrong-and-nothing-measures-it). A reply that couldn't be judged, or was judged wrong, isn't looked at again.

## When a feed fails or gets stuck

- A failed run loses nothing, because the next run covers the same ground ([Rule 53](./business-rules.md)).
- A feed that's already running won't start a second time ([Rule 52](./business-rules.md)).
- If the server restarts mid-run, that run is released automatically and shows as failed with the reason "interrupted by a server restart". The next scheduled run goes ahead normally.
- If a feed shows **Running** for far longer than usual, **Force Run** on Data Pipeline Health clears it and starts again without skipping anything.
- **Pause** stops a feed until someone presses **Resume**. A paused feed is skipped.

## A normal day with nobody signed in

- Orders keep arriving and updating all day
- New SimplyDepo orders trigger a delivery request to Manuel Brothers
- Delivery paperwork emailed in is read and recorded in SimplyDepo, one at a time
- Bills of Lading emailed in mark transfers as picked up
- Replies on pickup requests are judged and acknowledgements recorded
- Transfers iDrive has shipped get their stock added and close
- Stock, delivery, traffic, demand actuals and Folk metrics refresh on their schedules

Sauerobase doesn't stop or slow down when nobody's watching, and it doesn't tell anyone when any of this fails. See [Limitations](./limitations.md).

## Google sign-in

People can sign in with their Google account or with an emailed one-time code. Only people already added on the Users page can sign in either way (see [Roles and access](./roles.md)).
