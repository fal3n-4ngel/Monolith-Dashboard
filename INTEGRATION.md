# Monolith Integration Specification & Model Context Protocol (MCP) Guide

This document defines the single-page **Monolith Documentation Portal**, telemetry ingestion backend API (`POST /api/v1/events/postback`), and the **Model Context Protocol (MCP)** server (`/api/mcp`) for AI agents.

---

## 1. Model Context Protocol (MCP) Server

Monolith exposes standard MCP HTTP endpoints (`/api/mcp`) using SSE stream transport and Bearer token authentication (`MCP_API_KEY`).

### Client Configuration (`mcp_config.json`)
Paste the following into your AI agent configuration (Claude Code, Cursor, or Antigravity):

```json
{
  "mcpServers": {
    "monolith-telemetry": {
      "url": "https://monolith.adithyakrishnan.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

### Registered MCP Tools
| MCP Tool Name | Description | Inputs |
| :--- | :--- | :--- |
| **`query_user_activity`** | Query user event history & cross-domain activity | `userId`, `email`, `limit` |
| **`query_domain_events`** | Filter events by source app, domain, or eventType | `sourceApp`, `domain`, `eventType`, `limit` |
| **`get_bigquery_schema`** | Fetch 10-column schema definitions, partitioning, & view specs | None |
| **`get_system_health`** | Get Cloud Run backend operational status & dataset bindings | None |

---

## 2. Server-to-Server Telemetry Ingestion API

- **Endpoint:** `POST https://monolith-postbacks.adithyakrishnan.com/api/v1/events/postback`
- **Authentication:** `Authorization: Bearer <CONTINUUM_API_KEY>`

### Request Payload DTO
```json
{
  "sourceApp": "continuum-home",
  "eventId": "a7826cd3-fbe0-4503-ae48-200e598ed031",
  "eventType": "EXPENSE_CREATED",
  "userId": "imm9N7AL1Nf0QQR7u6WfpXqdp5D3",
  "entityId": "civbZendUJuf2dLgU4YM",
  "itemCount": 1,
  "timestamp": 1724584284000,
  "payload": {
    "amount": 29.99,
    "category": "Software",
    "environment": "production"
  }
}
```

---

## 3. BigQuery Data Warehouse Schema & Views

- **Dataset:** `portfolio-api-505006:events`
- **Partitioning:** `DAY on occurred_at (Permanent / Infinite Retention - No Expiration)`
- **Clustering:** `(local_user_id, event_type)`

### Views
1. `events.all_events`: Unified view UNIONing all domain event tables with an added `domain` column.
2. `events.user_activity`: User activity view extracting user identity profiles from event payloads.

---

## 4. Step-by-Step Guide to Onboard a New Application

### Step 1: Submit Integration Ticket (GitHub Issue)
Open an **[App Integration Request](https://github.com/fal3n-4ngel/monolith-dashboard/issues/new?template=app_integration_request.yml)** issue — it auto-populates onto the project board — specifying:
- **`sourceApp`**: Unique app ID string (e.g. `"my-new-app"`).
- **`Domain`**: Target domain (e.g. `"tasks"`, `"finance"`, `"analytics"`).
- **`DomainEventTypes`**: Event enums to allowlist (e.g. `"TASK_CREATED"`, `"TASK_COMPLETED"`).

### Step 2: Implement Postback Dispatcher in your App
Add non-blocking event dispatching using the standard postback structure:

```json
{
  "sourceApp": "my-new-app",
  "eventId": "uuid-string-here",
  "eventType": "TASK_COMPLETED",
  "userId": "user_uid_123",
  "itemCount": 1,
  "timestamp": 1787726400000,
  "payload": {
    "userEmail": "user@example.com",
    "environment": "production"
  }
}
```

### Step 3: Authenticate Postback Requests
Pass your platform API key or Google ID Token in the request header:
- `Authorization: Bearer <MONOLITH_API_KEY>` or `Authorization: Bearer <GOOGLE_ID_TOKEN>`
- Monolith validates the request, responds with `202 Accepted` instantly, and streams event records to BigQuery.
