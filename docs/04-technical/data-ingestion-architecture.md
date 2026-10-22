---
order: 1
title: Data Ingestion
description: How data from Shopify, BlueBox, SimplyDepo, Gmail, Folk and QuickBooks reaches Sauerobase, real-time and scheduled.
last_verified: 2026-10-02
---

# Data ingestion architecture

Data reaches Sauerobase two ways: real-time events pushed by the outside system, and scheduled pulls where Sauerobase asks the outside system what changed. Every pipeline, with its schedule and last result, is listed on [Data Pipeline Health](../02-features/information-currency.md).

| Source | How it arrives | Pipelines |
| --- | --- | --- |
| Shopify orders, refunds, fulfillments | Real-time webhooks to EventBridge, then SQS, then a consumer | `shopify-orders-realtime`, `shopify-refunds-realtime`, `shopify-fulfillments-realtime` |
| Shopify subscription contracts | Real-time HTTP calls from a Shopify Flow to the server | `shopify-subscriptions-realtime` |
| Shopify orders (full), products, customers, inventory, analytics | Scheduled pulls | `shopify-orders`, `shopify-products`, `shopify-customers`, `shopify-inventory`, `shopify-analytics` |
| Gmail inbox | Scheduled history poll to SQS, then a consumer | `gmail-inbox` |
| Folk companies | Real-time webhooks directly to the server | `folk-webhooks-realtime` |
| Folk metrics and reconcile | Scheduled | `folk-metrics-push`, `folk-nightly-reconcile` |
| BlueBox (iDrive) | Scheduled pulls only. BlueBox pushes nothing | `bluebox-orders`, `bluebox-shipments`, `bluebox-inventory`, `bluebox-asns`, `bluebox-kit-orders` |
| SimplyDepo | Scheduled pull through Zapier, plus per-order lookups on demand | `simplydepo-products` |
| QuickBooks Online | Scheduled pull, paused for now | `qbo-sync` |
| Demand actuals | Calculated inside Sauerobase from the synced orders, on a schedule | `demand-actuals` |

Related flows: [Gmail inbox](./gmail-flow.md), [Manuel Brothers replenishment](./mb-replenishment-flow.md), [Folk](./folk-flow.md).

## Shopify real-time events

```
Shopify store
     │  webhook subscription (orders, refunds, fulfillments)
     ▼
EventBridge partner event source
     │
     ▼
EventBridge event bus
     │
     ▼
SQS queue
     │  long-poll consumer in the server
     ▼
Handler by topic ──► database
  (refund / fulfillment for an unknown order → fetch that order from Shopify first)

  Message not deleted on failure → SQS redelivers → dead letter queue
```

- Topics: `orders/create`, `orders/updated`, `orders/cancelled`, `orders/fulfilled`, `orders/paid`, `refunds/create`, `fulfillments/create`, `fulfillments/update`.
- The order webhook doesn't carry the channel, the display name or the bundle breakdown. The scheduled `shopify-orders` pull fills those in.
- A message with an unknown topic or no payload is left on the queue to reach the dead letter queue.
- The consumer doesn't run in development.

Registering the webhooks: [Shopify webhooks](./shopify-webhook-registration.md).

## Shopify subscription events

A Shopify Flow posts subscription contract changes directly to the server:

- `POST /api/shopify/subscription/create`
- `POST /api/shopify/subscription/update`

These don't go through EventBridge or SQS, and they aren't retried. If a previous subscription event is still being handled, or the pipeline is paused on Data Pipeline Health, the new event isn't processed.

## Gmail inbox

```
Scheduled inbox check ──► Gmail history since the stored cursor
     │
     ▼
New message ids ──► SQS queue ──► consumer ──► routed to
  replenishment acknowledgement / pickup email / POD email
```

There's no Gmail push subscription; new mail is found by polling. See [Gmail flow](./gmail-flow.md).

## Folk webhooks

```
Folk ──► POST /api/folk/webhooks ──► signature check ──► 200 returned
                                                            │
                                                            ▼
                                               processed in the background
```

Folk events go directly to the server, not through a queue. The webhook is acknowledged before it's processed, so a processing failure isn't retried and only shows on Data Pipeline Health. See [Folk flow](./folk-flow.md).

## Scheduled pulls

Each scheduled pipeline records the time of its last successful run and asks the source for what changed since then, so the next run covers a failed one. A pipeline that's already running, or paused, is skipped. Pulls can also be started by hand from Data Pipeline Health.

- The Shopify full order pull re-reads every order updated since the last success and replaces its lines, refunds and fulfillments with what Shopify reports. It also triggers the [new order notification](../03-workflows/new-order-notification.md).
- BlueBox pulls request records created since the last success (`minCreatedDate`).
- SimplyDepo is reached through Zapier, which Sauerobase calls for the product catalog, order lookups, order PDFs and fulfillments. New SimplyDepo customers reach Folk through a separate Zapier automation outside Sauerobase (see [New customer to Folk](../03-workflows/new-customer-to-folk.md)).
- QuickBooks is paused with the **Pause/Resume** control on Data Pipeline Health.

## Queue behavior

- Consumers long-poll up to ten messages at a time, and a message is only deleted after it's handled successfully.
- A failed message is delivered again by SQS, then moves to the dead letter queue for investigation.
