---
order: 5
title: Demand Planning
description: Plan cases by channel and product, test scenarios, compare plans and score forecasts.
last_verified: 2026-10-02
---

# Demand planning

Demand planning forecasts how many cases of each product each channel will need, month by month, over a rolling horizon. Sauerobase starts every plan from real sales history, the team adjusts the numbers, and the plan is signed off once a month. Revenue is always worked out from the plan's prices; nobody types it in.

| Screen | Use it to |
| --- | --- |
| Plan Workspace | Build and adjust the current plan |
| Scenario Plans | Try "what if" versions without touching the real plan. See [Scenarios](#scenarios) |
| Plan History | See every plan, newest first, with its status |
| Compare Plans | See what changed between two plans. See [Compare plans](#compare-plans) |
| Forecast Accuracy | Score finalized plans against what sold. See [Forecast accuracy](#forecast-accuracy) |

## Planning cycle and workspace

### The monthly cycle

```
New plan (or Start next cycle)
     │
     ▼
Draft — adjust numbers, prices and settings
     │
     ▼
Finalize plan — locked; becomes the plan of record for that month
     │
     ├─► Unlock plan — back to draft, if it needs changes
     │
     └─► Start next cycle — next month's draft, carrying the work forward
```

- A plan belongs to the business month (Mountain time) it was created in, and that never changes.
- The base plan is the plan of record for its month, as opposed to a [scenario](#scenarios). There's one per month and only one open draft at a time, so finish or delete a draft before starting another ([Rules 55 and 56](../01-business/business-rules.md)).
- The horizon is how far ahead the plan forecasts. It's 12 months unless changed, and it can be changed while the plan is a draft.
- The Plan Workspace opens on the open draft if there is one, and otherwise on the most recently finalized plan.

### Creating a plan

**New plan** asks for the channels, the products (SKUs) to plan in each channel (at least one per channel) and the horizon. Products come from [SKU Settings](./product-master-data.md).

### The grid

The grid runs from January of the plan's year to the end of the horizon. Months before the plan month show what sold. You can edit from the plan month (or the current month, whichever is later) to the end of the horizon.

Each product in each channel has six rows:

| Row | Meaning |
| --- | --- |
| Actual | Cases ordered that month |
| Statistical | The starting forecast, from the forecast method |
| Plan | The team's number. It's the statistical value unless someone overrides it |
| Variance | Plan minus Statistical: how far the team moved from the baseline |
| Actual Rev | Revenue of the actual cases, before discounts and refunds |
| Projected Rev | Plan cases times the plan's price for that month |

Rows can be grouped by channel or by product. A price applies from the start of the month it takes effect, and a month with no price shows no projected revenue, not $0.

### Forecast methods

Each product in each channel has its own method, set in **Configure plan**:

| Method | How the statistical number is worked out |
| --- | --- |
| Historical average | The average monthly cases over a trailing window of recent months (you choose the window) |
| Static growth | Last month's cases, grown by a monthly rate you set |
| Hard entry | No baseline. Every number is typed in |

Only completed months are used, results are rounded to whole cases, and a product with no history starts at zero. Months with no sales are left out of the historical average instead of counting as zero, so a product that sells only now and then can average higher than you'd expect.

### Changing a number

Typing a new value in a **Plan** cell overrides the statistical number. Each plan has two override thresholds, set in **Configure plan**:

- **Flag above**: overrides further than this from the statistical number are highlighted.
- **Require reason above**: overrides further than this need a reason before they save.

The reason is one of Promotion, Customer commitment, Sales input, Marketing campaign, Inventory constraint, New customer, Market trend, Manual adjustment or Other, with an optional note. When the statistical number is zero, an override is never flagged and never needs a reason. Clearing a cell brings back the statistical number.

### Prices and costs in a plan

When a plan is created, or a product is added to it, it copies that product's cost of goods, fulfillment cost and channel price from SKU settings ([Rule 58](../01-business/business-rules.md)). Later changes in SKU settings don't change the plan, so a signed-off plan keeps the numbers it was approved with. A draft plan's own prices can be edited in **Configure plan**, and those edits are recorded in its activity.

### Importing numbers

**Import** loads Plan numbers from a CSV or Excel file. Download the template from the import dialog; it comes pre-filled with the plan's channels, products and months. The file needs a Channel column, a SKU column, then one column per month (for example "Sep 2026").

- If any row has a problem, nothing is imported and the problems are listed.
- Blank cells and months outside the plan are skipped.
- Imported values are recorded as "Manual adjustment", so they don't stop for a reason.

### Signing off and moving on

| Action | What it does |
| --- | --- |
| **Finalize plan** | Locks the plan and freezes the actuals it was based on. Base plans only |
| **Unlock plan** | Returns it to draft and throws away the frozen actuals. Not possible while another draft is open |
| **Start next cycle** | Creates next month's draft from this plan, carrying over its products, methods, thresholds, prices and its overrides from the new month on |
| **Delete this plan** | Removes the plan and its activity, finalized plans included. It drops out of Forecast Accuracy, and it can't be undone |

Nothing needs approval: anyone signed in can finalize, unlock or delete a plan.

### Where the actuals come from

Actuals are cases ordered, by order date in Mountain time, taken from Shopify orders. Cancelled orders and removed lines are left out. Products are matched through SKU settings, including a product's old codes, so sales of a product that isn't in SKU settings don't count. The current month is marked as partial.

Actuals are rebuilt from orders on a schedule, and the **demand-actuals** feed on [Data Pipeline Health](./information-currency.md) shows when that last happened.

### Activity

**Activity** lists every change made to a plan, newest first, with who made it and when: overrides, imports, price edits, setting changes, finalizing and unlocking.

## Scenarios

A scenario is a private copy of a plan for testing an idea, like a new retail chain, a promotion or a price change, without touching the plan the business has committed to.

- **New scenario** copies a plan in full: its products, methods, prices and overrides. A scenario made from another scenario still points back to the original base plan.
- You edit a scenario in the same grid as a plan. See [Planning cycle and workspace](#planning-cycle-and-workspace).
- **Duplicate** makes another copy to try a variation.
- **Save scenario** locks it, and **Reopen** unlocks it.
- **Compare with base** opens Compare Plans with the scenario against the plan it came from.
- **Make base plan** turns the scenario into the next cycle's draft base plan once the idea is adopted.

```
                 Save scenario
Draft  ─────────────────────────►  Saved
  ▲                                    │
  └────────────── Reopen ──────────────┘

Draft or Saved ── Make base plan ──► Draft base plan for the next cycle
```

Scenarios are never scored in Forecast Accuracy; only finalized base plans are.

## Compare plans

Pick two plans, a baseline (A) and a compared plan (B), to see how the outlook moved.

- Only the months both plans cover are compared.
- Total, volume and price change show separately: how much of the revenue difference comes from planning more or fewer cases, and how much from different prices.
- Click a month, or drag across several, to focus the breakdown below.
- Largest movers lists the products (or channels) that drove the change, biggest first, with the change in cases and its volume and price effect.

Start from the whole plan, zoom into the month that moved most, then look at the products behind it.

## Forecast accuracy

Forecast accuracy scores each month's actual cases against the forecast that existed at the time. A finalized plan can't be changed, so nobody can fix an old forecast after the fact. Only finalized base plans are scored, only completed months count, and everything is measured in cases. Deleting a finalized plan removes it from the scores. Actuals use order dates in Mountain time, the same as the plans (see [Where the actuals come from](#where-the-actuals-come-from)).

### Lag: how far ahead the forecast was made

The same month was forecast by several plans: the plan made one month before, two months before, and so on. **Lag** picks which one to score, from 1 to 6 months ahead. Forecasts made further ahead are expected to be less accurate, so the trend across lags matters more than any single number.

### Accuracy, forecast, actual and bias

| Figure | Meaning |
| --- | --- |
| Accuracy | How close the forecast was. 100% means exact, and a miss as large as the forecast scores 0%. A forecast of zero with zero sales scores 100% |
| Forecast | Cases the chosen plan expected for the month |
| Actual | Cases ordered in the month |
| Bias | Whether plans tend to forecast too low (positive) or too high (negative): actual minus forecast, added up across the months scored, as a share of the forecast |

### Forecast accuracy views

- **Actual vs forecast, month by month**, for the chosen lag.
- **Accuracy by lag**: the same month scored against older and older plans.
- **Accuracy by channel**, because a good company-wide number can hide two channels missing in opposite directions.
- **Where we got it wrong**: the biggest misses by product or channel. Open a row for detail.

Filter by month, channel and product at the top of the page.
