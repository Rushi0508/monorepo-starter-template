---
order: 2
title: Orders
description: One searchable list of every order from every channel, with full detail and profit and loss for each.
last_verified: 2026-10-02
---

# Orders

Orders is one searchable list of every order from every channel, with enough detail to answer a customer or warehouse question without opening Shopify. Operations uses it day to day for customer queries, delivery chases and checking what shipped last week, and commercial uses it to dig into a figure.

## Orders screen: search, filters and columns

Search by order number, customer name, customer email or any tag applied in Shopify. Tag search is how you find orders grouped by whatever tagging convention the team uses in Shopify.

| Filter | Notes |
| --- | --- |
| Order date | A date range, in your own time zone |
| Channel | One or more channels, assigned by [Rule 1](../01-business/business-rules.md) |
| Product | One or more products. Renamed products also match their old codes |
| Payment status | Shopify's payment status |
| Fulfillment status | Shopify's fulfillment status |
| Est. delivery date | The estimated delivery date Shopify holds for the shipment |
| Delivered at | The delivery date Shopify holds for the shipment, not iDrive's. To work from iDrive's delivery dates, use [Fulfillment](./delivery-performance.md) |
| Cancellation | All orders, cancelled only, or not cancelled |
| Order type | Normal, bundle or subscription orders |

Sort by date or net revenue only, newest first by default. Results come 10, 20, 30 or 40 to a page.

Each row shows the order number (struck through if cancelled, with the cancellation date), date, channel, customer, products, net revenue, payment status, Shopify's fulfillment status and the BlueBox status.

![Orders list with channel, customer, products, net revenue, payment, fulfilment and warehouse status](/images/docs/orders-list.jpg)

## Order detail

Click a row to open the order. The same view opens from the [Fulfillment](./delivery-performance.md) board and from a customer's order history on [Customers](./customer-insight.md).

- Products, with any discount on each line, then subtotal, discounts, shipping, tax and total as Shopify recorded them
- Profit and loss, top to bottom: gross revenue, discounts, refunds, net revenue, cost of goods, gross profit and margin, fulfillment cost, and contribution profit and margin. These use each product's costs as of the order date, with iDrive's actual shipping charge when it has one, the same figures the [Revenue](./revenue-and-margin.md) page adds up ([Calculations](../01-business/calculations.md)). Costs not yet entered count as zero, refunds follow [Rule 5](../01-business/business-rules.md) and bundles [Rule 6](../01-business/business-rules.md). Cancelled orders show no profit and loss
- Fulfillment details: Shopify's and BlueBox's statuses, iDrive's shipping charge, and the ordered, picked, shipped and delivered dates (or the estimated delivery date if it hasn't arrived yet)
- Email flow, for SimplyDepo orders that went through the delivery process: when the delivery request went to Manuel Brothers (linked to the email thread), when the proof of delivery came back (linked to it) and when it was processed. See [New order notification](../03-workflows/new-order-notification.md) and [Proof of delivery processing](../03-workflows/proof-of-delivery-processing.md)
- Tracking: carrier, tracking numbers and links
- The order note, tags, shipping address, and payment status and method

![An order opened from the list, showing its products, totals and profit and loss](/images/docs/order-detail.jpg)

## Payment, fulfillment and BlueBox statuses

Sauerobase shows what Shopify and BlueBox report, and nothing in Sauerobase moves an order between these states. Payment and fulfillment run side by side.

Payment status, which can also be Partially paid:

```
Pending → Authorised → Paid → Partially refunded → Refunded
                            → Voided
```

Fulfillment status, which can also be Pending fulfillment or Open:

```
Unfulfilled → Partially fulfilled → Fulfilled
            → On hold / Scheduled / In progress / Restocked
```

Cancellation is recorded separately, with a date and reason, and the order stays visible. "Delivered" on the dashboard means Shopify says Fulfilled, so shipped but not necessarily arrived. The Fulfillment screen uses iDrive's delivery date instead, so the two counts won't agree ([Rule 13](../01-business/business-rules.md)).

The BlueBox status is iDrive's own process, read-only here. The transfer check only acts on Shipped, Delivered and Cancelled ([Rule 34](../01-business/business-rules.md)).

```
Open → Received → Picking → Picked → Packing → Packed → Shipped → Delivered
     ↘ Hold · Needs attention · Cancelled
```

SimplyDepo (WS-DSD) orders show **N/A** as their BlueBox status. Manuel Brothers delivers these itself, so iDrive cancels them automatically when they arrive. That cancellation is expected, so it's hidden instead of shown as a problem.

## When new orders show up

New orders appear within moments of being placed, but the channel isn't final until the next full order refresh sees the order ([Rule 3](../01-business/business-rules.md)). Until then a point-of-sale or SimplyDepo order can show as consumer or wholesale. Refreshes run on a schedule (see [Data Pipeline Health](./information-currency.md)).

## Read-only, no export or bulk actions

- Orders can't be changed, cancelled, refunded or annotated here. Do that in Shopify.
- Results can't be downloaded, and there are no bulk actions.
