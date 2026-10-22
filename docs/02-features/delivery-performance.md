---
order: 3
title: Fulfillment
description: How long orders took to reach customers, and how often that met the delivery target, from iDrive's own dates.
last_verified: 2026-10-02
---

# Fulfillment

Fulfillment shows how long orders took to reach customers and how often that met the target. Shopify only knows an order was marked fulfilled; iDrive's BlueBox knows when it was picked, shipped and delivered. Operations uses it for performance reviews, chasing a late delivery and any conversation about service levels. The on-time figure depends on the two delivery targets set in [Configuration](./system-settings.md).

## Fulfillment screen: headline figures and order list

The headline figures cover every order matching the filters, not just the page on screen ([Rule 18](../01-business/business-rules.md)): average lead time, average transit time and on-time rate, with the targets in force shown under the on-time rate.

The order list shows each order's number, customer, amount (Shopify's order total), channel, and iDrive's picked, shipped and delivered dates. Where there's no delivery date yet, Shopify's estimated delivery date shows in gray. Sort by amount or any of the dates. Each order opens the same order view as [Orders](./order-visibility.md), with tracking numbers and links, iDrive's shipping charge and the order's profit and loss.

Filters are search (order number, customer name or email), order date range (this month by default), channel and fulfillment status. The fulfillment status filter uses Shopify's status, not iDrive's. Search doesn't match order tags; the [Orders](./order-visibility.md) search does.

![Fulfilment page with average lead time, transit time and on-time rate above the order list](/images/docs/delivery-performance.jpg)

## Transit time and lead time

| Measure | From | To | What it tells you |
| --- | --- | --- | --- |
| Transit time | iDrive dispatch | iDrive delivery date | How well the carrier performed |
| Lead time | Order placed | iDrive delivery date | What the customer experienced, including Sauero's own processing time |

Lead time is always longer, and the gap between the two is Sauero's own delay ([Rules 14 and 15](../01-business/business-rules.md)).

Each order's time is rounded to whole days first, then the averages are taken and shown to one decimal place. Only orders with an iDrive delivery date count. The per-order times feed the headline figures but don't show as columns in the list.

## How on-time is judged

An order is on time if its transit time is at or under the target for its channel ([Rule 16](../01-business/business-rules.md)):

| Target | Applies to |
| --- | --- |
| Wholesale target | WS-ECOM, WS-DSD, WS-CHAINS and ALTERNATIVE orders |
| Consumer target | Everything else, point-of-sale orders included ([Rule 2](../01-business/business-rules.md)) |

The on-time rate is on-time orders divided by orders with an iDrive delivery date. A delivered order with no recorded dispatch date has no transit time, so it counts as late.

The figure is worked out fresh every time the screen opens, so changing a target changes past reporting immediately. Targets never set default to seven days each, and a saved target must be at least one day ([Rule 17](../01-business/business-rules.md), [Configuration](./system-settings.md)).

## Which orders count as delivered

An order is delivered when iDrive records a delivery date ([Rule 13](../01-business/business-rules.md)); Shopify's fulfillment status isn't used. That's why this screen and the [Dashboard](./business-dashboard.md) disagree on how many orders are delivered (see [Order intake and tracking](../03-workflows/order-intake-and-tracking.md)).

- Orders iDrive never handled have no warehouse dates and are left out of every figure. That includes all WS-DSD orders, which Manuel Brothers delivers itself.
- Cancelled orders aren't left out. A cancelled order that still has an iDrive delivery date counts toward the averages and the on-time rate.

Both Shopify orders and iDrive's records refresh on a schedule (see [Data Pipeline Health](./information-currency.md)).

## No export, scan history or trends

- Nothing can be exported.
- Carrier scan history isn't shown. Tracking scans are stored where iDrive provides them, but the page only shows the picked, shipped and delivered dates plus the tracking links.
- There's no breakdown by carrier or by warehouse.
- There's no trend over time, only the current filtered set.
- Nothing alerts anyone when performance drops.
- Wide date ranges get slower, because the figures are computed across the whole set each time.
