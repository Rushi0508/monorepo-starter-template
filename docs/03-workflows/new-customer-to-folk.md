---
order: 5
title: New Customer to Folk
description: New SimplyDepo customers are added to Folk automatically, without creating duplicates.
last_verified: 2026-10-08
---

# New customer to Folk

When a customer is created or updated in SimplyDepo, a matching company is created in Folk, the sales team's CRM, if one doesn't already exist. Sales see every new account in Folk without anyone typing it in, and an account that's already there is never added twice. This runs as a Zapier automation outside Sauerobase, and Sauerobase picks up what it creates (see [How it connects to Sauerobase](#how-it-connects-to-sauerobase)).

| Who | Their part |
| --- | --- |
| Customer or Manuel Brothers | Creates or updates the customer account in SimplyDepo |
| The Zapier automation | Spots the change, checks Folk and creates the company when it's new |
| Sales | Works the new account in Folk |

Nobody needs to start it. The automation checks SimplyDepo for new and changed customers regularly, so a new account reaches Folk shortly after it's saved, not instantly.

## BPMN flow

![New customer to Folk as a BPMN process — the Zapier automation copies a new SimplyDepo customer into Folk, and Sauero picks it up for mapping](/images/docs/bpmn/new-customer-to-folk.svg)

The diagram uses standard BPMN 2.0. Its source, [new-customer-to-folk.bpmn](/images/docs/bpmn/new-customer-to-folk.bpmn), opens in any BPMN tool, such as bpmn.io, Camunda Modeler or draw.io. The Zapier automation is the top half. Sauerobase's part, from the new company arriving to order metrics being written back to Folk, is the bottom half.

## Steps

```
Customer created or updated in SimplyDepo
     │
     ▼
Automation picks it up on its next check
     │
     ▼
Search Folk's "Customers - AZ" group
for a company with the same name
     │
     ├─► Found ──► Stop — nothing is created
     │
     └─► Not found
           │
           ▼
         Create the company in "Customers - AZ"
         (name, phone, shipping address, website, email)
           │
           ▼
         Sauero sees the new company and adds it
         to the Folk mapping page for review
```

1. The automation reads the customer's name, phone number, addresses, email and website from SimplyDepo.
2. It looks for a company with the same name in the **Customers - AZ** group only. If several match, the first one counts as found.
3. If a company was found, the automation stops. This is the step that prevents duplicates.
4. If nothing was found, a new company is created in **Customers - AZ** with these details:

| From SimplyDepo | Into Folk | Example |
| --- | --- | --- |
| Customer name | Company name | "Desert Ridge Market" |
| Business phone | Phone | "+1 520 555 0142" |
| Shipping address | Address | "1440 W Example Dr" |
| Website | Website | "example.com" |
| Business email | Email | "orders@example.com" |

The automation doesn't fill in Folk's **SD Customer ID** field. If the sales team wants it on the company, enter it in Folk by hand.

A run ends one of two ways: the company already existed and nothing changed, or a new company is in Folk's Customers - AZ group with the customer's details, waiting on Sauerobase's Folk mapping page if that group is tracked.

## How it connects to Sauerobase

Sauerobase's own Folk integration listens for new companies in the Folk groups it tracks. When this automation creates a company in **Customers - AZ** and that group is tracked on the Configuration page, Sauerobase adds it to the [Folk mapping](../02-features/folk-mapping.md) page immediately.

A brand-new SimplyDepo account often has no Shopify customer yet, so the company arrives as **Unmapped**. The next nightly Folk reconcile creates the customer in Shopify from the company's details and links it, or links the existing customer if one already has that email. How this works is in [Folk flow](../04-technical/folk-flow.md#creating-shopify-customers-from-folk).

## When the automation fails

Failures only show in the automation's own run history, not in Sauerobase.

| What fails | What happens |
| --- | --- |
| The connection to SimplyDepo | The automation pauses, and no customers are picked up until it's reconnected |
| The search in Folk | The run stops before creating anything, so no duplicate is made |
| Creating the company in Folk | The run is recorded as failed in the automation's history, and the company isn't created |

## Matching by name, and other limits

- Matching is by name only. "Desert Ridge Market" and "Desert Ridge Market LLC" are different names, so the second would be created as a new company. Keep customer names consistent between SimplyDepo and Folk.
- Only Customers - AZ is checked. A company that exists in another Folk group isn't found, and a new one is created in Customers - AZ.
- Updates don't change existing companies. An updated SimplyDepo customer only creates a company when none exists, and details already in Folk are never overwritten.
- The shipping address is used, not the billing address.
