# Sauero MCP tool catalog

All tools are **read-only**. They call Sauero-base APIs. There is no write path and no raw SQL tool.

**Dates:** date filters and any per-day or per-month grouping are in business time (Mountain, America/Denver). Timestamps on individual records come back in UTC (ending in `Z`) — convert them to Mountain time before quoting a date or time. See **Business time vs record timestamps** in `SKILL.md`.

Use this file to choose tools and to know what each does **not** cover. MCP tool descriptions in `apps/mcp` mirror this compressed guidance; this catalog and the other skill references add full business context when the skill is loaded.

---

## get_docs

**Use it when:** The question is about how Sauero works rather than what the numbers are — how a feature, screen, workflow or automation behaves, what a business rule means (e.g. "Rule 13"), how a metric is calculated, what the system cannot do, glossary terms, or how to set something up.

**Do not use it for:** Live figures, orders, stock or anything that changes day to day — use the data tools. Combine both when needed: the doc explains the rule, the data tool shows the actual records.

**Does not cover:** Anything not written in the docs. If search finds nothing and no title in `view=list` fits, say the docs do not cover it rather than guessing.

**How to call:** `view=search` with `query` (key words, e.g. "order visibility") returns up to 5 matching sections as `path` + `section` + short snippet (~150–350 tokens). If nothing fits, `view=list` returns every doc with a one-line summary (~2k tokens) — pick the closest titles. Then `view=read` with `path` and `section` returns just that section (usually a few hundred tokens); `path` alone returns the whole doc (up to ~4k tokens for the business rules). An unknown section returns the doc's section headings to choose from. Answer from what you read and link the returned `url`, which points at the exact section.

**Key params:** `view` (`list` default, `search`, `read`), `query`, `path`, `section`.

---

## get_dashboard

**Use it when:** You need headline business health for a date range — order count, net revenue, units shipped, open alerts, order-status breakdown, top SKUs, new-vs-returning split.

**Do not use it for:** Per-customer detail, SKU cost settings, warehouse lots, or a full revenue ladder with COGS and contribution (use `get_revenue`).

**Does not cover:** Daily trend and traffic/session breakdown unless `includeTrend=true` / `includeSessions=true`. Session data is Shopify traffic, not ad-platform or Klaviyo attribution. "Delivered" on the dashboard follows the store fulfilment status — not the warehouse delivery date used in on-time reporting.

**Key params:** `dateStart`, `dateEnd`, `includeTrend`, `includeSessions`.

---

## get_orders

**Use it when:** Searching or filtering orders by number, customer, email, payment/fulfilment status, SKU, channel, or date. Building a customer or channel order list to aggregate yourself.

**Do not use it for:** Headline margin metrics (use `get_revenue`), stock levels (use `get_inventory`), or on-time % as a first-class metric (use `get_fulfillment` metrics).

**Does not cover:** Line items, fulfillments, and shipping address unless `includeDetail=true`. Does not expose shipping zone, carrier rate cards, or kitting costs. Channel on very new orders may be wrong until the fuller refresh (~2h).

**Key params:** `search`, `paymentStatus`, `fulfillmentStatus`, `skus`, `channel`, date range, sort, `page`/`limit` (default limit 10), `includeDetail`.

---

## get_fulfillment

**Use it when:** Service level / delivery performance — average lead time, transit time, on-time rate, targets, and order rows with transit/lead days. Investigating whether a customer or set of orders was on time.

**Do not use it for:** Revenue or margin, POD email contents (use `get_pod_emails`), or stock.

**Does not cover:** Line items and tracking unless `includeDetail=true`. Orders the warehouse never handled appear without delivery info and are excluded from headline metrics. On-time uses warehouse delivery dates and channel targets from settings — not Shopify's fulfilment badge.

**Key params:** `search`, `fulfillmentStatus`, `channel`, date range, sort (including picked/shipped/delivered dates), `page`/`limit`, `includeDetail`.

---

## get_inventory

**Use it when:** Warehouse (BlueBox/iDrive) or Manuel Brothers stock, inbound ASNs, production runs, kit orders, MB replenishment, expiry/lot questions, or cross-warehouse stock value.

**Do not use it for:** Orders, revenue, or "what did we ship to a customer."

**Does not cover:** Default `view=summary` is BlueBox/MB counts only. `view=cross_warehouse_summary` is the hub stock-and-COGS breakdown (`breakdownBy=sku|location`; children need `includeDetail`). `view=bluebox_kit_orders` lists kitting orders; components need `includeDetail`. List views are paged. Lots/packages need `includeDetail` or `expiringWithinDays`. Stock is not live — check pipelines for freshness.

**Key params:** `view`, `sku`, `breakdownBy`, `includeDetail`, `expiringWithinDays`, `page`/`limit`.

---

## get_demand_planning

**Use it when:** Planned demand in units by channel and SKU — the plan list, the operative workspace plan, the grid, forecast methods, plan pricing, activity, scenarios, a diff of two plans, or forecast accuracy against shipments.

**Do not use it for:** Actual shipped revenue (use `get_revenue`), live stock (use `get_inventory`), or creating, editing, finalizing, or deleting plans. This tool is read-only.

**Does not cover:** Default `view=plans` is a paged list with totals. `view=operative` is the open draft, else the latest finalized base plan. Grid cells are forecast months and need `includeDetail=true`; pass `period` (`YYYY-MM`) for one history month. Pricing default is the cost currently in force; version history and cost components need `includeDetail=true`. Pass `channel` or `skuSettingId` to look at one series. Compare needs `planAId` and `planBId`. Accuracy accepts `demandPeriod` (`YYYY-MM`), `lag`, `channels`, and `skuSettingIds`.

**Key params:** `view` (`plans`, `operative`, `plan`, `grid`, `forecast_methods`, `pricing`, `audits`, `scenarios`, `compare`, `accuracy`), `id`, `basePlanId`, `planAId`, `planBId`, `demandPeriod`, `lag`, `channels`, `skuSettingIds`, `channel`, `skuSettingId`, `period`, `includeDetail`, `page`/`limit`.

---

## get_pod_emails

**Use it when:** Inbound inbox status — Gmail connection and ingested proof-of-delivery or pickup emails (subject, status, attachment metadata).

**Do not use it for:** General customer communication, folk CRM activity, sales emails, or "what have we said to this account."

**Does not cover:** Attachment bytes (not streamed). Default `type=POD`. Pass `type=PICKUP` for replenishment pickup confirmations. Other email is discarded without record in Sauero.

**Key params:** `type` (`POD` or `PICKUP`), `includeConnectionStatus` (default true).

---

## get_revenue

**Use it when:** Revenue deep dive — gross/net, discounts, COGS, gross profit/margin, fulfilment cost, contribution profit/margin, top SKUs, channel breakdown, optional daily series.

**Do not use it for:** Live stock, customer LTV lists, or treating margin as true product-costed economics without reading known limitations (margin depends on costs entered in SKU settings; missing costs count as $0).

**Does not cover:** The MCP schema does **not** expose a `channel` filter even though the underlying API supports one. By default (`breakdownBy='channel'`) revenue and margin come back per channel in `channelBreakdown` (orders, cases, gross/net revenue, gross and contribution margin); `breakdownBy='sku'` returns `skuBreakdown` instead. Daily series only with `includeTrend=true` (last 14 points). Top SKUs (with `breakdownBy='sku'`) capped at 10 unless filtered by `skus`.

**Key params:** `orderDateStart`, `orderDateEnd`, `skus`, `breakdownBy`, `includeTrend`.

---

## get_customers

**Use it when:** Finding a customer by name/email, or detail by `id` — LTV-style stats, recent SKUs, reorder velocity, order history.

**Do not use it for:** Warehouse stock or company-wide revenue rollups (use `get_revenue` / `get_dashboard`).

**Does not cover:** Full order history unless `includeOrderHistory=true` (capped at 25 detailed). No CRM notes, tickets, or ad attribution. Gross profit uses the same per-SKU COGS as revenue.

**Key params:** `id`, `search`, date range, order-count filters, `states`, sort, `page`/`limit`, `includeOrderHistory`.

---

## get_data_pipelines

**Use it when:** Freshness / "is this current?" / which upstream sync failed. Call this whenever you quote time-sensitive figures.

**Do not use it for:** Business metrics themselves.

**Does not cover:** Silent failures that leave no pipeline row (e.g. some email send failures). Accounting sync may succeed while nothing displays QBO data in the product.

**Key params:** none.

---

## get_sku_settings

**Use it when:** Product master list, custom fields, which channels a SKU is on, catalog presence check, optional settings audit activity.

**Do not use it for:** Live inventory quantities (use `get_inventory`), or versioned COGS / channel fulfilment cost / channel price / MSRP history — those live in pricing APIs and are **not** returned by this MCP tool today.

**Does not cover:** COGS and channel fulfilment cost versions, effective-dated channel prices, shipping zones, or kitting cost models.

**Key params:** `sku`, `includeAuditLogs`, `page`/`limit`.

---

## get_configuration

**Use it when:** Reading D2C/B2B max transit day targets and MB distributor email/CC settings.

**Do not use it for:** Changing settings (read-only). Historical "what were targets last year" — current settings apply when on-time is recalculated.

**Does not cover:** COGS or fulfilment cost (set per SKU in SKU settings), user permissions, or feature flags.

**Key params:** none.

---

## get_users

**Use it when:** Listing who has Sauero platform access (id, name, email).

**Do not use it for:** Customers, orders, or auth debugging beyond "is this person a user."

**Does not cover:** Create/update/delete, roles (there are none — full access for all users), or Claude/OAuth client lists.

**Key params:** `search`, `page`/`limit`.

---


## get_folk

**Use it when:** Folk CRM company-to-Shopify-customer mapping — the review queue, counts by status, which Folk groups are tracked, or searching Shopify customers to identify a match.

**Do not use it for:** Customer lifetime value (use `get_customers`), linking, unlinking, denying, seeding, or changing tracked groups. This tool is read-only.

**Does not cover:** Default `view=mappings` is the paginated review list (`search`, `status`). `view=summary` is pending/mapped/unmapped counts. `view=customers` returns nothing until `search` is at least 3 characters.

**Key params:** `view` (`mappings`, `summary`, `groups`, `customers`), `search`, `status`, `excludeMappingId`, `page`/`limit`.

---
## Tools that do not exist (decline cleanly)

| Need | Status |
| --- | --- |
| Raw SQL / ad-hoc query | Not exposed |
| ShopifyQL / `read_reports` | Not exposed |
| Channel margin report (priority item 9) | No MCP tool |
| Exception log browser | Mentioned in older README; **not registered** in the current tool list |
| Write / mutate anything | Intentionally absent |

If the user asks for one of these, say Sauero does not expose it through the connector yet, and name what would be required.
