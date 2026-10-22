---
order: 8
title: Inbound Emails
description: The queue of delivery paperwork (POD) and Manuel Brothers pickup emails picked up from the shared inbox, and how to act on them.
last_verified: 2026-10-02
---

# Inbound emails

Inbound Emails is the queue of emails Sauerobase picked up from the shared inbox for automatic processing. Processing runs in the background, and this screen is where operations checks that delivery paperwork and pickups went through and retries or clears anything that failed.

| Tab | What lands here | What processing does |
| --- | --- | --- |
| POD | Proof-of-delivery paperwork for SimplyDepo orders | Reads the documents and records the delivery in SimplyDepo. See [Proof of delivery processing](../03-workflows/proof-of-delivery-processing.md) |
| Pickup | Manuel Brothers' pickup paperwork for replenishment orders | Reads the MB order numbers off the documents and marks those replenishment orders as picked up. See [Distributor replenishment](../03-workflows/distributor-replenishment.md) |

A Gmail account has to be connected on [Configuration](./system-settings.md) for anything to arrive.

## Which emails land here

Only email received after the inbox was connected counts ([Rule 39](../01-business/business-rules.md)). Each new email is checked in this order, and the first match wins:

1. A reply on a replenishment email thread is checked first as a possible acknowledgement from Manuel Brothers ([Rule 32](../01-business/business-rules.md)). A real acknowledgement is recorded on the replenishment order and isn't listed here. Any other reply goes on to the next checks.
2. Pickup: the subject contains "pickup" (or "pick up" or "pick-up") and the email has at least one readable attachment.
3. POD: the subject contains the whole word "POD" or "PODs" and the email has at least one readable attachment ([Rules 37 and 38](../01-business/business-rules.md)).

Readable attachments are images (PNG, JPEG, WebP, GIF), PDFs and Word documents. Everything else in the inbox is ignored and doesn't show here.

## Inbound Emails screen: browsing and acting

Each tab lists emails newest first, with subject, sender, when it arrived, how many attachments it has and its status. Open one to see:

- sender, date and attachment names
- each attachment, opened from Gmail
- **Extracted Data**, what was read off the documents once the email has been processed
- the message itself, and an **Open in Gmail** link to the original thread

| Action | What it does | Available when |
| --- | --- | --- |
| **Process** | Runs processing now, to retry a failure or rerun a processed email | Pending, Failed or Processed |
| **Mark as processed** | Marks it done without processing, for something handled by hand or that isn't real paperwork | Pending or Failed |
| **Delete** | Removes it from this queue. The Gmail message isn't touched | Any status except Processing |
| **Open in Gmail** | Opens the original thread | Always |

## Email statuses

```
Pending ──► Processing ──► Processed
                 │
                 └──────► Failed ──► (Process again, or Mark as processed)
```

| Status | Meaning |
| --- | --- |
| Pending | Waiting to be processed. Emails are taken one at a time, oldest first ([Rule 40](../01-business/business-rules.md)) |
| Processing | Being worked on now. It can't be marked as processed or deleted until it finishes ([Rule 44](../01-business/business-rules.md)) |
| Processed | Every step succeeded |
| Failed | Something didn't go through. It stays failed until someone acts, and nobody is alerted ([Rule 43](../01-business/business-rules.md)) |

## Retrying and fixing failures

- Rerunning is safe. For POD emails, orders already fully delivered are skipped and quantities are capped at what's outstanding ([Rules 41 and 42](../01-business/business-rules.md)). For pickup emails, orders already confirmed are left as they are.
- A retry reuses what was already read. Once a document has been read, processing it again uses the same extracted data instead of reading the attachment again.
- Extracted data can't be corrected here. Handle a misread document by hand, then mark it as processed.
- A pickup email only confirms orders whose pickup request was sent and acknowledged. Otherwise it's treated as a request, not a confirmation, and fails. Any other orders on the same document that were ready are still confirmed ([Rule 62](../01-business/business-rules.md)).
- The reason for a failure isn't shown on screen. Compare the Extracted Data and the attachments with the order to work out what went wrong.

New emails arrive as the inbox is checked on a schedule (the Gmail inbox feed on [Data Pipeline Health](./information-currency.md)). The processing itself runs in the background and isn't listed there. The inbox is connected, changed or disconnected on [Configuration](./system-settings.md).
