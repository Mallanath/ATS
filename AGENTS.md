# Vector ATS Development Guide

## Project Overview
Single-page Applicant Tracking System (ATS) built in plain HTML, embedded CSS, and embedded vanilla JavaScript with no build tools.
Read `read.md` first before exploring `index.html`.

## Development Setup

### Run Development Server
```bash
node serve.js
```
- Serves at `http://127.0.0.1:4173/`
- Entry requests (`/`, `/index.html`, `/ats.html`) resolve to the newest of `index.html` or `ats.html`
- No hot reload; refresh the browser manually after changes

### File Structure
- **`index.html`**: Main application (HTML + CSS + JavaScript, currently ~7040 lines)
- **`serve.js`**: Static file server with no-cache headers
- **`read.md`**: Expanded agent/reference guide for navigating the app
- **`__ats_check.js`**, **`__tmp_check.js`**, **`temp_check.js`**: Reference and validation-style helper scripts
- **`__edge_verify*` directories**: Browser verification data; ignore for normal app work
- **Scratch / recovery files** such as `corrupted_index.html`, `diff*.txt`, `_patch*.js`, `recover.js`: repository artifacts, not runtime app modules

## Architecture Notes

### Database Layer
- Uses **IndexedDB** with `DB_NAME = 'vector_ats_html_v1'`
- Current schema version is `DB_VERSION = 3`
- Metadata keys include `META = 'vector_ats_meta_v1'`
- Seed markers are `SEED = '2026-04-04-restore'` and `SAVED_VIEW_VERSION = '2026-04-04-restore-views'`
- Fixed seeded clock: `NOW = new Date('2026-04-01T10:15:00+05:30')`

### Core Stores
- Main stores include `users`, `departments`, `clients`, `contacts`, `opportunities`, `job_openings`, `candidates`, `applications`, `assignments`, `pipeline_stages`, `workflows`, `interviews`, `assessments`, `reviews`, `tasks`, `activity_log`, `notes`, `offers`, `hires`, `saved_views`, `reports`, `rejection_reasons`

### UI Patterns
- **Drawer system**: fixed right-side detail workbench (`class="drawer"`)
- **Modal system**: centered scrim overlays (`class="scrim"`)
- **Tabs**: horizontal navigation for drawers and workspace subviews (`class="tabs"`)
- **Grid layouts**: 12-column helpers such as `.p5`, `.p6`, `.p7`, `.p12`
- **Workbench panels**: `.panel`, `.kpi`, `.wb`, `.card`, `.list`, `.mr`

### JavaScript Patterns
- Global state lives under `A`
- `A.ui`: route, drawer, modal, search, sidebar, calendar, route-specific UI state
- `A.cache`: cached rows from IndexedDB
- `A.lu`: derived lookup maps
- `state(k)`: returns a route-level UI state bucket
- Markup is generated with template literals and escaped using `esc()`
- Most interactions are delegated through `data-a` attributes

## Current Main Routes
- `dashboard`
- `career-portal`
- `candidates`
- `jobs`
- `applications`
- `assignments`
- `pipeline`
- `interviews`
- `offers`
- `clients`
- `platform`
- `reports`
- `settings`

## Common Tasks

### Adding a Candidate Action
1. Search `candidateActions=` in `index.html`
2. Add a button with `data-a="candAction" data-kind="yourAction"`
3. Wire the behavior in the delegated click handler near the bottom of `index.html`

### Modifying the Drawer Header
1. Search `workbenchDrawerHeader`
2. Update the `info` array for badges or metadata
3. Update the `actions` markup for buttons

### Updating CSS
1. Search for an existing class before adding a new one
2. CSS lives in the top `<style>` block inside `index.html`
3. Prefer CSS custom properties such as `var(--brand)`, `var(--ok)`, `var(--warn)`, `var(--bad)`

### Adding or Updating Routes
1. Check `const ROUTES` and `const LABEL` in `index.html`
2. Add or update the corresponding route renderer function
3. Verify navigation, permissions, and any drawer/modal entry points that reference the route

## Important Conventions

### Button Styling
- Primary: `class="btnp"`
- Default: `class="btn"`
- Danger: `class="btnd"`

### Status Pills
- Positive: `class="pill ok"`
- Warning/pending: `class="pill warn"`
- Negative: `class="pill bad"`
- Informational: `class="pill info"`
- Neutral: `class="pill neu"`

### Event Handling
- Most actions use `data-a`
- Candidate actions use `data-a="candAction"` plus `data-kind`
- Navigation uses `data-a="nav"`
- Drawer tabs use `data-a="tab"`
- Search controls commonly use `data-a="search"`

### Data IDs
- IDs generally follow `[prefix]_[number]` such as `usr_01`, `cand_042`, `app_123`
- Use existing helpers like `pad()` and `nextId(...)` patterns rather than inventing a new format

## Working Notes
- No build step; edit and refresh
- The app is intentionally single-file; do not split it unless explicitly asked
- Browser data persists in IndexedDB and some settings in `localStorage`
- If schema or seed behavior looks stale, clear browser storage or use the app reset path
- Ignore `__edge_verify*` directories unless the task is specifically about verification output
