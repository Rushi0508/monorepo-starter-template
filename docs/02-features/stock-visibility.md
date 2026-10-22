---
order: 4
title: Inventory
description: Stock and its value at BlueBox and Manuel Brothers, plus production runs, inbound shipments and kitting.
last_verified: 2026-10-02
---

# Inventory

Inventory shows the stock Sauero has at BlueBox and Manuel Brothers, what it's worth at cost and what's on the way. Operations and supply use it to plan production, refill Manuel Brothers and catch stock that's close to expiry.

| Screen | Shows |
| --- | --- |
| Inventory | All stock in one table, valued at cost, by product or by location |
| Bluebox | iDrive's stock per product with batches and expiry, plus production runs, inbound shipments and kitting orders |
| Manuel Brothers | Manuel Brothers' stock and the replenishment orders that refill it |

The figures are only as current as the iDrive and Shopify stock feeds, which run on a schedule. Check [Data Pipeline Health](./information-currency.md) before you decide anything on them. Stock reported under an old product code shows under the product's current code.

## Inventory screen: all stock and its value

One table covers BlueBox and Manuel Brothers, with On Hand, Available, Committed, Inventory Value and % of Value, plus a total row. Rows are sorted by value, highest first. Switch to **SKU** for one row per product, expanding into its two locations, or **Location** for one row per location, expanding into its products.

Inventory Value is units on hand times the product's cost of goods in force today, from [SKU Settings](./product-master-data.md) ([Rule 8](../01-business/business-rules.md)). A product with no cost of goods shows a dash and is left out of the total. The column always uses today's cost, so it can't tell you what stock was worth on an earlier date.

![Inventory by product, expanded to show the warehouse and distributor split, with stock value](/images/docs/inventory-by-sku.jpg)

## Bluebox screen: stock, batches and expiry

One row per product:

| Column | Meaning |
| --- | --- |
| In production | Units on their way in. See [what In production counts](#what-in-production-counts) |
| On hand | Physical stock, summed across all of iDrive's warehouse locations |
| Committed | Reserved for open orders that haven't shipped |
| Available | On hand and free to sell |
| Backordered | Ordered by customers but not in stock |
| Quarantined | Held aside and not for sale, like quality holds, inspections and returns |

Everything except In production comes from iDrive. Expand a product to see its batches and what makes up its In production figure. Each batch has its lot number, location, quantity, expiry date and days left, in amber within 180 days and red within 90. Days left is worked out every time the screen opens.

This screen shows every product iDrive reports, whether or not it's in the master list. Each section has an **Open in BlueBox** link.

![Warehouse stock per product: in production, on hand, committed, available, backordered and quarantined](/images/docs/warehouse-stock.jpg)

### Production runs

Record a run with the product, production date, lot number and quantity. Runs are numbered automatically (PR-000001, PR-000002 and so on). From a run's menu you can mark it complete, reopen it or delete it. You can't edit a recorded run, so delete it and enter it again. Runs carry no cost, since product cost lives in SKU Settings.

### Inbound shipments (ASNs)

Each shipment on its way to iDrive shows its PO number, product and status. It also has the quantities sent, received and damaged, and the expected and actual arrival dates. Open one for the carrier, tracking, notes and every carton line, with its lot and quantities sent, received, damaged and shelved. A supplier shortfall shows up here. Shipment statuses are iDrive's own:

```
Imported → Receiving → Received → Unpacking → Completed
                                            → Not completed
```

### Kitting orders

Each kit being built at iDrive shows ordered and built quantities, progress, status (open, completed or cancelled) and dates. Open one for the workflow step, billable cost and finished kits. It also lists the components with their required, reserved and consumed quantities and lots.

## Manuel Brothers screen: stock and transfers

The stock table shows the Manuel Brothers location as Shopify holds it: On Hand, Available, Committed, Incoming and Damaged. Only products in [SKU Settings](./product-master-data.md) appear, here and on the Manuel Brothers side of the overview ([Rule 20](../01-business/business-rules.md)). If Manuel Brothers stock looks missing, check the master list first.

Below the stock table you create replenishment orders, the transfers from BlueBox to Manuel Brothers. You follow each one through email, acknowledgement, pickup and delivery. The full process is in [Distributor replenishment](../03-workflows/distributor-replenishment.md).

## What In production counts

In production adds up three things per product:

1. Production runs that haven't reached iDrive yet
2. Open inbound shipments, the quantity sent but not yet received
3. Open kitting orders, the kits ordered but not yet built

A production run stops counting, unit for unit, once an inbound shipment with the same product and lot number picks it up. From then on the shipment carries those units.

A run stops counting entirely once it's marked complete. It also stops once every inbound shipment carrying its product and lot is complete, and anything not shipped by then is treated as short-shipped. A run that never shows up on an inbound shipment keeps counting until someone marks it complete.

Use the same lot number on the run as the supplier puts on the shipment. If they don't match, the run and the shipment both get counted.

A brand-new product with no stock yet still gets a row if it's in production.

## No stock adjustments, alerts, history or reconciliation

- Stock can't be corrected here. Quantities come from iDrive and Shopify.
- There are no reorder points, low-stock warnings or expiry alerts. Expiry is shown, but nothing watches it.
- There's no stock movement history, only the current position.
- Nothing compares the two locations. BlueBox figures come from iDrive and Manuel Brothers figures from Shopify, and each is the authority for its own location.
