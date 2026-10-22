---
order: 5
title: Folk Flow
description: How Folk companies are linked to Sauerobase customers, how unmatched companies become Shopify customers, what Sauerobase writes back to Folk, and what it reads from Folk.
last_verified: 2026-10-08
---

# Folk CRM flow

Folk is the sales team's CRM. Sauerobase links each Folk company to one or more Sauerobase customers, then writes those customers' ordering figures back onto the Folk company card, so sales can see who's due a call without leaving Folk. A Folk company with no matching customer gets one: Sauerobase creates it in Shopify from the company's details and links it. Folk stays the authority for the relationship itself (status, account type, contact history), and Sauerobase only reads those. The screen is described on [Folk mapping](../02-features/folk-mapping.md).

## Flow

```
Configuration → Folk groups
  (choose which Folk groups Sauero tracks)
     │
     ▼
Seed: pull every company in the tracked groups
  • new company → propose a matching Sauero customer
  • unmapped / pending company → proposal re-checked
  • company no longer in a tracked group → removed
     │
     ├─► Pending review ──► Folk mapping page: a person
     │                       confirms or denies the proposal,
     │                       or picks a customer by hand
     │
     └─► Unmapped ──► nightly reconcile creates the customer
                       in Shopify and links it
     │
     ▼
Mapped companies
  ├─► Sauero → Folk: order metrics written to the company card (scheduled push)
  └─► Folk → Sauero: Status, Account Type, Last Contact
                      shown on the customer's page
     │
     ▼
Folk webhooks keep it current in between
  (company created, edited, deleted, or moved between groups)
```

## Setup

- API key and webhook secret: `FOLK_API_KEY` and `FOLK_WEBHOOK_SECRET` on the server. Without the key, every Folk action fails with "Folk is not configured". Without the secret, every incoming Folk webhook is refused. The secret is read at startup, so restart the server after changing it, before testing.
- Tracked groups are chosen on the Configuration page from the workspace's groups. Companies outside them are ignored. Removing a group deletes its mappings; linked customers are unlinked, not deleted, and nothing changes in Folk.
- **Field preflight** is the button on the Folk mapping page. For each tracked group it creates any missing Sauerobase field, reports fields whose type in Folk doesn't match what Sauerobase expects, and lists Folk fields Sauerobase reads that are missing. Run it once after adding a group.

## Mapping statuses

| Status | Meaning | Actions |
| --- | --- | --- |
| Unmapped | No customer linked and nothing proposed | Pick a customer |
| Pending review | Sauerobase proposed a likely customer, with a match percentage. Counted in the sidebar badge | Confirm, Deny, pick a customer |
| Mapped | At least one customer is linked | Add another customer, unlink one, UnMap |

- One Folk company can map to many customers, because a chain with several store accounts is one company in Folk.
- **Confirm** links the proposed customer.
- **Deny** throws away the proposal and leaves the company Unmapped. Sauerobase remembers only the most recently denied customer for that company and won't propose it again. If that customer is still the best match, nothing is proposed; the next-best customer isn't offered instead. The memory clears as soon as any customer is linked to the company.
- Unlinking a customer keeps the company Mapped while others remain. Unlinking the last one returns it to Unmapped and clears its Status, Account Type and Last Contact.
- **UnMap** unlinks every customer at once, clears the same details, and the company stops getting metrics.

### Picking a customer by hand

- The search needs at least 3 characters and shows up to 25 customers, matching display name, email, first or last name, or Sauero code.
- Customers already linked to this company are left out. A customer linked to a different company can be picked, and it then moves to this company. The other company keeps the Mapped status even if that was its only customer, and stops getting metrics.

### How proposals are scored

A proposal needs a score of at least 55%. Nothing is linked until someone confirms.

- Name: the Folk company name is compared with each customer's display name and with the company names on the customer's addresses. Words like Inc, LLC, Co and The are ignored, and the score allows for reordered words and small typos.
- Address: when both the Folk company and the customer have an address, the score is 70% name and 30% address. The address part compares zip code, street number and city, with street number counting most, since two branches of a chain often share a city and zip. When either side has no address, the name alone is the score.

## Creating Shopify customers from Folk

A Folk company that's still **Unmapped** after the seed has no Sauerobase customer, so the nightly reconcile creates one in Shopify from the company's details and links it. The company becomes **Mapped**, and from then on it gets order metrics like any other. The new customer shows on the Customers page straight away and can be sent sample orders.

- Which companies: every Unmapped company in the tracked groups that hasn't been handled yet. **Pending review** companies wait until someone confirms or denies the proposal, so a correct proposal never turns into a duplicate customer. A denied proposal leaves the company Unmapped, so it's handled at the next reconcile.
- Email is required. The company's first email is used, and a company without one is skipped.
- If a Shopify customer already has that email, nothing is created. That customer is linked to the company instead, and nothing about them changes in Shopify.
- Each company is handled once. After a customer has been created or linked, the company is never sent to Shopify again, even if it's later unlinked. A company that couldn't be handled (no email, or Shopify refused it) is tried again at the next reconcile.

What the new Shopify customer gets:

| Shopify customer | From Folk |
| --- | --- |
| First name | Company name |
| Email | The company's first email |
| Phone | The company's first phone, when it's a clear 10-digit US number (with or without the leading 1). Anything else is left off, because Shopify would refuse the whole customer over a phone number it can't read |
| Default address | The first company address that can be read, with the company name as the address's company |
| Tags | Folk-Sauerobase, B2B and wholesale |

The B2B tag means the customer counts as a wholesale customer from the start, so their page shows case volume, a store count and SKU velocity ([Customer insight](../02-features/customer-insight.md)).

### How addresses are read

Folk keeps addresses as one line of text, usually copied from Google Maps, such as "747 S 6th Ave, Tucson, AZ 85701". Sauerobase splits it into street, city, state and ZIP:

- A suite or unit at the end of the street ("Ste 101", "Suite 4", "Unit 2", "Apt 3", "# 2") becomes the second address line.
- A trailing "USA" or "United States" is dropped. The country is always the United States.
- Whatever can't be read is left empty. "3055 N Campbell Ave" on its own becomes a street with no city, state or ZIP. A state that isn't a real US state is dropped, and the ZIP is kept.
- The city is used exactly as written. Google Maps sometimes puts a neighbourhood there ("Downtown", "Barrio Viejo"); it still ships, because carriers route by ZIP.

A customer with an incomplete address is still created. Sample orders to them are refused until the address has a street, city and ZIP, so complete it in Shopify first.

## What Sauerobase writes to Folk

Every field Sauerobase owns ends in (auto), which tells the sales team the value fills in automatically. Editing one in Folk has no lasting effect: the next push sees it differs and writes the correct value back.

Values are only written to mapped companies with at least one linked customer, and only to fields Sauerobase owns; any attempt to write another field is refused. Each field is compared first, and only changed values are sent.

Every money field is net revenue, the same definition as the Revenue and customer pages: product lines (price times quantity) plus shipping, minus discounts, minus refunds. Tax isn't revenue, so it's never included, and product tax returned in a refund isn't counted as a loss. Only successful refunds are subtracted, and cancelled orders are left out everywhere.

| Folk field | Type | How it's calculated |
| --- | --- | --- |
| First Order Date (auto) | Date | Date of the earliest order across all linked customers |
| Last Order Date (auto) | Date | Date of the most recent order across all linked customers |
| Days Since Last Order (auto) | Number | Today minus Last Order Date |
| Last Order Value (auto) | Number | Net revenue of that most recent order |
| Last Order Quantity (auto) | Number | Cases on that order: the quantity of each product line with a SKU, leaving out lines removed from the order entirely. A line reduced by an edit still counts at its original quantity |
| Average Order Size (auto) | Number | Average net revenue per order over the last 90 days. Blank if there were no orders in that window |
| Revenue Lifetime (auto) | Number | Total net revenue across all orders of every linked customer. Matches the sum of Net Revenue on those customers' pages |
| Orders Lifetime (auto) | Number | Number of orders across every linked customer |
| Store Count (auto) | Number | Sum of the store counts set on each linked customer's page (1 unless changed) |
| Retail Velocity (auto) | Number | Units per store per week: each linked customer's units per week since their first order, added up, divided by the stores of those customers. Units are the original quantities of every product line with a SKU, including lines later removed from an order. Customers with fewer than two orders are left out. Blank if none qualify |
| Metrics As Of (auto) | Date | The day the metrics were calculated |
| Sauero Customer ID (auto) | Text | Sauero codes of every linked customer, comma-separated |
| Reorder Due (auto) | Text | Not live. The field is defined, but nothing is written until the reorder rule is agreed |

- Money values are rounded to 2 decimals.
- All dates are Mountain time (America/Denver), so an order placed at 9pm in Colorado is dated that day, not the next.
- A mapped company with no orders gets the first-order, last-order, average and Retail Velocity fields cleared, and Revenue Lifetime and Orders Lifetime set to 0. Metrics As Of, Sauero Customer ID and Store Count are still written.

## What Sauerobase reads from Folk

| From Folk | Used for |
| --- | --- |
| Company name and ID | The Folk mapping table, with a link to the company in Folk |
| Group membership | Deciding whether a company is tracked at all |
| Group names | The Configuration picker. Tracked group names refresh on every seed, so a rename in Folk carries through |
| Company addresses | Proposing a matching customer, and the default address of a Shopify customer created for an Unmapped company. Not stored in Sauerobase |
| Company emails and phones | The email and phone of a Shopify customer created for an Unmapped company. Not stored in Sauerobase |
| SD Customer ID | Shown in the mapping table to help confirm the right customer. Folk owns it, and Sauerobase never writes it |
| Status | Shown as "Status" in Folk Details on the customer page |
| Account Type | Shown as "Account Type" in Folk Details on the customer page |
| Interactions | The most recent one's date and type, shown as "Last Contact" on the customer page |

Status, Account Type and Last Contact are only held for mapped companies, and they refresh the moment a customer is linked, without waiting for the nightly reconcile.

## When it runs

| Pipeline | When | What it does |
| --- | --- | --- |
| Folk metrics push | Scheduled | Recalculates and writes metrics for every mapped company |
| Folk nightly reconcile | Scheduled, once a night | Refreshes group names, re-seeds the tracked groups, creates Shopify customers for Unmapped companies, pushes metrics and refreshes Last Contact from interactions |
| Folk webhooks | Real time | Reacts to companies being created, edited, deleted or moved between groups |

Exact schedules and each one's last result are on [Data Pipeline Health](../02-features/information-currency.md). Metrics on a Folk card catch up with a new order on the next metrics push. **Seed from Folk** runs the same seed as the nightly reconcile, on demand.

### What a seed does

- New companies are added as Pending review (a proposal was found) or Unmapped (none found).
- Existing Unmapped and Pending review companies are re-checked, so a customer who shows up later can produce a proposal. This is the only place proposals are re-checked; webhooks for existing companies don't do it.
- Mapped companies keep their links, and their name, SD Customer ID, Status and Account Type refresh.
- Companies no longer in any tracked group are removed. If Folk returns no companies at all, this cleanup is skipped so it doesn't wipe every mapping.

### What each webhook does

| Folk event | What Sauerobase does |
| --- | --- |
| Company created | Adds it if it's in a tracked group, with a proposal if one is found |
| Company updated | Refreshes name and SD Customer ID, and for a mapped company its Status and Account Type. A company no longer in any tracked group is removed. Edits that only touch Sauerobase's own fields are ignored, since they're Sauerobase's writes echoing back |
| Company deleted | Removes its mapping |
| Groups changed | If the change removes a tracked group and adds none, the mapping is deleted, even if the company is still in another tracked group (the next seed adds it back as a new, unlinked company). If it adds a tracked group, the company is added or refreshed |

- Every webhook's signature is checked against `FOLK_WEBHOOK_SECRET`, with a five-minute timestamp tolerance. Unsigned, mis-signed or stale requests are rejected.
- A valid webhook is acknowledged to Folk before it's processed. If processing then fails, the failure only shows on Data Pipeline Health (`folk-webhooks-realtime`). It isn't retried, so Sauerobase only catches up at the nightly reconcile.

## New SimplyDepo customers and merged companies

- New SimplyDepo customers are created in Folk's Customers - AZ group by a separate Zapier automation, and reach the mapping page through the Company created webhook. They often arrive Unmapped because the Shopify customer doesn't exist yet, and the next nightly reconcile creates it (see [Creating Shopify customers from Folk](#creating-shopify-customers-from-folk)). See [New customer to Folk](../03-workflows/new-customer-to-folk.md).
- Merging companies in Folk deletes the merged-away company, which removes its mapping and customer links. Re-link the customers on the surviving company.
