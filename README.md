# Monolith — Central Audit Telemetry & MCP Server

Monolith is the audit and reporting layer for a small ecosystem of personal apps — currently
[`continuum-home`](https://github.com/fal3n-4ngel) and `Chayakudikanpooyalo`, with `monolith-api` as the
ingestion engine that receives their events. It exists to do three things:

1. **Audit every event, per app** — every domain event from every registered app is recorded permanently,
   the moment it happens.
2. **Store it all in one place** — every app writes into the same GCP BigQuery warehouse instead of its
   own siloed database.
3. **Make it queryable** — run SQL directly, or ask an MCP-connected AI agent, for reports and cross-app
   detail without leaving the terminal.

This repository (`monolith-dashboard`) is the docs portal and MCP host — it does **not** ingest events
itself (that's `monolith-api`). Built with Next.js 16 (App Router), it serves two purposes:

1. **Marketing & Documentation Site** — a landing page plus a dedicated [`/docs`](app/docs/page.tsx) reference
   with sidebar navigation, scroll-spy, and prev/next paging through every module (MCP integration, app
   onboarding, postback spec, auth, BigQuery architecture).
2. **Model Context Protocol (MCP) Server** — standard MCP HTTP transport at `/api/mcp` so AI coding agents
   (Claude Code, Cursor, Antigravity) can query audit telemetry and BigQuery schemas directly inside the IDE.

Step-by-step app onboarding is covered in-app at `/docs` and in
[`APP_INTEGRATION_GUIDE.md`](APP_INTEGRATION_GUIDE.md).

---

## 🎨 UI/UX & Design System

The UI follows a technical/blueprint aesthetic — hairline borders, sharp corners, ruler ticks, and an
orange accent — defined as CSS custom properties in [`app/globals.css`](app/globals.css):

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#F5F1E7` | Page background (warm paper) |
| `--bg-card` | `#FAF7EF` | Panels, cards, code blocks |
| `--text-primary` | `#171717` | Headings, body copy |
| `--text-secondary` | `#6B6960` | Muted / meta text |
| `--border-subtle` | `#DAD6C8` | Hairline dividers |
| `--border-strong` | `#171717` | Structural borders, headers |
| `--accent` | `#FF5C38` | Links, CTAs, live-status markers |

- **Display Typography:** `Big Shoulders Display` (condensed, black weight) for uppercase headlines.
- **Body Typography:** `Geist` sans-serif for copy and UI controls.
- **Monospace Typography:** `Geist Mono` for code snippets, JSON payloads, SQL queries, and nav labels.

---

## ⚡ Model Context Protocol (MCP) Integration

Monolith exposes HTTP MCP transport over SSE at `/api/mcp`.

### Client Configuration (`mcp_config.json`)

Add the following to your AI agent configuration:

```json
{
  "mcpServers": {
    "monolith-telemetry": {
      "url": "https://monolith.adithyakrishnan.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_REGISTERED_MCP_KEY"
      }
    }
  }
}
```

### 🔐 Registering Allowed MCP Users & Multi-Tenant Keys

Access to `/api/mcp` is strictly restricted to authenticated MCP users. Register user keys via environment
variables on Vercel / Cloud Run:

```env
# 1. JSON Map of User Identifier -> Bearer Token
MCP_USERS='{"user1@example.com": "mcp_key_12345", "dev_team": "mcp_key_67890"}'

# 2. Standard Fallback Owner Key
MCP_API_KEY="WKNcJcLE3c3..."
```

### Available MCP Data Tools

| MCP Tool Name | Description | Arguments |
| :--- | :--- | :--- |
| **`query_user_activity`** | Query user event history & cross-domain activity | `userId`, `email`, `limit` |
| **`query_domain_events`** | Filter telemetry events by source app, domain, or eventType | `sourceApp`, `domain`, `eventType`, `limit` |
| **`get_bigquery_schema`** | Returns table schema, partitioning policy, & view specs | None |
| **`get_system_health`** | Checks Cloud Run backend ingestion status & dataset bindings | None |

---

## 📊 BigQuery Data Warehouse Architecture

All domain event tables in dataset `portfolio-api-505006:events` share a standardized schema:

- **Partitioning:** `DAY on occurred_at` — **Permanent / Infinite Retention (no expiration)**
- **Clustering:** `(local_user_id, event_type)`

### Tables & Views
- `continuum_home_expenses` (Table)
- `continuum_home_investments` (Table)
- `continuum_home_subscriptions` (Table)
- `continuum_home_watchlist` (Table)
- `events.all_events` (View — UNION of all domain event tables)
- `events.user_activity` (View — joins `all_events` with user identity profiles)

---

## 🛠️ Local Development & Build

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the marketing site, or
[http://localhost:3000/docs](http://localhost:3000/docs) for the documentation reference.

### Production Build Verification
```bash
npm run build
```

---

## 🎫 Onboarding a New Application

Because table routing is resolved server-side via `DomainEventType`, onboarding a new application starts
with a GitHub Issue — it auto-populates as a ticket on the project board, no separate board access needed:

1. [Open a new issue](https://github.com/fal3n-4ngel/monolith-dashboard/issues/new/choose) using the
   **App Integration Request** template.
2. State your `sourceApp` identifier, target domain group, and allowlisted `DomainEventType` names.
3. Upon approval, the server-side routing enum and destination BigQuery table are provisioned, with
   permanent retention and daily partitioning.

Full field-level details live at [`/docs`](app/docs/page.tsx) under **How to Add a New App**.

---

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, coding conventions, and how issues turn into
shipped changes.
