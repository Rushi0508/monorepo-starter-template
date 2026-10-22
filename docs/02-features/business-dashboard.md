---
order: 1
title: Dashboard
description: The landing page, with headline figures, trends, order status, top products and website traffic for a chosen period.
last_verified: 2026-10-02
---

# Dashboard

The landing page everyone sees first, titled **Command Center** in the app, for daily check-ins and period reviews. It has headline figures for a chosen period, net revenue against the period before, trends, order status, the top five products, new and returning customers, and website traffic.

## Command Center screen: figures, trends and filters

- Four headline figures: orders, net revenue (with the change against the previous period), units shipped and open alerts. Four more sit under **View more metrics**
- Revenue, order volume and average order value over time, each switchable between daily, weekly, monthly and quarterly
- Website sessions by traffic source and device
- Filters for date range and one or more channels
- **Open alerts** jumps to the orders list, filtered to paid, unfulfilled, not cancelled orders. That list includes every such order, not just the 2-to-30-day window the card counts

The date range defaults to this month (the first to the last day of the current month). Presets are this month, last month and year to date, and any other range can be picked on the calendar. Dates are whole days in your own time zone.

![Home page with headline figures, extra metrics, order status breakdown and top products](/images/docs/business-dashboard.jpg)

![Revenue and order volume trends, switchable between daily, weekly, monthly and quarterly](/images/docs/business-dashboard-trends.jpg)

## What each figure counts

| Figure | What it counts | Follows the filters? |
| --- | --- | --- |
| Orders | Every order placed in the range, cancelled ones included | Date and channel |
| Net revenue | Revenue after discounts and refunds, without cancelled orders. See [Calculations](../01-business/calculations.md) | Date and channel |
| Units shipped | Units on orders Shopify marks as Fulfilled | Date and channel |
| Open alerts | Orders that are paid but unfulfilled and between 2 and 30 days old, so they may be stuck | No, always today's position |
| Conversion rate | Completed checkouts divided by website sessions | Date only |
| Repeat purchase rate | Customers with two or more orders in the range, divided by all customers who ordered in the range | Date and channel |
| Avg time between orders | Average days between one order and the next, for customers with two or more orders in the range | Date and channel |
| Active subscriptions | Subscriptions active in Shopify right now | No, always today's count |

The last four sit under **View more metrics**. Repeat purchase rate and average time between orders only look inside the selected range, so a customer who ordered once this month and many times last year counts as a one-order customer here.

## Net revenue against the previous period

The net revenue card compares against the same length of time right before the selected range: a fourteen-day range compares against the fourteen days before it. Only net revenue has a comparison.

- The range needs both a start and an end date. If either is open, there's nothing to compare against and the change shows 0%.
- If the previous period had no net revenue (zero or less), the change shows 0%.
- The comparison covers the whole range, including days that haven't happened yet. On the default "this month" range, the month so far is set against the whole previous period of the same length, so early in the month the change reads low.

## Order status buckets

Every order in the range lands in exactly one of five buckets, tested in this order:

| Bucket | Which orders |
| --- | --- |
| Cancelled | Any cancelled order |
| Refunded | Refunded or partially refunded |
| Delivered | Shopify marks it Fulfilled |
| In transit | Shopify marks it partially fulfilled or in progress |
| **Paid · Unfulfilled** | Everything else |

The buckets are fixed, and they come from Shopify's status, not iDrive's records. The [Fulfillment](./delivery-performance.md) screen uses iDrive's delivery date instead ([Rule 13](../01-business/business-rules.md)), so the two screens won't agree on how many orders are delivered or in transit. Both are right; they answer different questions.

## Top products

The five products with the most revenue in the range, where revenue is each line's price times quantity less the discount on that line. Refunds aren't taken off and shipping isn't included, so it won't match the [Revenue](./revenue-and-margin.md) page exactly. Cancelled orders and items removed from an order are left out, and renamed products count under their current code.

## New and returning customers

Customers are counted by how many orders they placed inside the selected range: one order is "new", two or more is "returning". Earlier history isn't considered, so a long-standing customer who ordered once this month shows as new. Cancelled orders are left out.

## Website traffic

Sessions and conversion come from Shopify's analytics, which records traffic by calendar day in universal time (UTC). They follow the date range but ignore the channel filter, and the days aren't shifted to your time zone. Traffic arrives on a schedule, so it can lag the rest of the page. If any figure looks behind, check [Data Pipeline Health](./information-currency.md).

## No export, drill-down or targets

- Nothing can be exported.
- There's no drill-through from a figure to the underlying orders, apart from the Open alerts card.
- There are no configurable targets or thresholds on any figure.

Rules behind this page: [1, 4, 5 and 13](../01-business/business-rules.md).
