---
order: 10
title: Data Pipeline Health
description: Every data feed into Sauerobase, how often it runs, whether it last worked, and how to pause, rerun or unstick it.
last_verified: 2026-10-02
---

# Data pipeline health

Data Pipeline Health answers the question behind every doubtful figure: is what I'm looking at current? It lists every feed (pipeline) that brings data into Sauerobase or sends it out (orders, products, customers, stock, inbound shipments, kitting, Shopify analytics, the shared inbox, demand actuals, the SimplyDepo catalog, QuickBooks and Folk) and shows whether each one last worked. Use it before relying on a figure for a decision, when a number looks stale or wrong, and after a known outage.

This page is the reference for timings. Other help pages say data arrives "on a schedule" because schedules can change; each feed's current schedule is always shown here.

## Data Pipeline Health screen: feeds and actions

- Every feed shows its source, cadence (its schedule, or "Real-time"), status and last run (when it last finished successfully).
- Open a feed to see its description, how long the last successful run took and its last error, if the latest run failed. Only the most recent outcome and the latest error are kept; there's no history or separate failure log.
- **Trigger Run** starts a scheduled feed now. It returns immediately, so refresh the page later to see the outcome.
- **Pause** and **Resume** a scheduled feed. A paused feed doesn't run on its schedule and can't be triggered until it's resumed.
- **Force Run** replaces Trigger Run while a feed reads Running, to clear a stuck run (see [When a feed looks stuck](#when-a-feed-looks-stuck)).
- **Open** the source system from the feed's detail.

Real-time feeds, driven by events from Shopify and Folk, have no Trigger, Pause or Force buttons, because there's nothing to trigger.

![Data pipelines with source, refresh frequency, status and last run](/images/docs/data-pipelines.jpg)

## Feed states

```
Never run ──► Running ──► Succeeded
                  │
                  └─────► Failed ──► (next scheduled attempt) ──► Running

Paused ◄──── Pause / Resume ────► (back on schedule)
```

| State | What it means | What to do |
| --- | --- | --- |
| Success | Last run finished normally, and the "information current as of" time moved forward | Nothing |
| Failed | Last run didn't finish. Open the feed to read the error | Usually nothing, because the next run covers the same ground and nothing is lost ([Rule 53](../01-business/business-rules.md)). If it keeps failing, raise it |
| Running | A run is in progress, and a second can't start ([Rule 52](../01-business/business-rules.md)) | Nothing, unless it stays that way well past its usual duration |
| Paused | Switched off on purpose from this page | Resume it when it should run again |

Nothing alerts anyone when a feed fails, so somebody has to look.

## When a feed looks stuck

If a run is interrupted because the server restarts or crashes mid-run, the feed can be left reading Running, and no further run can start until that's cleared ([Rule 54](../01-business/business-rules.md)). Two things clear it:

- Restarting the server releases every run left behind and marks it Failed with the note "Run was interrupted by a server restart before it finished".
- **Force Run**. Opening a running feed shows a **Still running?** note explaining this. Force Run marks the old run as failed and starts a new one that picks up from the last successful point, so nothing is skipped.

## The QuickBooks feed

The QuickBooks feed is listed and paused. Nothing in Sauerobase displays accounting data either way (see [Connected systems](../01-business/connected-systems.md)).

## What this page doesn't cover

Some automations run in the background on their own schedule and aren't listed here, so an all-green board doesn't prove they're working:

- Processing delivery paperwork (POD emails). Check the POD tab on [Inbound Emails](./inbound-emails.md).
- Processing Manuel Brothers pickup emails. Check the Pickup tab on [Inbound Emails](./inbound-emails.md).
- The replenishment check that closes transfers and updates Manuel Brothers stock. Check the replenishment orders on the Manuel Brothers screen ([Distributor replenishment](../03-workflows/distributor-replenishment.md)).

Emails to Manuel Brothers that failed to send and acknowledgements that were missed don't show here either (see [Limitations](../01-business/limitations.md)).
