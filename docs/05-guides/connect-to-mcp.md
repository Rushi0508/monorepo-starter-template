---
order: 1
title: Connect to MCP
description: Connect Claude to Sauerobase and add the Sauero skill, step by step.
last_verified: 2026-09-30
---

# Connect to MCP

Once it's connected, Claude answers questions about Sauero's orders, customers, revenue, stock and delivery, so anyone on the team can ask without knowing how the systems fit together. You set it up once in the Sauerobase app, from a single dialog: connect the MCP connector, then add the Claude skill. After that, you ask questions in plain English.

You need a paid Claude plan (Pro, Max, Team or Enterprise) that allows custom skills, and your Sauerobase login.

## Chat or Cowork

| Use | When |
| --- | --- |
| Claude chat (claude.ai) | You want an answer now, like "how is Time Market doing?" or "net revenue last month". This is what this guide sets up |
| Claude Cowork | You want Claude to run a longer multi-step job and leave you a spreadsheet or deck while you walk away. The same Sauerobase connector can apply, but Cowork setup is separate and not covered here |

If you're only asking business questions, use chat.

## Setup in Sauerobase

Open **Connect to MCP** in the System sidebar and pick your client: Claude.ai, Claude Code or Cursor. Each tab walks through both steps in order:

1. Connect the server. Paste the MCP server URL where the tab tells you, and sign in with your Sauerobase account when prompted.
2. Add the skill. Download `sauerobase.zip` from the same dialog, upload it in Claude (**Capabilities**, then **Skills**) and toggle **sauerobase** on.

The skill is optional but recommended. The connector works without it, but answers won't carry Sauero's metric definitions and caveats. Skills are a Claude feature, so there's nothing to add on Cursor.

Each person has to upload the skill themselves, because an admin can't push it to the whole company from Claude today. The zip is always available from that dialog, so you don't need anyone to share a file.

## Test it

Start a new chat and try these:

1. "What was our contribution margin last month?" You want a number and a caveat that margin is only as accurate as the costs entered in SKU settings.
2. "Is our warehouse stock figure current?" You want Claude to look at sync status and say when the data last updated.
3. "What's our QuickBooks AR aging in Sauero?" You want Claude to say accounting data isn't available through this connection, not a made-up aging report.
4. "How does order visibility work?" You want an answer taken from this documentation, with a link to the Orders page.

If 1, 2 and 4 work and 3 is clearly refused, you're set.

## Asking questions day to day

Ask normally, for example:

- "How well is Time Market being served over the last six months?"
- "Top SKUs by net revenue this quarter"
- "Any BlueBox lots expiring in the next 30 days?"
- "What does Rule 13 mean?"

You don't need to name tools or databases; the skill carries that context. When Claude says it doesn't hold something, believe it. A missing number is safe. A confident wrong one is the failure to watch for.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Connector asks you to sign in again | Complete the browser login and consent. Tokens expire or get revoked |
| Skill never seems to apply | Check it's toggled on, start a new chat, and mention Sauero or a clear business metric |
| "Could not find SKILL.md" | Download the zip again from **Connect to MCP**, and don't unzip and re-zip nested folders |
| Answers look stale | Ask "when did Shopify/BlueBox last sync?" Figures aren't live |
| The wrong person sees data | The connector uses your Sauerobase login with full read access, so only connect accounts that should see the business |

## Access and accuracy

- Connecting grants the same full read access as any Sauerobase user: every order, customer and revenue figure. There's no narrower Claude-only view.
- Margin numbers are only as good as the costs entered per product in SKU settings, and a cost not entered counts as zero. Check the costs are set before making a big decision on them.
- Claude can't edit orders, send emails or change settings through this connection. It's read-only on purpose.
