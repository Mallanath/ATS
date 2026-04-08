# Vector ATS Agent Reference

This file is the quickest way to orient yourself in this repository. Read it first, then jump directly to the area you need instead of re-scanning all of `index.html`.

## 1. What This Application Is

- Product: `Vector ATS`
- Type: single-page Applicant Tracking System
- Stack: plain HTML + embedded CSS + embedded vanilla JavaScript
- Build tools: none
- Runtime: browser app served by a small Node static server
- Main entry point: `index.html`
- Dev server: `node serve.js`
- Local URL: `http://127.0.0.1:4173/`

Important constraints:

- Nearly all real app logic lives in one large file: `index.html`
- There is no bundler, transpiler, or hot reload
- Refresh manually after edits
- Data persists in IndexedDB and some UI/admin settings persist in `localStorage`
- The app uses a fixed seeded clock:
  - `NOW = new Date('2026-04-01T10:15:00+05:30')`

## 2. File Map

- `index.html`
  - Entire app: markup, CSS, JS, seed data, renderers, drawers, modals, event handlers
  - Currently roughly 7k lines
- `serve.js`
  - Small static server
  - Serves the newest of `index.html` or `ats.html`
  - Sends no-cache headers to avoid stale refreshes
- `AGENTS.md`
  - Short repo-level development guide
- `__ats_check.js`, `__tmp_check.js`, `temp_check.js`
  - Reference and validation-style scripts
- `__edge_verify*`
  - Browser verification output, not primary application code
- `corrupted_index.html`, `diff*.txt`, `recover.js`, `_patch*.js`, `fix.js`, `script.js`
  - Recovery or scratch artifacts; inspect only if the task is specifically about repair history

## 3. Runtime Architecture

The app is implemented as a single self-invoking script inside `index.html`.

Core runtime constants:

- `STORES`
- `NEED`
- `DB_NAME = 'vector_ats_html_v1'`
- `DB_VERSION = 3`
- `META = 'vector_ats_meta_v1'`
- `SEED = '2026-04-04-restore'`
- `SAVED_VIEW_VERSION = '2026-04-04-restore-views'`
- `ROUTES`
- `LABEL`
- `A`

Global app container:

- `A.db`
  - IndexedDB wrapper
- `A.cache`
  - in-memory arrays for each store
- `A.lu`
  - lookup maps derived from cache
- `A.ui`
  - current route, drawer, modal, search, sidebar, calendar, and per-route state

Primary render flow:

- `page()`
  - selects the top-level route renderer
- `shell(content)`
  - builds the outer shell, sidebar, and topbar
- `render()`
  - writes shell HTML, then drawer, modal, toasts, DnD, and permissions UI
- `drawer()`
  - right-side detail/workbench renderer
- `modal()`
  - centered modal renderer

State helpers to know:

- `state(k)`
  - route-level state bucket for query, filters, sorting, pagination, saved view, selected rows, and active tab
- `activeFilters(k)`
- `clearSavedView(k)`

Permission helpers:

- `hasModulePermission(moduleKey, minLevel)`
- `canAccessRoute(route)`
- `visibleRoutes()`
- `ensureRouteAccess()`

## 4. Persistence Model

Primary persistence is IndexedDB. If IndexedDB is unavailable, the DB wrapper falls back to a more limited local-storage-style behavior.

Object stores:

- `users`
- `departments`
- `clients`
- `contacts`
- `opportunities`
- `job_openings`
- `candidates`
- `applications`
- `assignments`
- `pipeline_stages`
- `workflows`
- `interviews`
- `assessments`
- `reviews`
- `tasks`
- `activity_log`
- `notes`
- `offers`
- `hires`
- `saved_views`
- `reports`
- `rejection_reasons`

Seeded baseline volumes from `NEED`:

- `users`: 8
- `departments`: 6
- `clients`: 12
- `contacts`: 20
- `job_openings`: 35
- `candidates`: 300
- `applications`: 420
- `assignments`: 180
- `interviews`: 120
- `assessments`: 45
- `reviews`: 80
- `tasks`: 250
- `activity_log`: 700
- `offers`: 18
- `hires`: 9
- `saved_views`: 12
- `reports`: 10

Lookup rebuilding happens in `buildLookups()`. When saved rows do not appear correctly, inspect:

- `saveRow()`
- `replaceStoreRows()`
- `buildLookups()`
- seed and repair helpers near the top of the JS section

## 5. Main Routes and What They Do

Routes:

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

### Dashboard

Function: `dashboard()`

Purpose:

- KPI summary
- funnel snapshot
- source effectiveness
- recent activity
- jobs needing attention
- recruiter workload

### Career Portal

Function: `careerPortal()`

Purpose:

- public-style internal jobs browsing experience
- reads directly from `job_openings`
- only shows jobs with status `Open`
- application flow creates candidate and application records
- source attribution is saved as career site / portal

Search here when working on:

- portal UI
- self-apply flow
- source tracking for portal candidates

### Candidates

Function: `candidates()`

Core capabilities:

- searchable/filterable candidate grid
- saved views
- duplicate detection and merge
- source tracking
- GDPR and consent state
- RTW, screening, portal, background, signature, redeployment states
- owner assignment
- inline submission to jobs

Candidate drawer tabs:

- `overview`
- `profile`
- `sourcing`
- `engagement`
- `compliance`
- `notes`
- `timeline`

Important candidate actions:

- send email
- send SMS
- send WhatsApp
- schedule interview
- attach file
- toggle extra details

High-value search tokens:

- `candidateRows`
- `candidateWorkspaceOverviewMarkup`
- `candidateProfileDatabaseMarkup`
- `candidateSourcingSearchMarkup`
- `candidateEngagementMarkup`
- `candidateComplianceOnboardingMarkup`
- `candidateNotesMarkup`
- `candidateActivityMarkup`
- `candidateActions=`
- `data-a="candAction"`

### Jobs

Function: `jobs()`

Core capabilities:

- job grid
- create/edit requisition
- AI brief generation
- job distribution
- publish/unpublish
- hold/close/cancel/reopen

Job drawer tabs:

- `overview`
- `matching`
- `applications`
- `activity`

High-value search tokens:

- `jobRows`
- `jobOverviewMarkup`
- `jobMatchingMarkup`
- `jobActivityPanel`
- `togglePublish`
- `jobStatus`
- `jobAiGenerate`
- `jobDistribution`

### Applications

Function: `applications()`

Core capabilities:

- application grid
- stage, source, owner, and status filters
- bulk stage move
- bulk owner assign
- bulk reject
- client feedback
- schedule interview
- create submittals, offers, and placements

Application drawer tabs:

- `summary`
- `interviews`
- `notes`
- `activity`

High-value search tokens:

- `applicationRows`
- `applicationOverviewMarkup`
- `bulkStage`
- `bulkOwner`
- `bulkReject`
- `applicationFeedback`
- `applicationSubmittal`
- `applicationOffer`
- `applicationPlacement`

### Assignments

Function: `assignments()`

This is a specialized area that maps ATS workflows to staffing and placement concepts, including Bullhorn-style parity notes.

Assignment workspace tabs:

- `work`
- `pipeline`
- `placement`
- `temp`

Assignment drawer tabs:

- `overview`
- `capability`
- `timeline`

Special-purpose content:

- capability matrix for Bullhorn-aligned behaviors
- placement record workflows
- temp and contract workflows
- billing, pay, and margin concepts
- documents, payroll, renewal, shift, leave, and timesheet concepts

High-value search tokens:

- `assignmentWorkspaceState`
- `assignmentWorkspaceTabs`
- `assignmentWorkspaceConfig`
- `assignmentOverviewMarkup`
- `assignmentCapabilityDrawerMarkup`
- `assignmentMatrixRows`
- `requirementsMatrixRows`

### Pipeline

Function: `pipeline()`

Purpose:

- kanban-like pipeline by stage
- global or job-specific pipeline view
- quick-forward actions from current stage

High-value search tokens:

- `pipelineChartMarkup`
- `pipelineCard`
- `pipelineForwardAction`
- `data-a="pipelineForward"`

### Interviews

Function: `interviews()`

Capabilities:

- list and calendar workspaces
- schedule/reschedule/cancel/complete interview
- video provider flow and interview-type chooser
- interview drawer with overview and application context

High-value search tokens:

- `interviewWorkspaceState`
- `interviewListWorkspace`
- `interviewCalendarWorkspace`
- `interviewOverviewMarkup`
- `interviewReschedule`
- `interviewCancel`
- `interviewComplete`
- `videoProceed`

### Offers

Function: `offers()`

Capabilities:

- offer grid
- create/edit offer
- accept/decline
- generate offer documents
- linked application context in drawer actions

High-value search tokens:

- `offerRows`
- `offerOverviewMarkup`
- `acceptOffer`
- `declineOffer`
- `offerDocumentGenerator`

### Clients

Function: `clients()`

Capabilities:

- client accounts
- parent/child hierarchy
- contacts
- opportunities
- BD tasks
- job order management
- collaboration, portal, and reporting workspaces

Client drawer areas cover:

- account and contact management
- business development
- jobs
- collaboration
- schema/reference views

High-value search tokens:

- `clientRows`
- `CLIENT_DRAWER_TABS`
- `clientOverviewMarkup`
- `clientContactsMarkup`
- `clientBusinessDevelopmentMarkup`
- `clientJobOrderManagementMarkup`
- `clientCollaborationMarkup`

### Platform

Function search token: `function platform`

Purpose:

- platform-level operational workspace separate from client management and settings
- useful when the task is not purely end-user configuration but broader operational administration

Search here when working on:

- global platform views
- operational controls not housed under `settings`

### Reports

Function search token: `renderReportsModule`

Capabilities:

- system reports
- custom reports
- folders
- favorites
- scheduled reports
- recently deleted reports
- builder with fields, measures, and related modules

High-value search tokens:

- `renderReportsModule`
- `SYSTEM_REPORT_DEFINITIONS`
- `REPORT_FOLDER_DEFINITIONS`
- `REPORT_BUILDER_MODULES`
- `REPORT_BUILDER_FIELDS`
- `reportCreateCustom`
- `reportBuilderState`

### Settings

Function: `settings()`

Settings tabs:

- `general`
- `automation`
- `integrations`
- `governance`
- `access`

Capabilities:

- platform defaults
- workflow defaults
- automation toggles
- provider and integration settings
- governance, retention, and duplicate-check rules
- user and role access management

High-value search tokens:

- `settingsState`
- `settingsGeneralView`
- `settingsAutomationView`
- `settingsIntegrationsView`
- `settingsGovernanceView`
- `settingsAccessView`
- `ACCESS_ROLE_LIBRARY`
- `ACCESS_PERMISSION_GROUPS`

## 6. Major UI Patterns

### Shell

- left sidebar modules
- top search bar
- quick-add button
- responsive collapsed sidebar

Search:

- `shell(`

### Drawers

- fixed right-side detail workspace
- many routes open records in a drawer instead of navigating full-page
- some drawers are wider workbench-style panels

Search:

- `drawer()`
- `workbenchDrawerHeader`
- `workbenchTabsMarkup`

### Modals

- centered scrim overlay
- most create/edit flows are form modals

Search:

- `modal()`
- `data-form="`

### Tables and Grids

- `grid(...)` and `compactGrid(...)`
- filtering, saved views, sorting, pagination, bulk actions

Search:

- `grid(`
- `compactGrid(`
- `chips(`
- `filterField(`
- `viewField(`

### Cards and Panels

Common building blocks:

- `.panel`
- `.kpi`
- `.wb`
- `.card`
- `.list`
- `.mr`
- `.pill`

## 7. Event and Action Conventions

Most interactions are delegated through `data-a` attributes.

Common patterns:

- navigation: `data-a="nav"`
- tabs: `data-a="tab"`
- drawer open: `data-a="drawer"`
- modal open: `data-a="modal"`
- candidate actions: `data-a="candAction"`
- workspace filters and mode switches: route-specific `data-a` values like `settingsTab`, `reportFolder`, `assignmentWorkspaceTab`, `interviewWorkspaceTab`

Search points for event wiring:

- the delegated `document.addEventListener('click', async e => { ... })` block near the bottom of `index.html`
- `document.addEventListener('change'`
- `document.addEventListener('input'`

If a button exists in markup but does nothing, inspect:

1. the element's `data-a` and related `data-*` attributes
2. the delegated listener section near the end of the file
3. modal/form submit handling for the corresponding `data-form`

## 8. Form Names You Will Likely Need

Frequently used `data-form` values:

- `candidate`
- `job`
- `submitCandidate`
- `assignment`
- `placementAssignment`
- `tempAssignment`
- `interview`
- `offer`
- `mergeCandidate`
- `candidateAttachment`
- `candidateTask`
- `candidateIntegration`
- `candidateBulkCampaign`
- `applicationClientFeedback`
- `careerPortalApply`
- `client`
- `clientContact`
- `clientOpportunity`
- `clientTask`
- `platform`
- `saveview`

Settings forms:

- `settingsGeneral`
- `settingsAutomation`
- `settingsIntegrations`
- `settingsGovernance`
- `settingsUserAccess`
- `settingsAccessPolicy`

## 9. Data and Domain Notes

The app models a broad recruiting and staffing domain, including:

- candidate sourcing and engagement
- compliance and onboarding states
- job distribution and publish states
- application stages and rejection reasons
- interview scheduling and review capture
- offers and hires
- client hierarchy, contacts, opportunities, and portal concepts
- assignment, placement, and temp-contract workflows
- reports, saved views, and scheduled-report workspace
- role-based access and settings governance

Several advanced integrations are simulated rather than connected to real external systems. The UI/state is often complete even when the backend integration is mocked.

Examples of simulated-but-modeled areas:

- LinkedIn sync
- job board connectors
- WhatsApp, email, and SMS provider flows
- candidate AI matching
- resume parsing
- screening providers
- digital signing
- external calendar sync

## 10. Search Guide for Agents

Use this section to jump directly to the right part of `index.html`.

If the task is about candidate fields or candidate detail UI:

- search `function candidates(`
- search `candidateRows`
- search `candidateProfileDatabaseMarkup`
- search `candidateActions=`

If the task is about candidate outreach or integration flows:

- search `data-a="candAction"`
- search `candidateIntegration`
- search `candidateBulkCampaign`
- search `logCandidateEngagement`

If the task is about jobs:

- search `function jobs(`
- search `jobOverviewMarkup`
- search `jobMatchingMarkup`
- search `jobActivityPanel`

If the task is about stage movement or application logic:

- search `function applications(`
- search `bulkStage`
- search `bulkReject`
- search `pipeline(`

If the task is about offers or hiring handoff:

- search `function offers(`
- search `offerDocumentGenerator`
- search `acceptOffer`
- search `declineOffer`

If the task is about assignments / staffing / Bullhorn parity:

- search `function assignments(`
- search `assignmentMatrixRows`
- search `requirementsMatrixRows`
- search `assignmentCapabilityDrawerMarkup`

If the task is about platform administration:

- search `platform`
- search `data-form="platform"`

If the task is about reports:

- search `renderReportsModule`
- search `SYSTEM_REPORT_DEFINITIONS`
- search `REPORT_BUILDER_FIELDS`

If the task is about access or settings:

- search `function settings(`
- search `ACCESS_ROLE_LIBRARY`
- search `hasModulePermission`
- search `settingsAccessView`

If the task is about data shape or seed behavior:

- search `const STORES`
- search `const NEED`
- search `function buildSeed(`
- search `function buildLookups(`

If the task is about drawer behavior:

- search `function drawer(`
- search `workbenchDrawerHeader`
- search `workbenchTabsMarkup`

If the task is about modals or form submission:

- search `function modal(`
- search `data-form="`

## 11. Safe Working Notes

- Do not split the app into multiple files unless explicitly asked
- Preserve existing CSS variables, component naming, and `data-a` event patterns
- When adding drawer actions, update both the button markup and delegated event logic
- When adding new persisted fields, update:
  - the modal form
  - save logic
  - row mappers / lookup builders when needed
  - drawer/grid renderers that should expose the field
- Browser data may need clearing if schema or seed behavior appears stale

## 12. What To Ignore Unless Needed

Usually ignore these unless the task is explicitly about verification or recovery:

- `__edge_verify/`
- `__edge_verify_client/`
- `__edge_verify_clients_clean/`
- `__server_out.log`
- `__server_err.log`
- `corrupted_index.html`
- `diff.txt`
- `diff_utf8.txt`
- `tmp_1294.txt`
- `_patch_fix.js`
- `_patch_temp.js`

## 13. Recommended Starting Points

For most feature work:

1. Open `index.html`
2. Search for the route renderer or drawer markup for the affected area
3. Search for the related `data-a` action or `data-form`
4. Check whether the change also touches cache rows, lookups, permissions, or seed/repair helpers
5. Refresh the browser after edits

Update this document whenever a major route, data store, or interaction pattern changes.
