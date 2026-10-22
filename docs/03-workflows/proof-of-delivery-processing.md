---
order: 3
title: Proof of Delivery
description: Delivery paperwork emailed to the shared inbox is read automatically and recorded as a delivery in SimplyDepo.
last_verified: 2026-10-02
---

# Proof of delivery processing

A driver's delivery paperwork (a photo, scan, PDF or Word document emailed to the shared Gmail inbox) becomes a completed delivery in SimplyDepo without anyone re-typing it. The matching order in Sauerobase updates at the same time, so its "Awaiting POD" step clears. On a normal day nobody touches it.

| Who | Their part |
| --- | --- |
| Driver or Manuel Brothers | Emails the paperwork to the shared inbox |
| Sauerobase | Recognizes it, reads it, matches it and records the delivery |
| Operations | Steps in only when something fails, or to close off paperwork by hand, on the [Inbound Emails](../02-features/inbound-emails.md) screen |

It starts when an email lands in the shared Gmail inbox. Sauerobase checks the inbox for new mail regularly, and the timing is on [Data Pipeline Health](../02-features/information-currency.md).

## BPMN flow

![Proof of delivery processing as a BPMN process — Manuel Brothers emails the paperwork, Sauerobase reads it and records each delivery in SimplyDepo](/images/docs/bpmn/proof-of-delivery-processing.svg)

The diagram uses standard BPMN 2.0. Its source, [proof-of-delivery-processing.bpmn](/images/docs/bpmn/proof-of-delivery-processing.bpmn), opens in any BPMN tool, such as bpmn.io, Camunda Modeler or draw.io. Each delivery document in the email goes through the loop in turn. The first document that fails ends processing and marks the whole email Failed.

## Steps

```
New email in the shared inbox
     │
     ▼
Subject has the word "POD"/"PODs"
and a readable attachment? ── no ──► ignored, no record
     │ yes
     ▼
Stored as Pending on the Inbound Emails POD tab
     │
     ▼
Taken from the queue, oldest first
     │
     ▼
Each attachment read (invoice number, products, cases)
     │
     ▼
For each delivery document:
  ├─► link to the matching Sauero order ("POD received")
  ├─► find the order in SimplyDepo ── none ──► Failed
  ├─► already fully delivered? ── yes ──► skip (counts as done)
  ├─► match lines, cap quantities ── nothing left ──► Failed
  └─► record the delivery in SimplyDepo ("POD processed")
     │
     ▼
Processed (every document got through) or Failed
```

1. The email is recognized as delivery paperwork when both tests pass: the subject contains the whole word "POD" or "PODs", and there's at least one readable attachment (a photo, scan, PDF or Word document) ([Rules 37 and 38](../01-business/business-rules.md)). Anything else is ignored with no record. Sauerobase first checks whether an email is a Manuel Brothers reply or pickup email (see [Distributor replenishment](./distributor-replenishment.md)), so a subject that also says "pickup" is treated as a pickup email.
2. Recognized paperwork is stored as **Pending** and waits its turn. One item is processed at a time, oldest first ([Rule 40](../01-business/business-rules.md)).
3. Each attachment is read automatically for the invoice number, products, case quantities and any dates. One attachment can hold several separate delivery documents, and each is handled on its own. If no invoice number or products can be read, the item fails. The result is saved with the email and shows as **Extracted Data** when the item is opened. If the item is processed again later, the saved reading is reused.
4. The invoice number is matched to the SimplyDepo order with that number in Sauerobase. When one is found, that order's Email flow card shows **POD received**, linked back to this email, and its "Awaiting POD" state clears, even if a later step fails. If no order matches, processing carries on and the paperwork isn't shown on any order.
5. The same invoice number is used to find the order in SimplyDepo. If SimplyDepo has no order with that number, the item fails here.
6. Sauerobase checks how much of the order is still outstanding. If it's already fully delivered, by hand in SimplyDepo or by an earlier run, nothing is sent, the order is marked **POD processed** and the document counts as a success ([Rule 41](../01-business/business-rules.md)). That's what makes re-running a document safe.
7. The products read from the paperwork are matched to the lines on the SimplyDepo order. This is another AI judgment, because the wording on a delivery note rarely matches the catalog word for word.
8. Every matched quantity is cut to what's still outstanding on that line, and lines with nothing outstanding are dropped ([Rule 42](../01-business/business-rules.md)), so a misread figure can't cause an over-delivery. If nothing is left after capping, the item fails.
9. The delivery is created in SimplyDepo, dated from the paperwork (its delivery date, or else its order date), or today if neither was found. The order is marked **POD processed**.
10. The item is marked Processed only if every document in the email got through. If anything failed, the whole email is marked **Failed**, even if some of its documents were already recorded. Processing stops at the first document that fails, so the documents after it in the same email aren't attempted.

## Endings, failures and retries

| Ending | What it means |
| --- | --- |
| Processed | Every document was recorded in SimplyDepo or safely skipped. It doesn't guarantee a delivery was recorded, because an order already fully delivered is skipped and still reaches Processed |
| Failed | Something went wrong, and it waits for a person |
| Marked as processed | Someone closed it off without running it, for paperwork already recorded elsewhere or sent by mistake. Not possible while the item is processing ([Rule 44](../01-business/business-rules.md)) |

- A failed item stays failed. Nothing retries it, so someone has to open it on [Inbound Emails](../02-features/inbound-emails.md) and choose **Process** ([Rule 43](../01-business/business-rules.md)). There's no time limit, escalation or notification.
- The screen shows that an item failed, not why. The Extracted Data helps: a missing invoice number or an empty product list points to a reading problem, while a clean reading points to the SimplyDepo side. Past that, working out the cause needs someone technical.
- Processing again is safe. **Process** works on any item not being processed right now, Processed ones included, and an order with nothing outstanding is skipped, so running the same item twice won't double-deliver.
- If the inbox connection breaks, nothing is picked up at all, and only mail that arrives after it's reconnected is ever read ([Rule 39](../01-business/business-rules.md)). See [Limitations](../01-business/limitations.md).

The POD tab, the detail view and every action are covered on [Inbound Emails](../02-features/inbound-emails.md).
