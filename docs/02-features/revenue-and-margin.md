---
order: 6
title: Revenue
description: What the business earned over a period, what it cost to deliver, and what was left, by channel and by product.
last_verified: 2026-10-02
---

# Revenue and margin

Revenue shows what Sauero earned over a period, what it cost to deliver and what was left, split by channel and by product. Commercial uses it for period reporting, pricing and channel decisions, and seeing which products carry the business. Margin is only as accurate as the costs entered in SKU settings, so read [What limits these numbers](#what-limits-these-numbers) before relying on it.

## Revenue screen: figures, chart and breakdown

The headline figures are gross revenue, discounts, refunds, net revenue, cases sold, cost of goods, gross profit and margin, fulfillment cost, and contribution profit and margin.

The chart shows net revenue or cases sold over time (daily, weekly, monthly or quarterly), stacked by channel or by product. The product view shows the eight largest products and groups the rest as Other. Each product is labeled by its SKU code, since different SKUs can share a product name.

The breakdown switches between channel (the default) and product, and any row expands to show the other: a channel's products, or a product's channels. Each row shows cases, gross revenue, net revenue, gross margin and contribution margin, largest net revenue first, and can be re-sorted by any figure. Channel rows also show how many orders and products they cover. Both views are built from line items, so a row's expanded rows add up to it.

Filters are date range (this month by default), one or more channels and one or more products. The chart's and breakdown's channel or product choice is kept in the page link, so a shared link opens the same view.

![Revenue page with headline figures and net revenue by product over time](/images/docs/revenue-overview.jpg)

![Breakdown by channel with cases, revenue and both margins](/images/docs/revenue-breakdown.jpg)

## How the figures are calculated

Every figure, including how shipping is shared across products in the breakdown, is defined in [Calculations](../01-business/calculations.md). The page links there from **How is this calculated?** under its filters.

The date range and the chart's days are whole days in your own time zone, and each order is costed with the costs in force on its day in that time zone ([Rule 12](../01-business/business-rules.md)). The AI assistant uses Mountain time, so totals near the ends of a range can differ slightly between the two.

## Why headline figures and the breakdown differ

The headline figures add up whole orders; the chart's product view and the breakdown add up products. They differ in two known ways:

- Headline gross revenue includes items removed from an order after it was placed, and items with no SKU. Cases, cost of goods and the breakdown leave them out.
- With a product filter on, the headline figures add only the chosen products' lines but still take off each matching order's whole shipping charge, discounts and refunds, and its whole actual shipping cost from iDrive. On an order that also had other products, that makes the chosen products look worse than they are. The breakdown shares those amounts across products by units, so for a single product it's the better guide.

## What limits these numbers

- A product with no cost of goods, or no fulfillment cost for a channel, counts that cost as zero, so margin reads too high ([Rule 11](../01-business/business-rules.md)). Enter costs in SKU settings for every product sold.
- Cancelled orders are left out of every figure ([Rule 4](../01-business/business-rules.md)).
- Refunds count against the day the order was placed, not the day the refund was issued, so a past period can drop when a late refund completes ([Rule 5](../01-business/business-rules.md)).
- Figures depend on orders having come in (see [Data Pipeline Health](./information-currency.md)).

Bundles are split into their products ([Rule 6](../01-business/business-rules.md)), and cost rules are [Rules 8 to 12](../01-business/business-rules.md).

## No export, comparisons or per-customer view

- Nothing can be exported.
- There's no previous-period comparison here; the [Dashboard](./business-dashboard.md) has one for net revenue.
- There's no forecast or budget comparison here; see [Demand planning](./demand-planning.md).
- There's no per-customer or per-region breakdown. [Customers](./customer-insight.md) has per-customer figures.
- Wide date ranges get slower, with no limit and no caching.
