---
order: 2
title: Purpose and Scope
description: The problem Sauerobase solves, who it is for, and where its boundaries are.
last_verified: 2026-10-02
---

# Purpose and scope

Sauero sells through several channels, stores and ships stock through iDrive, supplies stores through Manuel Brothers, takes wholesale orders on SimplyDepo, tracks sales relationships in Folk and books its numbers in QuickBooks. Before Sauerobase, those systems only met in spreadsheets. Someone had to export from each one and reconcile by hand, and hand-offs like telling Manuel Brothers about an order or recording a delivery were manual too.

Sauerobase copies the data from each system into one place, keeps it current and shows it as one view. It also takes over the hand-offs that used to be manual and error-prone, and adds demand planning built on the same numbers.

## Teams and what they use it for

| Group | What they use it for |
| --- | --- |
| Operations | Daily order and delivery visibility, stock levels, sending stock to Manuel Brothers, delivery paperwork |
| Commercial | Revenue, margin, customer value, reorder behavior |
| Planning | Demand plans, scenarios and forecast accuracy |
| Product and supply | The product list, prices and costs, batch and expiry visibility, production records |
| Sales | Ordering figures for each account, written into Folk |
| Anyone checking a number | Whether the figures on screen are current, and what has failed |

The system doesn't separate these groups. See [Roles and access](./roles.md).

## Hand-offs it took over and figures it adds

- Delivery paperwork that used to be re-typed into SimplyDepo is read and recorded automatically. New orders reach Manuel Brothers without anyone forwarding them, and nobody has to chase stock transfers.
- Revenue, delivery performance, stock and plan actuals all come from the same underlying data, not from separate exports.
- Margin combines what was sold with what each product costs to make and to fulfill, using iDrive's actual shipping charge where it reports one. Neither Shopify nor QuickBooks produces that contribution figure on its own.
- Demand plans start from what each channel ordered, and every finalized plan is later scored against what happened.
- Ordering figures show on each company in Folk, so sales can see who's due a call without leaving the CRM.

## Where the boundaries are

| System | Its role | Sauerobase reads | Sauerobase writes or sends |
| --- | --- | --- | --- |
| Shopify | Online store and source of truth for orders and stock | Orders (including SimplyDepo orders), refunds, fulfillments, customers, products, stock, subscriptions, website traffic | Manuel Brothers stock levels, once a transfer is delivered |
| SimplyDepo | Ordering portal for retail stores, connected through Zapier | The product catalog, order details and order PDFs | Completed deliveries, from proof of delivery |
| BlueBox (iDrive, the 3PL) | Warehouse that stores and ships stock | Stock and batches, inbound shipments, outbound shipments and tracking, order status, kitting orders | Pickup orders for stock going to Manuel Brothers |
| Manuel Brothers | Distributor that collects stock and delivers to stores | By email: replies to pickup requests, pickup confirmations, proof of delivery | By email: pickup requests and new-order details |
| Folk | The sales team's CRM | Companies in the tracked groups, their status, account type and last contact | Ordering figures on each linked company |
| Shared Gmail inbox | Email channel | Incoming email | Outgoing email |
| QuickBooks | Accounting, connection paused | Journal entries, bills, invoices and payments when the connection is on; nothing displays them | Nothing |
| Document reading (AI) | Reads scanned paperwork | Proof-of-delivery and pickup documents, Manuel Brothers replies | Nothing |

Two links between these systems aren't part of Sauerobase. SimplyDepo and Shopify exchange orders and stock levels directly, and a Zapier automation adds new SimplyDepo customers to Folk (see [New customer to Folk](../03-workflows/new-customer-to-folk.md)).

Anything Sauerobase doesn't write back is one-way. You can't edit an order, customer or product here; those changes are made in the system that owns them.

## What the seven channels are

Most reporting splits by channel. Four channels are assigned automatically from order data. The other three can be planned and priced, but no order is assigned to them yet, so they report zero.

| Channel | What it means | Assigned automatically | Counts as |
| --- | --- | --- | --- |
| DTC | Direct-to-consumer orders through Shopify | Yes | Consumer |
| DTC-POS | Orders taken at point of sale | Yes | Consumer |
| WS-ECOM | Wholesale orders placed through Shopify, identified by a wholesale tag | Yes | Wholesale |
| WS-DSD | Direct-store-delivery orders placed through SimplyDepo | Yes | Wholesale |
| AMAZON | Marketplace orders | No | Consumer |
| WS-CHAINS | Wholesale orders to retail chains | No | Wholesale |
| ALTERNATIVE | Alternative outlets, including food service | No | Wholesale |

How an order gets its channel is [Rule 1](./business-rules.md). The channel also decides which delivery target an order is measured against and which fulfillment cost applies.

## How current the figures are

Nothing on screen is live. Some data is copied in the moment it changes in the other system, the rest on a schedule, and each feed runs at its own rate. Orders appear almost immediately, while delivery and stock figures can be several hours old. If a figure looks wrong, check when it last refreshed on [Data Pipeline Health](../02-features/information-currency.md).

## Time zone

Business reporting runs on Mountain time: "September" or "last month" means Mountain-time days, and plans are dated by the Mountain-time month. Date filters on screen follow your own time zone, so someone elsewhere can see small differences at the start and end of a range.
