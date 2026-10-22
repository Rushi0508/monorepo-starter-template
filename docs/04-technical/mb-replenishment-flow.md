---
order: 4
title: MB Replenishment Flow
description: How a Manuel Brothers replenishment moves through BlueBox, Gmail and Shopify behind the scenes.
last_verified: 2026-10-08
---

# Manuel Brothers replenishment flow

This flow creates a BlueBox pickup order for Manuel Brothers, emails them, records their acknowledgement and the Bill of Lading, then adds the quantities to the Manuel Brothers location in Shopify once BlueBox shows the order shipped or delivered. The business view of the same process, including the pickup date table, email contents and failure cases, is [Distributor replenishment](../03-workflows/distributor-replenishment.md).

## Flow

```
Create replenishment order (SKUs, quantities, "send pickup email" flag)
     │
     ├─► Next number generated (MB-0001 …)
     │
     ├─► BlueBox order created, number as customerOrderNumber
     │     rejected ──► error, nothing saved
     │
     ├─► Order saved locally
     │
     └─► If the flag is on and a Primary distributor email is set:
           email sent from the connected Gmail inbox
             • BlueBox packing slip PDF (when it can be fetched)
             • product name + code + quantity
             • pickup date (Monday morning)
             • pickup address
             • MB-#### reference
           sent time + Gmail thread saved on the order
     │
     ▼
Reply on the same Gmail thread
  → LLM decides whether it is an acknowledgement
  → first acknowledgement saved
     │
     ▼
Bill of Lading email ("pickup" in subject + attachment)
  → stored as a PICKUP inbound email
  → OCR reads the MB-#### numbers
  → each sent-and-acknowledged order marked picked up
     │
     ▼
Scheduled check of open orders against the local BlueBox order copy
  ├─► Shipped / Delivered ──► add quantities in Shopify, close (Synced)
  │                            └─ error ──► reason in dataFlowError, stays open (Pending + red icon)
  └─► isCanceled ──► close, no stock change (Skipped)
```

## Pickup date

Calculated from the creation date in America/Phoenix, never stored, and recalculated on display. The rule is in [Rule 29](../01-business/business-rules.md), and the pickup address is fixed in the email.

## Completion and the Shopify write

- An order is complete when the local BlueBox order has `workflowStatus` Shipped or Delivered, or `deliveryStatus` delivered. It's cancelled when its `isCanceled` flag is set.
- The check reads the BlueBox order copy synced into Sauerobase, not BlueBox itself, so completion waits for the BlueBox order refresh to bring the new status in. That refresh asks BlueBox for orders created since its last successful run (`minCreatedDate`), so a later status change is only seen when BlueBox returns that order again.
- The Shopify write runs a full Shopify inventory sync, finds each SKU's inventory item stocked at the Shopify location whose name contains "manuel" (matched through the SKU catalog, so renamed SKUs still match), then adds every quantity in one `inventoryAdjustQuantities` call (delta, `available`, reason `received`). It's all or nothing, so a retry never adds anything twice.
- With no "manuel" location, a SKU not stocked there, or `userErrors` from Shopify, the order stays open and the error message is saved on `ReplenishmentOrder.dataFlowError`. The table shows a red info icon next to **Pending** with the message on hover. It's cleared when the order closes.
- The check isn't a Data Pipeline Health pipeline, so failures show only on the order row and in the server logs.

## Email and acknowledgement mechanics

- An email send failure doesn't block order creation, and there's no resend.
- Acknowledgement is decided by the reply's content, not by any reply arriving. A reply whose classification call fails is dropped, not retried (see [Gmail flow](./gmail-flow.md)).
- Pickup confirmation needs a PDF, image or Word attachment; an email without one isn't treated as a pickup email.
- A pickup email with an unknown MB-####, an order not yet acknowledged or no readable number is marked failed and can be processed again from the Inbound Emails page. Any orders on it that were ready are still confirmed ([Rule 62](../01-business/business-rules.md)).
- Shares the Gmail inbox pipeline with POD processing (see [Gmail flow](./gmail-flow.md)).
