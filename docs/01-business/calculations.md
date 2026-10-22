---
order: 7
title: Calculations
description: How every revenue, profit, and margin figure is worked out, and the few places that differ.
last_verified: 2026-10-02
---

# How revenue and margin are calculated

These definitions apply everywhere the figures appear: the revenue page, the dashboard, the orders list and each order's profit and loss, customers, fulfillment, and the order figures written to Folk. The exceptions are under [Where figures differ](#where-figures-differ).

## Revenue and profit

| Figure | How it's calculated |
| --- | --- |
| Gross revenue | Unit price times quantity, plus the shipping charged to the customer. No tax |
| Net revenue | Gross revenue minus discounts minus refunds |
| Gross profit | Net revenue minus cost of goods (COGS) |
| Gross margin | Gross profit divided by net revenue |
| Contribution profit | Gross profit minus fulfillment cost |
| Contribution margin | Contribution profit divided by net revenue |

## What counts toward revenue

- Tax is never revenue. Tax charged is owed to the tax authority, so it's left out of gross revenue, and tax refunded on products is left out of refunds.
- Discounts include discounts on shipping, like free-shipping codes, because shipping is part of gross revenue.
- Refunds only count once they complete, and against the day the order was placed, not the day the refund was issued. A refund with no successful payment back counts as zero, and tax refunded on shipping stays in the refund ([Rule 5](./business-rules.md)).
- Cancelled orders are left out ([Rule 4](./business-rules.md)).
- Days follow a time zone: your own on screen, Mountain time for the AI assistant. Orders placed in the hours between the two can land on different days, so totals near the ends of a range can differ slightly, and neither figure is wrong ([Rule 7](./business-rules.md)).

## Costs

Costs are entered per SKU in SKU settings, for one unit of the SKU as it's sold: a single can for a can SKU, the whole case for a case SKU.

- Cost of goods (COGS) is materials, production and shipping to the warehouse, the same in every channel ([Rule 8](./business-rules.md)).
- Fulfillment cost is storage, pick, pack and shipping to the customer, entered per channel. When iDrive reports an order's actual shipping charge, it replaces only the shipping part; storage, pick and pack stay as entered ([Rule 10](./business-rules.md)).
- Costs are dated. Each change is a new version from its effective date, and an order uses the version in force on the day it was placed, so a new cost never rewrites past margins ([Rule 12](./business-rules.md)).
- A cost that hasn't been entered counts as zero, so margin reads too high until every product sold has its costs ([Rule 11](./business-rules.md)).

## Product and channel breakdowns

Shipping is charged per order, not per product. In the revenue page's product and channel breakdown, each order's shipping charge, less any discount or refund on it, is shared across the order's products by units. iDrive's actual shipping cost is shared the same way.

Breakdown totals can differ slightly from the headline figures, because items without a SKU and items removed from an order aren't part of the breakdown.

## Where figures differ

The dashboard's top-products list ranks products by a simpler figure: unit price times quantity, less the discount on that line. It leaves out shipping, order-level discounts and refunds, so it reads higher than the same product's net revenue on the revenue page. Use it to see which products sell most, and the revenue page for the exact figure.

When the revenue page is filtered to one or more products, the headline gross revenue adds only those products' lines but still includes each matching order's whole shipping charge. Discounts and refunds come off for the whole order too, not just the chosen products, and the product breakdown shares that whole-order shipping among the chosen products only. So a filtered figure means the chosen products plus the shipping, discounts and refunds of the orders they were in. For one product's own share, use its row in the product breakdown with no product filter.
