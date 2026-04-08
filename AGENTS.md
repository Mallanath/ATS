# Vector ATS Development Guide

## Project Overview
Single-page Applicant Tracking System (ATS) built as a vanilla JavaScript application with embedded CSS and no build tools.
Read `read.md` first before exploring `index.html`.

## Development Setup

### Run Development Server
```bash
node serve.js
```
- Serves at `http://127.0.0.1:4173/`
- Entry point: `index.html` (also checks `ats.html`)
- No hot reload - refresh browser manually after changes

### File Structure
- **`index.html`**: Main application (HTML + CSS + JavaScript, ~5600 lines)
- **`serve.js`**: Static file server
- **`__ats_check.js`** / **`__tmp_check.js`**: Data validation/generation scripts
- **`__edge_verify*` directories**: Browser verification data (ignore for app development)

## Architecture Notes

### Database Layer
- Uses **IndexedDB** (`vector_ats_html_v1`)
- Key stores: `users`, `candidates`, `applications`, `interviews`, `offers`, `tasks`
- Data seeded with `NOW = new Date('2026-04-01T10:15:00+05:30')`

### UI Patterns
- **Drawer system**: Fixed right panel for detail views (`class="drawer"`)
- **Modal system**: Centered overlay (`class="scrim"`)
- **Tabs**: Horizontal tab navigation (`class="tabs"`)
- **Grid layouts**: 12-column grid system (`.p5`, `.p6`, `.p7`, `.p12`)

### CSS Conventions
- CSS custom properties in `:root` (`--brand`, `--ok`, `--warn`, `--bad`, etc.)
- Component classes: `.kpi`, `.panel`, `.wb`, `.card`, `.list`, `.mr`
- State classes: `.ok`, `.warn`, `.bad`, `.info`, `.neu` (for pills/status)
- Use `class="pill ok"` for status indicators

### JavaScript Patterns
- Global state: `A.ui` for UI state, `A.cache` for data, `A.lu` for lookup maps
- Event handling: `data-a` attribute for actions (e.g., `data-a="candAction" data-kind="sendMail"`)
- Markup generation: Template literals with `esc()` for escaping
- State management: `state(k)` returns per-route state object

## Common Tasks

### Adding a Button to Candidate Actions
1. Find `candidateActions=` in `index.html` (line ~4023)
2. Add button with `data-a="candAction" data-kind="yourAction"`
3. Handle action in switch statement (search for `case 'yourAction'`)

### Modifying Drawer Header
1. Locate `workbenchDrawerHeader()` function (line ~3988)
2. Modify `info` array for buttons/text in header
3. Modify `actions` string for action buttons

### Updating CSS
1. Search for existing class names first
2. CSS is in `<style>` tag at top of `index.html`
3. Use CSS custom properties for colors (`var(--brand)`, etc.)

### Adding New Routes
1. Add to `ROUTES` array in `__ats_check.js` or `__tmp_check.js`
2. Add label to `LABEL` object
3. Add route handler in main switch statement

## Important Conventions

### Button Styling
- Primary: `class="btnp"` (brand color)
- Default: `class="btn"` (outlined)
- Danger: `class="btnd"` (red)

### Status Pills
- Use `class="pill ok"` for positive status
- Use `class="pill warn"` for pending/warning
- Use `class="pill bad"` for negative status
- Use `class="pill info"` for informational

### Event Handling
- All actions use `data-a` attribute
- Candidate actions: `data-a="candAction" data-kind="[action]"`
- Navigation: `data-a="tab"` with `data-m` (module) and `data-tab`
- Search: `data-a="search"`

### Data IDs
- Format: `[prefix]_[number]` (e.g., `usr_01`, `cand_042`, `app_123`)
- Use `nextId(prefix, n)` helper to generate IDs

## Gotchas

1. **No build step**: Changes to `index.html` require browser refresh
2. **Embedded everything**: CSS/JS/HTML in single file - no separate files
3. **Browser storage**: Data persists in IndexedDB, clear via DevTools if needed
4. **Fixed date**: App uses `NOW = new Date('2026-04-01...')` for consistency
5. **Edge directories**: `__edge_verify*` folders are browser data, not app code
