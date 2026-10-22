---
order: 9
title: Glossary
description: Where each Sauerobase term is defined, plus the few terms no other page covers.
last_verified: 2026-10-02
---

# Glossary

Most terms are defined on the page that owns them, so this page points there. The few terms no other page defines are spelled out at the bottom.

## Where each term is defined

| Term | Defined in |
| --- | --- |
| Acknowledgement | [Rule 32](./business-rules.md#manuel-brothers-transfers) |
| Base plan, demand plan, scenario, finalize, horizon | [Demand planning](../02-features/demand-planning.md#planning-cycle-and-workspace) |
| Bias, lag, forecast accuracy | [Demand planning](../02-features/demand-planning.md#forecast-accuracy) |
| Bill of Lading (pickup confirmation), pickup request, pickup date, transfer | [Distributor replenishment](../03-workflows/distributor-replenishment.md) |
| Bundle | [Rule 6](./business-rules.md#order-channels-and-revenue-reporting) |
| Channels (DTC, DTC-POS, AMAZON, WS-ECOM, WS-DSD, WS-CHAINS, ALTERNATIVE) | [Purpose and scope](./purpose-and-scope.md#what-the-seven-channels-are) |
| Data Pipeline Health, paused feed | [Data Pipeline Health](../02-features/information-currency.md) |
| Delivery request | [New order notification](../03-workflows/new-order-notification.md) |
| Folk mapping, tracked group | [Folk mapping](../02-features/folk-mapping.md) |
| Gross and net revenue, gross and contribution profit and margin, cost of goods, fulfillment cost | [Calculations](./calculations.md) |
| iDrive, BlueBox, Manuel Brothers, SimplyDepo, Shopify, Folk, QuickBooks | [Purpose and scope](./purpose-and-scope.md#where-the-boundaries-are) |
| In production | [Inventory](../02-features/stock-visibility.md#what-in-production-counts) |
| Inbound shipment (ASN) | [Inventory](../02-features/stock-visibility.md#inbound-shipments-asns) |
| Lead time, transit time, on-time | [Fulfillment](../02-features/delivery-performance.md) |
| Mountain time, time zones | [Purpose and scope](./purpose-and-scope.md#time-zone) |
| Override, statistical forecast, Start next cycle | [Demand planning](../02-features/demand-planning.md#planning-cycle-and-workspace) |
| POD (proof of delivery) | [Proof of delivery](../03-workflows/proof-of-delivery-processing.md) |
| Product master list, SKU alias (old code) | [SKU settings](../02-features/product-master-data.md) |
| Reorder rate, retail velocity, store count | [Customers](../02-features/customer-insight.md) |
| Statuses: order payment and fulfillment, BlueBox order | [Orders](../02-features/order-visibility.md#payment-fulfillment-and-bluebox-statuses) |
| Statuses: inbound shipment (Imported to Completed) | [Inventory](../02-features/stock-visibility.md#inbound-shipments-asns) |
| Statuses: inbound email (Pending, Processing, Processed, Failed) | [Inbound emails](../02-features/inbound-emails.md#email-statuses) |
| Statuses: transfer (Email Sent, Email Ack, Picked Up, Pending, Synced, Skipped) | [Distributor replenishment](../03-workflows/distributor-replenishment.md#transfer-states-and-columns) |
| Statuses: demand plan (Draft, Finalized, Saved) | [Demand planning](../02-features/demand-planning.md#planning-cycle-and-workspace) |
| Statuses: Folk mapping (Pending review, Mapped, Unmapped) | [Folk mapping](../02-features/folk-mapping.md#mapping-statuses) |
| Statuses: data feeds (Running, Success, Failed, Paused) | [Data Pipeline Health](../02-features/information-currency.md#feed-states) |

## Terms no other page defines

| Term | Meaning |
| --- | --- |
| Batch, lot | A production run's output, tracked with its own number and expiry date |
| Case | The usual selling unit. Stock is quoted per case. Prices and costs are entered per unit of the product as it's sold, which for most products is a case |
| Delivered | Has three meanings: (1) in delivery performance, iDrive recorded a delivery date; (2) in the transfer check, BlueBox reported the transfer shipped or delivered; (3) on the dashboard, Shopify's fulfillment status is Fulfilled, which means shipped, not necessarily arrived |
| Kitting order | An order to iDrive to assemble finished products, like multi-packs, from stock it already holds. Open kitting orders count toward In production |
| Landed cost | Cost of goods plus a channel's fulfillment cost |
