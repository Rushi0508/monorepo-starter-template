---
order: 2
title: Shopify Webhooks
description: Registering, inspecting and retiring the Shopify webhook subscriptions that feed real-time order events into Sauerobase.
last_verified: 2026-10-02
---

# Shopify webhook registration

Registration points the Shopify store's webhooks at our EventBridge partner event source, so Shopify order, refund and fulfillment events flow into the pipeline described in [Data Ingestion](./data-ingestion-architecture.md).

One script does the whole job. It gets its own short-lived access token from the app credentials, then creates a subscription per topic, so there's no token to fetch by hand.

Subscription contract events aren't registered here. They come from a Shopify Flow that posts to `POST /api/shopify/subscription/create` and `POST /api/shopify/subscription/update` on the server (see [Data Ingestion](./data-ingestion-architecture.md#shopify-subscription-events)).

## Step 1: Check the app credentials

The scripts run under `heizen-secrets`, which injects the server's secrets for the Heizen Studio project and environment named in `apps/server/.env`. That file only holds the Heizen Studio settings (`HEIZEN_STUDIO_PROJECT_ID`, `HEIZEN_STUDIO_ENVIRONMENT_NAME`, `HEIZEN_STUDIO_API_KEY`). The Shopify values live in Heizen Studio for that environment:

| Secret | Value |
| --- | --- |
| `SHOPIFY_SHOP` | `<your-store>.myshopify.com` |
| `SHOPIFY_APP_CLIENT_ID` | The Shopify app's Client ID |
| `SHOPIFY_APP_CLIENT_SECRET` | The Shopify app's Client Secret |
| `SHOPIFY_API_VERSION` | Optional. Defaults to `2026-04` (`apps/server/src/common/env-config.ts`) |

To point a run at a different store, switch the environment in `apps/server/.env` or change the secrets in Heizen Studio. A variable already set in your shell wins over the injected secret, so unset any stray `SHOPIFY_*` variables first.

The script exchanges the client ID and secret for a short-lived token via `client_credentials` on every run, so nothing long-lived is stored.

## Step 2: Get the EventBridge ARN

In the AWS console, in the same region the event source was created in, go to **EventBridge**, then **Partner event sources**, then the Shopify source, and copy its ARN. It looks like this:

```
arn:aws:events:us-west-2::event-source/aws.partner/shopify.com/<account>/<bus-name>
```

The ARN must be the partner event source, not the event bus it's associated with. Shopify writes to the source; the bus is the other side of the join.

## Step 3: Paste the ARN into the script

It's a constant at the top of `apps/server/src/shopify/scripts/register-shopify-subscriptions.ts`:

```ts
const EVENTBRIDGE_ARN =
  'arn:aws:events:us-west-2::event-source/aws.partner/shopify.com/376643420161/sauero-shopify-bus';
```

Replace it when pointing at a different store or region. The committed value is the production source, so a staging run has to change it, and change it back.

## Step 4: Run the script

```bash
# from apps/server
pnpm shopify:register-subscriptions

# or from the monorepo root
pnpm --filter server shopify:register-subscriptions
```

Every topic in `apps/server/src/shopify/shopify-webhook-topics.ts` is registered in one pass:

| Topic | Topic |
| --- | --- |
| `orders/create` | `orders/paid` |
| `orders/updated` | `refunds/create` |
| `orders/cancelled` | `fulfillments/create` |
| `orders/fulfilled` | `fulfillments/update` |

Check the console output, where each topic prints its result. An empty `userErrors` means the subscription was created.

The script doesn't stop on a `userErrors` entry. It prints it and moves to the next topic, so adding a topic and re-running reports the existing ones as errors. Only a transport or GraphQL-level failure stops the run.

Adding a topic also needs a handler: the consumer only accepts the topics in `shopify-webhook-topics.ts` and leaves anything else on the queue for the dead letter queue.

## Inspecting what's registered

```bash
pnpm --filter server shopify:get-subscriptions
```

## Retiring an old event source

Registering only ever adds. Point the script at a new ARN and the previous subscriptions stay where they are, so every event is delivered to both sources until the old ones are removed.

Set the fragment to match at the top of `apps/server/src/shopify/scripts/delete-shopify-subscriptions.ts`:

```ts
const MATCH = 'ap-south-1';
```

Every subscription whose URI contains it is deleted, so check the list first with `shopify:get-subscriptions` and keep the value narrow enough to hit only the source being retired.

```bash
pnpm --filter server shopify:delete-subscriptions
```

Register the new source before deleting the old one, and confirm the new pipeline is consuming. Between the delete and a working consumer, events are dropped and Shopify doesn't replay them, though the next scheduled full order pull still picks up changed orders.
