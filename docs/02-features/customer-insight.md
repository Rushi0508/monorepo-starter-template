---
order: 7
title: Customers
description: Who buys, what they are worth, and for wholesale accounts, how fast they reorder each product.
last_verified: 2026-10-08
---

# Customers

Customers shows who buys and what they're worth, and through reorder rate, whether a wholesale account is slowing down. Commercial uses it for account reviews, deciding who to contact and seeing where revenue concentrates.

## Customer list screen: search, filter and sort

- Search by name, email, Sauero code, state, city or any tag
- Filter by order date range, by how many orders a customer has placed (minimum and maximum), by the state on any of their addresses, or by channel (anyone with at least one order in a chosen channel)
- See each customer's location, orders, cases, gross and net revenue, gross profit, average order value and last order date
- Sort by orders, gross or net revenue, gross profit, average order value or last order

With an order date range set, the list only shows customers who ordered in that range, and their figures only cover those orders. With no range, the figures are lifetime.

![Customer list with location, orders, cases, revenue, profit and last order](/images/docs/customers-list.jpg)

## Customer profile screen: one customer's figures and history

- Sauero code, every channel the customer has ordered through, contact details, notes and tags
- Their Folk status, account type and last contact, with a link to the Folk record, when the customer is linked to Folk (see [New customer to Folk](../03-workflows/new-customer-to-folk.md))
- Lifetime orders, gross and net revenue, net average order value, gross profit, discounts and last order
- The three products they bought most recently
- Their full order history, cancelled orders included. Each order opens the same order view as [Orders](./order-visibility.md)

Wholesale customers also get the figures below. A customer counts as wholesale when their Shopify tags include "b2b" or "wholesale", or when any of their orders came through a wholesale channel (WS-ECOM or WS-DSD, for example SimplyDepo orders):

- Lifetime case volume
- An editable store count: how many stores the account supplies, starting at 1. It's the only thing you can edit on this page; customer details belong in Shopify
- The SKU velocity table of reorder rates per product (below)

![A customer profile with contact details, lifetime figures and order history](/images/docs/customer-profile.jpg)

New customers are added the moment their first order arrives. Changes to existing customer details arrive on a schedule (see [Data Pipeline Health](./information-currency.md)).

## Profit means gross profit here

"Profit" on this page is gross profit: net revenue less cost of goods ([Rule 8](../01-business/business-rules.md)). Fulfillment cost isn't taken off, so it's higher than the contribution profit on the [Revenue](./revenue-and-margin.md) page. Both are defined in [Calculations](../01-business/calculations.md). Cancelled orders are left out of every figure ([Rule 4](../01-business/business-rules.md)), only completed refunds count ([Rule 5](../01-business/business-rules.md)), and each order uses the costs in force on its date ([Rule 12](../01-business/business-rules.md)).

A product with no cost of goods in SKU settings counts it as zero, so gross profit reads too high until someone enters it ([Rule 11](../01-business/business-rules.md)).

## Reading the reorder rate

This is the most useful figure on the page, and the most misread. The SKU velocity table shows, for each product the customer buys:

| Column | What it is |
| --- | --- |
| Total units | Every unit of that product the customer has ordered |
| Units / week | Total units divided by the weeks from the customer's first order to today |
| Units / store / week | Units / week divided by the customer's store count, also called retail velocity |
| Cans / store / week | Units / store / week times the cans in each unit, from the product's **Config (Units)** column in SKU settings. A product with no Config (Units) counts each unit as one can |

The weeks run to today, not to the last order, on purpose. A customer who has stopped ordering sees their rate fall week by week, which is the early warning the figure is there to give. It's a reorder and churn signal, so don't compare it to a lifetime average.

The weeks start from the customer's first order of any product, so a product they only started buying recently shows a lower rate than its recent pace.

- A customer with only one order shows no rate, because one order gives no interval to measure.
- The measurement period never drops below one week, so a customer who ordered yesterday doesn't show an inflated rate.
- Store count only divides the rate, so keep it current for the per-store figures to mean anything.

## No export, segments or business-wide velocity

- Nothing can be exported.
- There's no segmentation, grouping or saved views.
- Reorder rates are per customer and product, for wholesale customers only. There's no business-wide view of them.
