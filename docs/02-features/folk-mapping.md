---
order: 9
title: Folk Mapping
description: Link Folk companies to Sauerobase customers so ordering metrics flow into Folk and Folk's relationship details show in Sauerobase.
last_verified: 2026-10-08
---

# Folk mapping

Folk is the sales team's CRM, and this screen links each Folk company to one or more Sauerobase customers. Once a company is mapped, Sauerobase writes that customer's ordering figures onto the Folk company card (last order, lifetime revenue, retail velocity and more), so sales can see who's due a call without leaving Folk. Folk's status, account type and last contact show on the customer's page in Sauerobase.

One Folk company can map to many customers, because a chain with several store accounts is one company in Folk. Sales and commercial use the screen, with operations, when new companies appear in a tracked Folk group, when the sidebar shows companies waiting for review, and when a customer is linked to the wrong company.

Only companies in the Folk groups tracked on [Configuration](./system-settings.md) appear here; everything else in Folk is ignored ([Rule 59](../01-business/business-rules.md)).

## Folk mapping screen: reviewing and linking companies

- **Seed from Folk** pulls in every company from the tracked groups now, without waiting for the scheduled refresh. New companies get a proposed customer where a likely match is found, and companies no longer in a tracked group are removed.
- **Field preflight** checks the Folk fields Sauerobase needs. For each tracked group it creates any missing Sauerobase field, and warns about fields with the wrong type or Folk fields Sauerobase reads that are missing. Run it after adding a group.
- **Search** by Folk company name or SD Customer ID, and **filter** by status. Customer search needs at least three characters.
- **Confirm** or **Deny** a proposal.
- **Pick** a customer by hand, or **Add** another customer to a company that's already mapped.
- **Unlink** one customer from a company with the × on its name.
- **UnMap** a company, which unlinks all its customers.
- **Open in Folk**, or open a linked customer's page in Sauerobase.

The table shows each Folk company, its SD Customer ID (from Folk, to help confirm the right customer), the linked or proposed customers with their Sauerobase customer IDs, and the status. Mapped companies are listed first, then proposals, then the rest.

## Mapping statuses

| Status | Meaning | Actions |
| --- | --- | --- |
| Pending review | Sauerobase proposed a likely customer, shown with a match percentage. Counted in the sidebar badge next to Folk mapping | Confirm, Deny, Pick |
| Mapped | At least one customer is linked, and the company gets order metrics | Add, unlink, UnMap |
| Unmapped | No customer linked and nothing proposed. The nightly reconcile creates a Shopify customer for it and links it ([details](../04-technical/folk-flow.md#creating-shopify-customers-from-folk)) | Pick |

```
Seed / new company in a tracked group
        │
        ├─ likely match found ─► Pending review ──Confirm──► Mapped
        │                              │
        │                              └──Deny──► Unmapped
        │
        └─ no match ──────────────────────────► Unmapped ──Pick──► Mapped
                                                     │
                                                     └── nightly: customer
                                                         created in Shopify ──► Mapped

Mapped ──UnMap, or unlink the last customer──► Unmapped
```

- **Confirm** links the proposed customer and fetches the company's status, account type and last contact from Folk right away.
- **Deny** throws away the proposal and leaves the company Unmapped. That customer isn't proposed for it again (details in [Folk flow](../04-technical/folk-flow.md#mapping-statuses)), but you can still pick a customer by hand.
- A proposal is never linked until someone confirms it ([Rule 60](../01-business/business-rules.md)).

## What Sauerobase writes to Folk

Sauerobase only writes to mapped companies, and only to its own fields, which all end in (auto). Editing one of these in Folk has no lasting effect, because the next update writes the correct value back. Money figures are net revenue, the same as the Revenue and Customers screens, and dates are in Mountain time.

| Folk field | What it holds |
| --- | --- |
| First Order Date (auto) | Earliest order across the linked customers |
| Last Order Date (auto) | Most recent order |
| Days Since Last Order (auto) | Days since that order |
| Last Order Value (auto) | Net revenue of that order |
| Last Order Quantity (auto) | Cases on that order |
| Average Order Size (auto) | Average net revenue per order over the last 90 days |
| Revenue Lifetime (auto) | Total net revenue across the linked customers |
| Orders Lifetime (auto) | Number of orders across the linked customers |
| Store Count (auto) | Sum of the store counts set on each linked customer's page |
| Retail Velocity (auto) | Units per store per week |
| Metrics As Of (auto) | The day the figures were worked out |
| Sauero Customer ID (auto) | The Sauero codes of the linked customers |

A **Reorder Due (auto)** field is defined, but nothing writes to it yet. Exact definitions are in [Folk flow](../04-technical/folk-flow.md), and metrics refresh on a schedule (see [Data Pipeline Health](./information-currency.md)). Sauerobase can't write any other Folk field, and can't create, rename or delete companies in Folk.

## What Sauerobase reads from Folk

| From Folk | Shown where |
| --- | --- |
| Company name and SD Customer ID | This screen |
| Status | Folk Details on the customer's page |
| Account Type | Folk Details on the customer's page |
| Last contact (date and type of the latest interaction) | "Last Contact" on the customer's page |

Sauerobase never writes Status, Account Type or SD Customer ID. Changes to companies in Folk (new, edited, deleted or moved between groups) reach Sauerobase as they happen, and everything is re-checked on a schedule.

## Moving, unlinking and removing companies

- Picking a customer who's already linked to another company moves them, with no warning. If that leaves the other company with no customers, it still reads Mapped but gets no metrics, so UnMap it or pick its customers again.
- Unlinking the last customer makes the company Unmapped and clears the Folk details Sauerobase held for it.
- Unmapping doesn't clear Folk. The (auto) values already on the Folk card stay as last written and stop updating.
- Removing a tracked group on Configuration removes its companies from this screen and unlinks their customers. Nothing changes in Folk.
- Merging companies in Folk deletes the merged-away company, which removes its mapping and customer links here. Re-link the customers on the surviving company.
- There's no history of who linked or unlinked what.
- New SimplyDepo customers are added to Folk by a separate automation and then show up here. See [New customer to Folk](../03-workflows/new-customer-to-folk.md).
