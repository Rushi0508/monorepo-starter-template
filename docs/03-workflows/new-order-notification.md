---
order: 2
title: New Order Notification
description: New SimplyDepo orders are emailed to Manuel Brothers automatically, with the SimplyDepo order PDF attached.
last_verified: 2026-10-02
---

# New order notification

When an order comes in through SimplyDepo, Manuel Brothers is emailed the delivery details automatically: the account, the address, the products and case counts, the payment status and the SimplyDepo order PDF. They can plan the delivery without anyone forwarding anything, and nobody at Sauero touches it.

| Who | Their part |
| --- | --- |
| Customer | Places the order through SimplyDepo |
| Sauerobase | Recognizes it, looks it up in SimplyDepo, builds the email and sends it from the connected Gmail inbox |
| Manuel Brothers | Gets the details and plans the delivery |

It starts when the scheduled full order refresh sees a SimplyDepo order for the first time, not when the order is placed. The real-time update when an order comes in doesn't say which channel it came from, so the notification waits for the full refresh ([Rule 3](../01-business/business-rules.md)). How often that refresh runs is on [Data Pipeline Health](../02-features/information-currency.md).

## BPMN flow

![New order notification as a BPMN process — Sauerobase checks the order, looks it up in SimplyDepo and emails Manuel Brothers](/images/docs/bpmn/new-order-notification.svg)

The diagram uses standard BPMN 2.0. Its source, [new-order-notification.bpmn](/images/docs/bpmn/new-order-notification.bpmn), opens in any BPMN tool, such as bpmn.io, Camunda Modeler or draw.io. Each check that fails ends the process with no message. If the SimplyDepo lookup fails, the email still goes, without the payment line or PDF.

## Steps

```
Full order refresh sees the order for the first time
     │
     ▼
SimplyDepo order? ── no ──► stop
     │ yes
     ▼
Less than 24 hours old? ── no ──► stop
     │ yes
     ▼
Cancelled? ── yes ──► stop
     │ no
     ▼
Distributor email set in Configuration? ── no ──► stop
     │ yes
     ▼
Look the order up in SimplyDepo
  (payment status, SKUs, order PDF)
     │
     ▼
Send the email and record it on the order
```

1. The refresh sees the order for the first time. An order it has already completed never triggers anything again ([Rule 47](../01-business/business-rules.md)).
2. If it isn't a SimplyDepo order, nothing happens ([Rule 45](../01-business/business-rules.md)).
3. If it's more than 24 hours old, nothing happens ([Rule 46](../01-business/business-rules.md)). This stops a first-time or catch-up refresh from emailing Manuel Brothers about every past order.
4. A cancelled order is skipped.
5. The address comes from **Configuration**, under Distributor email (Manuel Brothers): the Primary address gets the email and every CC address is copied. If Primary is blank, nothing is sent and nothing shows on screen ([Rule 30](../01-business/business-rules.md)).
6. The order is looked up in SimplyDepo by its order name with any leading "#" removed ("#1033" is looked up as "1033"), since that's how SimplyDepo stores it. The lookup supplies the payment status, the SKU for each product and the order PDF.
7. The email is built and sent. The subject is **Sauero Order — {account name} (Invoice {order name})**, where the order name is the one Shopify shows.
8. Once Gmail accepts the email, the send time and its Gmail conversation are saved on the order. Open the order on [Orders](../02-features/order-visibility.md) to see an **Email flow** card with **Delivery request** (the send time, linked to the Gmail conversation), then **POD received** and **POD processed** once the delivery paperwork comes back (see [Proof of delivery](./proof-of-delivery-processing.md)).

### What the email contains

| Detail | Where it comes from |
| --- | --- |
| Account Name | The delivery address company, else the name on the delivery address, else the order's email address, else "Order #{number}". The billing address is used if there's no delivery address |
| Account Address | The delivery address, or the billing address if there isn't one |
| Product/Qty | Each product line with its quantity in cases, using the order's current quantities, so edits made in Shopify before the refresh show up. A line removed by an edit shows as 0 cases |
| SKU | From the matching SimplyDepo product, matched by product name. Falls back to Shopify's SKU, and is left off when neither has one |
| Total cases | Summed across the lines |
| Payment | SimplyDepo's own payment status. Left out entirely if the SimplyDepo lookup fails or finds no order |
| Attachment | The SimplyDepo order PDF. Left off if the lookup fails or the PDF can't be generated |

## Failed sends and the 24-hour cutoff

The process ends with the email sent and recorded on the order, or skipped. A skipped or failed notification shows on the order's Email flow card and nowhere else.

- If Gmail isn't connected or the send is rejected, the failure goes to the server's internal logs. The order syncs normally, and its Email flow card shows Delivery request as **Not sent**, or the card doesn't appear at all.
- There's no retry and no resend. The notification is only tried on the first full refresh that sees the order.
- If the full refresh stops for more than a day, new orders pass the 24-hour cutoff while it's down. When it recovers, those orders are skipped and Manuel Brothers is never told about them ([Rule 46](../01-business/business-rules.md)). After an outage of more than a day, check which SimplyDepo orders came in during it and tell Manuel Brothers by hand.
