## Branch & Safety
- Create a new working branch (ui-redesign-dashboards) off the current baseline you confirmed
- Keep baseline untouched; no changes to main until you approve a PR
- Add a backup tag at start and before PR to ensure instant rollback

## Implementation Scope
- Apply Figma designs exactly: Employee → Frame 1020; Client → MacBook Pro 14" – 2
- Keep all existing server actions, Sanity queries, auth, and routing intact
- No schema/data changes; purely UI/UX and layout

## Employee Dashboard (Frame 1020)
- Header: search & command pill with shortcut badge, user pill (name/email), icons
- Greeting hero: date, "Good Morning" line, tasks due count, CTA chips (Refresh/New Task/Help)
- Tasks List: table layout with status chips, due date formatting, pagination-ready
- Messages: compact “unread” section with recent previews
- Schedule: right panel rendering upcoming items from scheduleItem
- Sidebar: capability-driven items (Tasks, Schedule, Chats, Clients, Team, Documents, Finance, Settings)

## Client Dashboard (MacBook Pro 14" – 2)
- Hero banner: “What’s on your mind?” with search input + Submit CTA
- Requests list: status history, attachments, quick follow-up form
- Services grid: cards for channels (Instagram/Facebook/etc.), metrics placeholders from existing analytics queries
- Messages: support threads preview; role-appropriate visibility

## Shared Components & Theming
- Align tokens (globals.css) to Figma colors for pills, chips, borders, shadows
- Reuse Button, Card, Badge; add small variants for Figma pills/chips if needed
- Keep CommandPalette minimal; wire to existing links only (no new backend)

## Data & Auth
- Sanity client and queries unchanged; read-only UI for any missing data
- Auth (Google + credentials) left as-is; no changes to next-auth routes

## Verification
- Run dev server and validate:
  - /dashboard, /dashboard/employee, /dashboard/client
  - No console errors; actions remain functional
- Snapshot screenshots for before/after and parity with Figma

## Deliverables
- A PR from ui-redesign-dashboards with scoped commits (employee UI, client UI, shared components)
- Screenshots + short notes mapping each Figma section to implementation
- Zero changes to main until you approve

## Optional (Branding)
- If Sanity settings are missing, add temporary theme overrides so the preview matches your latest brand while we confirm the settings doc; remove overrides once settings are published

## Confirmation
- Confirm this plan and I’ll start immediately on ui-redesign-dashboards while keeping your baseline untouched.