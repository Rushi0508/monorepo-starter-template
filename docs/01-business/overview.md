---
order: 1
title: Overview
description: What Sauerobase does, who uses it, and how it connects the systems Sauero runs on.
last_verified: 2026-10-02
---

# Sauerobase overview

Sauerobase is Sauero's operations platform. It pulls Shopify, iDrive's BlueBox warehouse, Manuel Brothers, SimplyDepo and Folk into one place, so the team can see the whole business without opening each system. It also handles the hand-offs between those systems that used to be done by hand. Everyone who signs in gets the same full access, and someone already in the system has to add a person before they can sign in ([Roles and access](./roles.md)).

## How the systems fit together

![System landscape — Sauerobase in the middle, with the systems it reads from and writes to](/images/docs/system-landscape.svg)

Shopify is the source of truth for orders and stock, and SimplyDepo orders reach Shopify first. Sauerobase reads from every system, writes back only where a hand-off needs it, and emails Manuel Brothers from one shared inbox. What each system is responsible for is in [Purpose and scope](./purpose-and-scope.md), and how each connection behaves is in [Connected systems](./connected-systems.md).

## Screens

| Screen | What it gives you |
| --- | --- |
| [Orders](../02-features/order-visibility.md) | Every order from every channel, searchable, with payment, delivery and warehouse status, and each order's profit and loss |
| [Customers](../02-features/customer-insight.md) | Who buys, what they're worth, how often they reorder and how fast wholesale accounts sell through |
| [Revenue](../02-features/revenue-and-margin.md) | Revenue, discounts, cost of goods, fulfillment cost and margin by date range, channel and product |
| [Fulfillment](../02-features/delivery-performance.md) | How long orders take to reach customers, and how often that meets the target |
| [Inventory](../02-features/stock-visibility.md) | Stock at iDrive by product and batch, what's expiring, what's in production or being kitted, what's at Manuel Brothers, and what it's all worth |
| [Replenishment](../03-workflows/distributor-replenishment.md) | Send stock to Manuel Brothers in one action and track it through pickup and delivery |
| [Inbound emails](../02-features/inbound-emails.md) | Proof of delivery and pickup confirmations emailed in, read and recorded automatically |
| [Demand planning](../02-features/demand-planning.md) | A rolling plan of cases by channel and product, built from real sales, with scenarios and forecast accuracy |
| [Folk mapping](../02-features/folk-mapping.md) | Folk companies matched to Shopify customers, with their ordering figures kept current in Folk |
| [SKU settings](../02-features/product-master-data.md) | The master product list, prices and costs over time, your own custom fields, and a record of who changed what |
| [Data pipeline health](../02-features/information-currency.md) | Whether the figures on screen are current, and what has failed |
| [AI assistant](../02-features/ai-assistant-access.md) | This help center, searchable and exportable to PDF, Word or Markdown, and an AI assistant that answers questions in Claude |

## Work that runs on its own

1. Proof-of-delivery documents emailed to the shared inbox are read, matched to the right order and recorded as delivered in SimplyDepo. See [Proof of delivery](../03-workflows/proof-of-delivery-processing.md).
2. Once a transfer to Manuel Brothers is created, iDrive is asked to prepare it and Manuel Brothers is emailed. Their reply and pickup confirmation are read, and their stock updates when iDrive confirms it shipped. See [Distributor replenishment](../03-workflows/distributor-replenishment.md).
3. When an order comes in through SimplyDepo, Manuel Brothers gets the delivery details by email. See [New order notification](../03-workflows/new-order-notification.md).
4. Order figures are written onto each linked Folk company, and changes made in Folk flow back. See [Folk flow](../04-technical/folk-flow.md).

Everything else, like data refreshes and plan actuals, is in [Connected systems](./connected-systems.md).

## Processes

- [Order intake and delivery tracking](../03-workflows/order-intake-and-tracking.md)
- [New order notification](../03-workflows/new-order-notification.md)
- [Proof of delivery processing](../03-workflows/proof-of-delivery-processing.md)
- [Distributor replenishment](../03-workflows/distributor-replenishment.md)
- [New customer to Folk](../03-workflows/new-customer-to-folk.md)

## Rules and limits

Every rule that blocks a transaction, and whether you can change it yourself, is numbered in [Business rules](./business-rules.md).

Orders, customers and products are changed in the system that owns them (Shopify, BlueBox, SimplyDepo or Folk), not here. What you create in Sauerobase is the product list with its prices and costs, demand plans, Folk mappings, transfers to Manuel Brothers and system settings. There's no approval workflow, no role-based access and no alerting when something breaks. The full list is in [Limitations](./limitations.md).

## Other pages

[Purpose and scope](./purpose-and-scope.md), [Roles and access](./roles.md), [Connected systems](./connected-systems.md), [Business rules](./business-rules.md), [Calculations](./calculations.md), [Glossary](./glossary.md), [Limitations](./limitations.md)
