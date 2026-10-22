---
order: 1
title: Order Intake and Tracking
description: How every order reaches Sauerobase, gets completed by the full refresh, and is joined to iDrive's delivery record.
last_verified: 2026-10-02
---

# Order intake and delivery tracking

Every order reaches Sauerobase as it's placed and is kept up to date as it changes. It's then joined to iDrive's record of what happened to it, so the business can see what sold, when it arrived and whether that met the target. Nobody drives this process, but knowing how it works explains why a new order can show the wrong channel for a while, and why two screens can disagree about the same order.

| Who | Their part |
| --- | --- |
| Customer | Places the order in Shopify, at a point-of-sale counter or through SimplyDepo |
| iDrive (BlueBox) | Picks, packs, ships and records delivery |
| Sauerobase | Brings both sides in, joins them and works out the figures |
| Operations | Looks at the result on the [Orders](../02-features/order-visibility.md) and [Fulfillment](../02-features/delivery-performance.md) screens |

It starts when an order is placed, anywhere. Nothing is entered here by hand: every order, whatever its channel, passes through Shopify, and that's where Sauerobase reads it.

## BPMN flow

![Order intake and tracking as a BPMN process — the customer, Shopify, Sauero (Operations and Sauerobase) and BlueBox, with the real-time, full-refresh and warehouse tracks](/images/docs/bpmn/order-intake-and-tracking.svg)

The diagram uses standard BPMN 2.0. Its source, [order-intake-and-tracking.bpmn](/images/docs/bpmn/order-intake-and-tracking.bpmn), opens in any BPMN tool, such as bpmn.io, Camunda Modeler or draw.io. Three tracks run independently: the real-time update from Shopify, the scheduled full order refresh that completes each order, and the scheduled warehouse refresh from BlueBox. Figures are only worked out when someone opens a report.

## Steps

```
Order placed or changed in Shopify
     │
     ├─► Real-time update (within moments)
     │     order, payment, cancellation,
     │     refunds and fulfilments
     │
     ▼
Order shows on the Orders screen
  (channel, display name and bundle
   breakdown not filled in yet)
     │
     ▼
Scheduled full order refresh
  fills in the rest, tidies the record,
  and sends the distributor notification
  for new SimplyDepo orders
     │
     ▼
Scheduled warehouse refresh brings in
  BlueBox's picked / packed / shipped /
  delivered dates and shipping charge
     │
     ▼
Figures worked out when a report is opened
```

1. The order appears within moments. Shopify sends a real-time update whenever an order is created, updated, paid, cancelled or fulfilled. Refunds and fulfillments have their own real-time updates, so a refund or a new tracking number shows up right away. If a refund or fulfillment arrives for an order Sauerobase hasn't seen yet, it fetches that whole order from Shopify on the spot.
2. The real-time update doesn't carry three things: the sales channel, the order's display name, and the breakdown of multi-pack bundles into their component products ([Rules 3 and 6](../01-business/business-rules.md)). Until the full refresh fills these in, a point-of-sale or SimplyDepo order is reported as a consumer or wholesale order.
3. On a schedule, the full refresh re-reads from Shopify every order that changed since its last successful run. It fills in the channel, display name and bundle breakdown. It replaces the order's products, refunds and fulfillments with what Shopify reports, so anything removed in Shopify is removed here too. And the first time it sees a new SimplyDepo order, it sends the Manuel Brothers notification (see [New order notification](./new-order-notification.md)).
4. On its own schedule, Sauerobase brings in BlueBox's records for each order: when it was received, picked, packed, shipped and delivered, its delivery status and the shipping charge. Carrier tracking scans are stored where BlueBox provides them, but no screen shows them.
5. BlueBox's record of an order is matched to Shopify's. Orders iDrive never handled, like a point-of-sale sale or an order Manuel Brothers delivers, have no delivery information, and their fulfillment cost uses the entered shipping cost instead of iDrive's actual charge ([Rule 10](../01-business/business-rules.md)). An order counts as delivered when iDrive records a delivery date, not when Shopify says Fulfilled ([Rule 13](../01-business/business-rules.md)).
6. Transit time, lead time and on-time performance are calculated when a report opens, from whatever is held at that moment. None of them are stored, so changing a delivery target changes past reporting too.

How often each refresh runs is on [Data Pipeline Health](../02-features/information-currency.md). Orders are never removed. Cancelled ones stay on the Orders screen but are left out of all revenue reporting ([Rule 4](../01-business/business-rules.md)).

Classification and reporting follow [Rules 1 to 7](../01-business/business-rules.md), and cost and delivery performance [Rules 10 to 18](../01-business/business-rules.md).

## Why the dashboard and the Fulfillment screen disagree

The dashboard's order status breakdown uses Shopify's fulfillment status, and the Fulfillment screen uses BlueBox's records ([Rule 13](../01-business/business-rules.md)). They won't agree on how many orders are delivered or in transit, and both are right because they answer different questions. When reconciling a figure, first find out which source it came from.

## When a refresh stops

- If the real-time updates stop, new orders, refunds and fulfillments no longer show up within moments, but the next full refresh still picks up every changed order. Little is lost beyond timeliness.
- If the full refresh stops, orders keep appearing but stay incomplete: wrong channel, no bundle breakdown, no display name, so channel and product reporting drift. New SimplyDepo orders also stop being announced to Manuel Brothers, and once they're more than a day old they never will be, even after the refresh recovers ([Rule 46](../01-business/business-rules.md)).
- If the warehouse refresh stops, delivery performance figures freeze at their last values until the next successful run catches up.

Every one of these failures shows on [Data Pipeline Health](../02-features/information-currency.md), and the next successful run covers the same ground again ([Rule 53](../01-business/business-rules.md)).
