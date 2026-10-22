---
order: 14
title: AI Assistant
description: Ask an AI assistant such as Claude about orders, stock, revenue, plans and more, answered from live Sauerobase data.
last_verified: 2026-10-02
---

# AI assistant

An AI assistant can answer questions about the business by reading directly from Sauerobase. Instead of opening and filtering several screens, you can ask "what were our top five customers by revenue last quarter?" or "is any batch expiring in the next 90 days?". Commercial, operations and supply use it for one-off questions, through the assistant they already have.

The assistant connects through a remote connector (an MCP server). Any assistant that supports remote MCP connectors can use it, and the in-app setup dialog covers Claude, Claude Code and Cursor.

## What the assistant can read

| Area | What it can answer |
| --- | --- |
| How Sauerobase works | This help center (features, workflows, business rules, calculations and limitations), with a link to the page it answered from |
| Dashboard | Headline figures, order status mix, trends, top products, new and returning customers |
| Orders | Order lists with the same filters as the Orders screen, with line items on request |
| Fulfillment | Lead time, transit time, on-time rate and the targets behind it |
| Inventory | Stock value across locations; BlueBox stock with batches and expiry; inbound shipments; production runs; kitting orders; Manuel Brothers stock; replenishment orders |
| Demand planning | Plans, the forecast grid, forecast methods, plan pricing, scenarios, plan comparisons and forecast accuracy |
| Inbound emails | POD and pickup emails and their processing status, plus the inbox connection |
| Revenue | Revenue and margin by channel or product, with a daily trend on request |
| Customers | Customer lists and full detail for one customer, including order history |
| Data pipelines | Whether each feed is current, and what failed |
| Folk | Which Folk companies are mapped to customers, what's pending review, and the tracked groups |
| SKU settings | The product list, custom columns, which systems recognize each product, and the change history |
| Configuration | Delivery targets and Manuel Brothers email addresses |
| Users | Who has access |

Dates like "last month" or "this week" are worked out in the business time zone, Mountain time (America/Denver), whoever is asking and wherever they are. Figures are only as current as the data feeds; the assistant can check [Data Pipeline Health](./information-currency.md) itself, so ask it to when timing matters.

## Read-only, full access, no accounting data or attachments

- It's read-only by design. It can't create a transfer, process delivery paperwork, change a product, map a Folk company or change a setting.
- It can't read accounting data, since nothing in Sauerobase displays it.
- It doesn't return product price and cost history (cost of goods, fulfillment cost, channel price, MSRP), though margins built from those costs come through revenue and customer questions.
- It can't open email attachments or delivery documents.

Anyone who connects the assistant gets the same full read access as any user: every order, customer and revenue figure. There's no narrower view. Removing someone on the [Users](./user-access.md) page also ends their assistant connection.

## Getting set up

Open **Connect to MCP** in the System section of the sidebar and follow the steps for your assistant. You add the connector once and sign in with your own Sauerobase account in a browser window, so the connection belongs to your account, not to a particular computer. Full steps and a short test are in [Connect to MCP](../05-guides/connect-to-mcp.md).
