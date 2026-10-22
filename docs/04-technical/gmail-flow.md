---
order: 3
title: Gmail Flow
description: How the connected Gmail inbox is read, routed to replenishment, pickup and POD handling, and used to send emails to Manuel Brothers.
last_verified: 2026-10-02
---

# Gmail inbox flow

One connected Gmail inbox does four jobs:

- Reads Manuel Brothers replies to replenishment pickup requests (acknowledgements)
- Reads Manuel Brothers Bill of Lading emails (pickup confirmations)
- Reads SimplyDepo proof-of-delivery emails, which become deliveries in SimplyDepo
- Sends the replenishment pickup requests and the new SimplyDepo order emails

Received POD and pickup emails are stored in one inbound emails table, with a type, and shown on the [Inbound Emails](../02-features/inbound-emails.md) page, one tab each. The business processes are [Proof of delivery](../03-workflows/proof-of-delivery-processing.md), [Distributor replenishment](../03-workflows/distributor-replenishment.md) and [New order notification](../03-workflows/new-order-notification.md). The replenishment internals are in [MB replenishment flow](./mb-replenishment-flow.md).

## Flow

```
Connect Gmail (one org-wide inbox, Google OAuth)
  scopes: gmail.readonly + gmail.send
  history cursor set to "now" — no backfill
     │
     ▼
Scheduled inbox check (Gmail history poll, not a push)
  new message ids since the cursor
     │
     ▼
Message ids queued (SQS) ──► consumer
     │
     ▼
For each message, first match wins:
  1. Reply on a sent, not-yet-acknowledged replenishment thread
       → LLM: acknowledgement? yes → order marked acknowledged
  2. Subject contains "pickup" / "pick up" / "pick-up"
     + PDF, image or Word attachment → stored as PICKUP, Pending
  3. Subject contains whole word "POD" / "PODs"
     + PDF, image or Word attachment → stored as POD, Pending
  anything else → ignored, no record
     │
     ▼
Scheduled processors take the oldest Pending email of each type,
one at a time:
  POD:    1. OCR attachment(s) → invoice number + lines (saved as extracted data)
          2. link to the matching SimplyDepo-channel order in Sauero
          3. find the order in SimplyDepo by invoice number
          4. LLM maps lines to SimplyDepo order products, capped at outstanding
          5. create the fulfillment in SimplyDepo
  Pickup: 1. OCR attachment(s) → MB-#### numbers (saved as extracted data)
          2. mark matching sent-and-acknowledged replenishment orders picked up
     │
     ▼
Email marked Processed, or Failed (processed again by hand)
```

## Pickup email rules

- The subject must contain "pickup", "pick up" or "pick-up" (any case), and at least one attachment must be a PDF, image or Word document. Without an attachment the email isn't a pickup email and falls through to the POD check.
- OCR returns every "MB-" number on the document, ignoring Bill of Lading, invoice, zip and phone numbers.
- An order is marked picked up (dated when the email arrived, linked to the email) only if its pickup request was sent and acknowledged. Orders already picked up are left alone.
- Any unknown number, any order not yet sent and acknowledged, or no number at all marks the email Failed. Orders on the same email that were ready are still confirmed.

## Connecting and disconnecting

- **Connect** runs Google OAuth for one account and replaces any existing connection. The history cursor is set to the moment of connection, so only mail that arrives afterwards is read.
- **Disconnect** revokes Sauerobase's access at Google and deletes the stored connection. If revoking fails, that's logged and the disconnect still goes ahead. Nothing is read or sent until someone connects again, and reconnecting starts from that new moment.
- If Gmail reports the history cursor has expired (after a long gap), the cursor jumps to "now" and the missed mail is never read.

## What needs to be running

- Gmail connected for the org
- `SQS_GMAIL_QUEUE_URL` set. Without it, the inbox check and consumer both do nothing. The consumer doesn't run in development
- The inbox check, POD processor and pickup processor schedules
- The SimplyDepo integration, for POD lookups and fulfillments

## Failure behavior

- Inbox check failures show on Data Pipeline Health (`gmail-inbox`). The POD and pickup processors aren't pipelines there, so a failed email only shows as Failed on the Inbound Emails page.
- If handling a queued message throws (for example, Gmail can't be reached), the message stays on the queue and is delivered again.
- A failed acknowledgement classification is dropped for good. If the LLM call errors, the reply is treated as not an acknowledgement, the message carries on to the pickup and POD checks, and it's removed from the queue. Nothing re-reads that reply, so the order stays unacknowledged.
- A reply that isn't an acknowledgement also carries on to the pickup and POD checks.
- Failed emails stay Failed until someone presses **Process** on the Inbound Emails page. Process also works on Pending and already-Processed emails, and reuses the saved OCR result.
- A stored email that Gmail delivers again keeps its existing type and status.

## Timing

How often the inbox is checked is on [Data Pipeline Health](../02-features/information-currency.md). The POD and pickup processors run on their own short schedule in the background, each taking one Pending email per run.
