# Vector ATS Agent Reference

This file is a fast reference for agents working in this repository. Read this first, then search only the section or function relevant to the task instead of re-scanning `index.html`.

## 1. What This Application Is

- Product: `Vector ATS`
- Type: single-page Applicant Tracking System
- Stack: plain HTML + embedded CSS + embedded vanilla JavaScript
- Build tools: none
- Runtime: browser app served by a tiny Node static server
- Main entry point: `index.html`
- Dev server: `node serve.js`
- Local URL: `http://127.0.0.1:4173/`

Important constraints:

- Everything important lives in one large file: `index.html`
- There is no bundler, transpiler, or hot reload
- Refresh the browser manually after edits
- Data persists in IndexedDB and some UI/admin settings persist in `localStorage`
- The app uses a fixed seeded clock for consistency:
  - `NOW = new Date('2026-04-01T10:15:00+05:30')`

## 2. File Map

- `index.html`
  - Entire app: markup, CSS, JS, seeded data logic, rendering, drawers, modals, event handlers
- `serve.js`
  - Simple static server
  - Serves the newest of `index.html` or `ats.html`
- `__ats_check.js`
  - Large reference/check script with route labels, seed generation, validation-style helpers
- `__tmp_check.js`, `__tmp_client_check.js`
  - Temporary/reference scripts
- `__edge_verify*`, `__edge_dom.txt`, `edge_dom.txt`, `__edge_err.txt`
  - Browser verification output, not primary app code
- `AGENTS.md`
  - High-level repo guidance

## 3. Runtime Architecture

The app is implemented as one self-invoking script inside `index.html`.

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
  - database wrapper
- `A.cache`
  - in-memory arrays for each store
- `A.lu`
  - lookup maps derived from cache
- `A.ui`
  - current route, drawer, modal, search, sidebar, calendar state, per-route table state

Primary render flow:

- `page()`
  - chooses which top-level route renderer to run
- `shell(content)`
  - builds outer shell/sidebar/topbar
- `render()`
  - writes shell HTML, then renders drawer, modal, toasts, DnD, permissions
- `drawer()`
  - right-side workbench/drawer renderer
- `modal()`
  - centered modal renderer

State helpers to know:

- `state(k)`
  - per-route state bucket for query, filters, sorting, pagination, saved view, selected rows, active tab
- `activeFilters(k)`
- `clearSavedView(k)`

Permission helpers:

- `hasModulePermission(moduleKey, minLevel)`
- `canAccessRoute(route)`
- `visibleRoutes()`
- `ensureRouteAccess()`

## 4. Persistence Model

Primary persistence is IndexedDB. If IndexedDB is unavailable, the app falls back to local storage-style behavior in its DB wrapper.

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

Lookup building happens in `buildLookups()`. If data changes look wrong, inspect:

- `saveRow()`
- `replaceStoreRows()`
- `buildLookups()`
- seed/repair helpers near the top of the JS section

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

- public-style internal job browsing experience
- reads directly from `job_openings`
- only shows jobs with status `Open`
- application flow creates candidate + application records
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
- GDPR/consent state
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
- stage, source, owner, status filters
- bulk stage move
- bulk owner assign
- bulk reject
- client feedback
- schedule interview

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

### Assignments

Function: `assignments()`

This is one of the more specialized areas. It maps ATS workflows to staffing/placement concepts and includes Bullhorn-style parity notes.

Assignment workspace tabs:

- `work`
- `pipeline`
- `placement`
- `temp`

Assignment drawer tabs:

- `overview`
- `capability`
- `timeline`

Special purpose content:

- capability matrix for Bullhorn-aligned behaviors
- placement record workflows
- temp/contract workflows
- billing/pay/margin concepts
- document, payroll, renewal, shift, leave, timesheet concepts

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
- drag/drop style stage operations
- quick forward actions from current stage

High-value search tokens:

- `pipelineChartMarkup`
- `pipelineCard`
- `pipelineForwardAction`
- `data-a="pipelineForward"`

### Interviews

Function: `interviews()`

Capabilities:

- list and calendar workspace
- schedule/reschedule/cancel/complete interview
- interview drawer with overview + application context

High-value search tokens:

- `interviewWorkspaceState`
- `interviewListWorkspace`
- `interviewCalendarWorkspace`
- `interviewOverviewMarkup`
- `interviewReschedule`
- `interviewCancel`
- `interviewComplete`

### Offers

Function: `offers()`

Capabilities:

- offer grid
- accept / decline
- linked application context in drawer

High-value search tokens:

- `offerRows`
- `offerOverviewMarkup`
- `acceptOffer`
- `declineOffer`

### Clients

Function: `clients()`

Capabilities:

- client accounts
- parent/child hierarchy
- contacts
- opportunities
- BD tasks
- job order management
- collaboration / portal / reporting workspaces

Client drawer areas are broader than a simple overview and cover:

- account/contact management
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

### Reports

Function: `reports()`

Capabilities:

- system reports
- custom reports
- folders
- favorites
- scheduled reports
- deleted reports
- builder with fields/measures/related modules

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
- provider/integration settings
- governance/retention/duplicate-check rules
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
- quick add button
- responsive collapsed sidebar support

Search:

- `shell(`

### Drawers

- fixed right-side detail workspace
- many routes open records in a drawer rather than full-page navigation
- some drawers are wide/full

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

### Tables / Grids

- generic grid and compact grid helpers
- filtering, saved views, sorting, pagination, bulk actions

Search:

- `grid(`
- `compactGrid(`
- `chips(`
- `filterField(`
- `viewField(`

### Cards / Workbench Panels

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

Search points for event wiring:

- document event listeners near the bottom of `index.html`
- `data-a="candAction"`
- `document.addEventListener('click'`
- `document.addEventListener('change'`
- `document.addEventListener('input'`

If a button exists in markup but does nothing, inspect:

1. the button `data-a` and related `data-*` attributes
2. the delegated listener section near the end of the script
3. modal/form submit handling for the related `data-form`

## 8. Form Names You Will Likely Need

Frequently used `data-form` values:

- `candidate`
- `job`
- `submitCandidate`
- `assignment`
- `placementAssignment`
- `tempAssignment`
- `interview`
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

The app is not a minimal demo anymore. It models a broad recruiting/staffing domain, including:

- candidate sourcing and engagement
- compliance and onboarding states
- job distribution and publish states
- application stages and rejection reasons
- interview scheduling and review capture
- offers and hires
- client hierarchy, contacts, opportunities, and portal concepts
- assignment/placement/temp-contract workflows
- reports, saved views, and scheduled-report workspace
- role-based access and settings governance

Several advanced integrations are simulated rather than connected to real external systems. The UI/state is often complete even when the backend integration is mocked.

Examples of simulated-but-modeled areas:

- LinkedIn sync
- job board connectors
- WhatsApp/email/SMS provider flows
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

If the task is about assignments / staffing / Bullhorn parity:

- search `function assignments(`
- search `assignmentMatrixRows`
- search `requirementsMatrixRows`
- search `assignmentCapabilityDrawerMarkup`

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
- Preserve existing CSS variable usage and component naming patterns
- Prefer extending existing `data-a` action patterns over adding one-off listeners
- When adding drawer actions, check both button markup and delegated handler logic
- When adding new persisted fields, update:
  - modal form
  - save logic
  - row mappers / lookup builders if needed
  - drawer/grid renderers that should display the field
- Browser data may need clearing if a schema/seed change appears stale

## 12. What To Ignore Unless Needed

Usually ignore these unless the task is explicitly about verification or reference scripts:

- `__edge_verify/`
- `__edge_verify_client/`
- `__edge_verify_clients_clean/`
- `__edge_dom.txt`
- `edge_dom.txt`
- `__edge_err.txt`
- `temp.txt`
- `__tmp_check.js`
- `__tmp_client_check.js`

## 13. Recommended Starting Points

For most feature work:

1. Open `index.html`
2. Search for the route renderer or drawer markup for the affected area
3. Search for the related `data-a` action or `data-form`
4. Check whether the change also touches cache rows, lookups, or permissions
5. Refresh the browser after edits

This document should be updated whenever a major module, route, data store, or interaction pattern changes.
