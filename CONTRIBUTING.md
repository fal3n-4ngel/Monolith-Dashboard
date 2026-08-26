# Contributing to Monolith

Monolith is primarily a single-owner tool — the auth is locked to one Google account and the BigQuery
project is personal infrastructure. That said, issues and pull requests are genuinely welcome: bug reports,
new-app integration requests, docs fixes, and UI/UX improvements all help.

## Before you start

This repo ships a custom-built Next.js docs/MCP site, not a fork of a template — read
[`AGENTS.md`](AGENTS.md) if you're using an AI coding agent against this repo; it points at the vendored
Next.js docs under `node_modules/next/dist/docs/` for anything that behaves differently from what you'd
expect.

## Local setup

```bash
npm install
npm run dev      # http://localhost:3000 (marketing site) and /docs (reference)
```

Before opening a PR:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Where things live

- `components/landing/LandingPage.tsx` — marketing homepage.
- `components/MonolithDocs.tsx` — the `/docs` reference (sidebar, scroll-spy, prev/next paging).
- `app/globals.css` — design tokens (`--bg-primary`, `--text-primary`, `--accent`, etc.) and shared
  utilities (`ruler-x`/`ruler-y`, `dot-grid`, `crosshair`, `.animate-marquee`). Reuse these tokens instead
  of hardcoding hex colors in components.
- `lib/mcp/` — MCP tool implementations served at `/api/mcp`.
- `app/api/` — postback ingestion, GitHub telemetry, and auth routes.

## Coding conventions

- TypeScript strict mode; run `npx tsc --noEmit` before pushing.
- Tailwind v4 with CSS-based `@theme` config (no `tailwind.config.js`) — add new design tokens to
  `app/globals.css`, not inline arbitrary values, when a value is reused more than once.
- Client components are marked `"use client"` explicitly; keep server components server-only where
  possible (pages under `app/` default to server components unless they need hooks).
- Match the existing visual language: sharp corners, hairline `border-[var(--border-subtle)]` dividers,
  uppercase `font-mono` labels, `font-display` (Big Shoulders Display) for headline type.

## Filing an issue

Use the templates under **New Issue**:

- **App Integration Request** — onboarding a new `sourceApp` into the telemetry pipeline. See
  [`/docs`](app/docs/page.tsx) → *How to Add a New App* for the fields this needs.
- **Bug Report** — something in the site, MCP server, or ingestion pipeline is broken.
- **Feature Request** — anything else.

Issues filed against this repo auto-populate onto the project board, so there's no separate board access
to request.

## Pull requests

- Keep PRs scoped to one change — a UI fix, one new MCP tool, one bug fix.
- Reference the issue it closes (`Closes #123`) where applicable.
- Include before/after screenshots for UI changes.
