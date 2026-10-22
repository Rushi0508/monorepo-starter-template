# Sauero MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes Sauero's read-only business data as structured tools. Any MCP-compatible AI client — Claude.ai, Cursor, ChatGPT, etc. — can connect and query orders, customers, revenue, inventory, pipelines, and more.

---

## How it works

This is a **remote MCP server** speaking MCP over **Streamable HTTP**. Clients connect by URL.

```
AI Client (Claude.ai / Claude Code / Cursor)
        │  MCP over Streamable HTTP + Authorization: Bearer <oauth_access_token>
        ▼
  sauero-mcp server          ← this package (port 3002)
        │  validates token via Better Auth get-session
        │  forwards the same Authorization bearer to Nest
        ▼
  Sauero REST API (NestJS) + Better Auth MCP OAuth
```

Authentication uses **Better Auth's MCP OAuth plugin** (v1.6). The client opens a browser to Sauero `/login` (Google or email OTP), optionally `/consent`, then stores access/refresh tokens. Later reconnects do not require chat OTP.

The MCP server also serves root `/.well-known/*` discovery routes (proxied to Better Auth) so clients like Cursor can find OAuth metadata on the MCP origin.

---

## Setup

### 1. Build the package

```bash
pnpm install
pnpm --filter mcp build
```

### 2. Environment variables

| Variable | Required | Description |
|---|---|---|
| `SAUERO_API_URL` | ✅ | Sauero API base URL (`http://localhost:3001` locally) |
| `MCP_AUTH_API_URL` | ✅ | Auth API base URL (same host as API in this monorepo) |
| `MCP_PUBLIC_URL` | ✅ | Public MCP URL used as OAuth resource (`http://localhost:3002/mcp`) |
| `MCP_PORT` | — | Port (default `3002`) |

Also set on the **server**:

| Variable | Description |
|---|---|
| `MCP_PUBLIC_URL` | Same public MCP URL |

### 3. Run

```bash
pnpm --filter mcp start
```

Local endpoint: `http://localhost:3002/mcp`  
Production: `https://sauero.opengig.work/mcp`

### 4. Connect a client

**Claude.ai:** Settings → Connectors → Add custom connector → paste `/mcp` URL.  
On first use Claude will open a browser for Sauero login/consent.

**Cursor** — `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sauero": { "url": "http://localhost:3002/mcp" }
  }
}
```

---

## Available tools

All data tools require a valid MCP OAuth bearer token from the client. There are no in-chat OTP tools.

| Tool | Description |
|---|---|
| `get_docs` | Sauero's own documentation, read from the repo's `docs/` folder via `@repo/docs`. `view=search` (with `query`) for matching sections, `view=list` for every doc with a summary, `view=read` (with `path`, optionally `section`) for one section or the full doc as markdown with app links. |
| `get_dashboard` | Business health for a date range: orders, net revenue, order status, top SKUs, customer split. Daily points and traffic sources opt-in. |
| `get_orders` | Search/filter orders. Compact by default; `includeDetail=true` for line items & fulfillments. |
| `get_fulfillment` | Fulfillment metrics + order rows. Compact by default; `includeDetail` for tracking detail. |
| `get_inventory` | BlueBox + Manuel Brothers. `summary` (default) includes both; `cross_warehouse_summary` is stock value; `bluebox_kit_orders` lists kitting orders. List views support `page`/`limit`. |
| `get_demand_planning` | Plans, operative workspace, grid, forecast methods, pricing, audits, scenarios, compare, and accuracy. Default `view=plans`. Grid cells and pricing history need `includeDetail`; `channel` / `skuSettingId` select one series, `period` selects one month. |
| `get_pod_emails` | Inbound POD (default) and pickup emails + Gmail connection status. Pass `type=PICKUP` for pickup mail. |
| `get_revenue` | Margin/COGS deep dive and top SKUs. Charts with `includeTrend=true`. |
| `get_customers` | List or look up by `id`. Last 5 compact orders by default; `includeOrderHistory=true` for up to 25 detailed. |
| `get_data_pipelines` | Upstream sync pipeline status. |
| `get_folk` | Folk company mappings, status counts, tracked groups, and customer search. Default `view=mappings`. |
| `get_sku_settings` | SKU catalog from settings. List is paged (default 50). Pass `sku` for detail; `includeAuditLogs` for activity. |
| `get_configuration` | Transit-day and fulfillment-cost settings. |
| `get_users` | Platform user list (id, name, email). |

Each domain lives under `src/tools/<domain>/` (`schema.ts` / `shape.ts` / `tools.ts` / `index.ts`). Documentation is omitted.

### Why responses are shaped

Tool responses, not tool schemas, dominate token cost. The raw `/api/dashboard`
payload is ~25 KB (~6.4k tokens); shaped, the default response is ~1.6 KB
(~400 tokens). Rules of thumb when adding a tool:

- Never pretty-print JSON (`src/lib/respond.ts` handles serialization).
- Drop UI-only fields (colors, internal ids) and values derivable from others.
- Cap arrays and report `*Truncated` counts so the model knows data was withheld.
- Make large sub-objects opt-in via an `include*` flag rather than default-on.
- One tool per platform module — use `view` / `id` / `include*` instead of extra tools.

---

## Security notes

- Auth tokens live in the MCP **client** (Claude/Cursor), not in a shared server file.
- Nest accepts MCP API calls by validating the same OAuth access token via Better Auth `getMcpSession`.
- The MCP server is **read-only** by design.
- If an old `~/.sauero-mcp-token` file exists on the host from a previous version, delete it — it is unused.
