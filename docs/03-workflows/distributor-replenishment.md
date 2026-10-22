---
order: 4
title: Distributor Replenishment
description: One transfer moves stock from the BlueBox warehouse to Manuel Brothers, from the warehouse order to the stock update in Shopify.
last_verified: 2026-10-08
---

# Distributor replenishment

A transfer moves stock from iDrive's BlueBox warehouse to Manuel Brothers. One action places the warehouse order, emails Manuel Brothers and sets up everything needed to track it. From there the process runs on its own: it records Manuel Brothers' acknowledgement, confirms the pickup from their Bill of Lading, and adds the stock to the Manuel Brothers location in Shopify once BlueBox reports the order shipped.

| Who | Their part |
| --- | --- |
| Operations | Chooses the products and quantities and creates the transfer on the [Inventory](../02-features/stock-visibility.md) screen (Manuel Brothers) |
| iDrive (BlueBox) | Prepares the pallet, hands it over and marks the order shipped |
| Manuel Brothers | Gets the pickup request, replies to confirm, collects the pallet and emails the Bill of Lading |
| Sauerobase | Places the warehouse order, sends the email, reads the replies and the Bill of Lading, checks the BlueBox status and updates Shopify stock |

It starts when someone clicks **Add Order** in the replenishment section and chooses products and quantities, with **Send pickup email to Manuel Brothers** ticked (it's ticked by default).

## BPMN flow

![Distributor replenishment as a BPMN process — Sauero (Operations and Sauerobase), BlueBox, Manuel Brothers and Shopify, with the email track and the warehouse track running in parallel](/images/docs/bpmn/distributor-replenishment.svg)

The diagram uses standard BPMN 2.0. Its source, [distributor-replenishment.bpmn](/images/docs/bpmn/distributor-replenishment.bpmn), opens in any BPMN tool, such as bpmn.io, Camunda Modeler or draw.io. Once the transfer is saved, two tracks run side by side: the email track (pickup request, acknowledgement, Bill of Lading) and the warehouse track (a scheduled status check until BlueBox shows the order shipped, delivered or cancelled).

## Steps

```
Operator creates the transfer
     │
     ▼
Transfer number generated (MB-0001, MB-0002 …)
     │
     ▼
Pickup order placed in BlueBox ── rejected ──► error, nothing saved
     │ accepted
     ▼
Transfer saved, pickup date worked out
     │
     ▼
Pickup request emailed to Manuel Brothers
  (unless the checkbox was cleared)
     │
     ▼
Manuel Brothers replies ──► "Email ack" if it confirms
     │
     ▼
Manuel Brothers emails the Bill of Lading ──► "Picked up"
     │
     ▼
BlueBox marks the order shipped or delivered
     │
     ▼
Quantities added to the Manuel Brothers
location in Shopify ──► "Synced"
```

1. You create the transfer with products and quantities only: at least one product, each with a quantity of one or more ([Rule 27](../01-business/business-rules.md)). The screen only offers products from the master list (SKU settings), but nothing behind it re-checks the product code ([Rule 28](../01-business/business-rules.md)).
2. The next number in sequence is generated: MB-0001, MB-0002 and so on. It's sent to BlueBox as the order's reference, and it's how the warehouse order, the emails and the Bill of Lading are matched back to the transfer.
3. The warehouse order is placed first. It goes to BlueBox as a pickup-only order marked "DO NOT SHIP / PICK UP ONLY", with every line noted "Whole order on single pallet". If BlueBox rejects it, nothing is saved and you see an error ([Rule 26](../01-business/business-rules.md)). The number is only kept once BlueBox accepts the order, so there's never a transfer here that iDrive doesn't know about.
4. The pickup date is always a Monday morning, based on the day the transfer was created in Arizona (Phoenix) time ([Rule 29](../01-business/business-rules.md)). It follows iDrive's cycle: orders in by Thursday, prepared Friday, ready Monday. The date isn't stored. It's recalculated from the creation date every time it's shown.

| Created on | Ready for pickup |
| --- | --- |
| Monday to Thursday | The next Monday (a transfer created on a Monday is ready the following Monday) |
| Friday, Saturday or Sunday | The Monday after next |

5. Unless **Send pickup email to Manuel Brothers** was cleared, an email goes from the connected Gmail inbox to the Primary address in **Configuration**, under Distributor email (Manuel Brothers), copying every CC address. The subject is **Pickup request for {pickup date}**. The email lists each product's name, code and quantity, the Monday pickup date, the pickup address (iDrive Fulfillment, 12795 W. Northern Avenue, Building 2, Glendale, AZ 85307) and the transfer number as the reference, and asks Manuel Brothers to reply to acknowledge. BlueBox's packing slip is attached when it can be fetched, and the email goes without it if not. Product names come from the master list, and a code not found there appears on its own ([Rule 20](../01-business/business-rules.md)). Two failures give no warning. With no Primary address set, no email is sent and no error shows ([Rule 30](../01-business/business-rules.md)). If sending fails, the transfer still exists but Manuel Brothers is never told ([Rule 31](../01-business/business-rules.md)).
6. Replies on the same Gmail conversation are read automatically to decide whether they confirm the order or are a question, a correction request or an out-of-office message. Only a confirmation is recorded, as **Email ack** ([Rule 32](../01-business/business-rules.md)), and only the first one counts ([Rule 33](../01-business/business-rules.md)).
7. After collecting the pallet, Manuel Brothers emails the Bill of Lading. An email counts as a pickup email when its subject contains "pickup" (or "pick up" or "pick-up") and it has a PDF, image or Word attachment. It shows on the Pickup tab of [Inbound Emails](../02-features/inbound-emails.md), and the attachment is read for every MB-#### number on it ([Rule 62](../01-business/business-rules.md)):
	- A transfer is marked **Picked up**, dated when the email arrived and linked to it, only if its pickup request was sent and acknowledged. Pickup requests themselves (Sauero's own, or ones the team sends with the inbox copied) also say "pickup" and carry the MB-#### number, and this condition stops them counting as confirmations.
	- A transfer already marked Picked up is left as it is.
	- If any number on the document has no transfer, belongs to a transfer not yet sent and acknowledged, or no number could be read, the pickup email is marked **Failed**. Any other transfers on the same document that were ready are still marked Picked up.
	- So Sauero's own pickup request can show on the Pickup tab as Failed. That's expected, so leave it or mark it as processed.
	- Don't process that request again after the transfer is acknowledged, or it'll be read as a pickup confirmation. A Bill of Lading that failed because it arrived before the acknowledgement can be processed again once the transfer shows Email ack.
8. On a schedule, every open transfer is compared with Sauerobase's copy of the matching BlueBox order. That copy is only as current as the last BlueBox order refresh, so a status change in BlueBox only shows up here after that refresh. Refresh timings are on [Data Pipeline Health](../02-features/information-currency.md).
9. A transfer completes when BlueBox shows the order as **Shipped** or **Delivered** (or its delivery status as delivered). Sauerobase adds the transfer quantities to the Manuel Brothers location's available stock in Shopify, all products in one update, and the transfer closes as **Synced** ([Rule 34](../01-business/business-rules.md)). If any product isn't stocked at that location in Shopify, or Shopify refuses the update, nothing is added and the transfer stays **Pending**, with a red info icon next to it showing the reason ([Rule 36](../01-business/business-rules.md)).
10. If BlueBox shows the order as cancelled, the transfer closes as **Skipped** and nothing moves.

All transfer rules are [Rules 26 to 36 and 62](../01-business/business-rules.md#manuel-brothers-transfers).

## When a transfer closes or stalls

A transfer closes when BlueBox shows it shipped, delivered or cancelled. Closed means Sauerobase has finished with it. It doesn't mean the stock arrived, since a cancelled transfer closes too.

- A transfer BlueBox never moves stays open and is re-checked on every run, forever. Nothing escalates and nobody is told.
- A transfer that was never notified looks normal apart from a blank **Email Sent**, and there's no resend, so check it after creating one.
- Acknowledgement and pickup aren't needed to complete. A transfer can ship and close without Manuel Brothers ever replying or sending a Bill of Lading ([Rule 35](../01-business/business-rules.md)).
- If the Shopify location is missing, every transfer fails at the stock update and stays open. Sauerobase looks for a Shopify location whose name contains "manuel", and if there isn't one, nothing is added and nothing closes until there is.
- A transfer with a red info icon next to **Pending** reached BlueBox shipped or delivered but couldn't be added to Shopify. It stays open and is tried again on every check. Hover the icon to see why. Usually a product isn't stocked at the Manuel Brothers location in Shopify; add it there and the next check closes the transfer as Synced. Nothing is added to Shopify until every product can be.
- Nothing here can be cancelled or amended in Sauerobase, and Email Ack and Picked Up can't be set or cleared by hand. Fix a mistake in BlueBox, where cancelling the order closes the transfer as Skipped.

## Transfer states and columns

A transfer runs on two tracks that don't wait for each other: the email track with Manuel Brothers and the warehouse track that moves the stock ([Rule 35](../01-business/business-rules.md)). A transfer created with the pickup email switched off never reaches Acknowledged or Picked up.

```
Email track:      Created ──► Email sent ──► Acknowledged ──► Picked up
                     │
Warehouse track:     └──► Pending ──► Synced   (warehouse reports shipped or delivered)
                                  └─► Skipped  (warehouse reports cancelled)
```

Each transfer on the Manuel Brothers screen shows:

| Column | What it shows |
| --- | --- |
| Order # | The MB-#### transfer number |
| Items | Products and quantities |
| Data Flow Status | **Pending** (waiting for BlueBox; a red info icon means Shopify couldn't be updated, hover for the reason), **Synced** (Shopify stock updated) or **Skipped** (cancelled in BlueBox, no stock change) |
| Blue Box Status | The BlueBox order's current status, linking to it in BlueBox. Blank until a BlueBox refresh has brought the order in |
| Email Sent | When the pickup request went, linking to the Gmail conversation |
| Email Ack | When Manuel Brothers acknowledged it |
| Picked Up | When the Bill of Lading arrived, linking to the pickup email |
| Pickup Date | The Monday the pallet is ready |
| Created | When the transfer was created |

![Distributor stock and replenishment orders, showing warehouse status, email sent, acknowledgement and pickup](/images/docs/distributor-replenishment.jpg)
