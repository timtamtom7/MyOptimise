## Overview
Implement a content‑driven volunteering platform for Hong Kong using the initialized Schema UI + Next.js + Sanity project. Deliver browsing and viewing of events, simple volunteer sign‑up, organizations listing, and an editor approval workflow. Keep the UI calm and trustworthy, reusing Schema UI components.

## Architecture
- Data: Sanity Content Lake (dataset: `production`) with document types for `Event`, `Organization`, `Signup`, and `Sponsorship` (meal contributions).
- Frontend: Next.js App Router, pages under `app/` using `next-sanity` queries.
- Studio: Embedded at `/studio`, editors approve events before publish via status fields and simple document actions.
- Notifications: Resend email for confirmation and internal alerts (optional, minimal).

## Data Model (Sanity Schemas)
- Event
  - title, slug, date, time window, location, brief description
  - capacity, currentSignups (derived in app), organization (reference)
  - status: `draft | pending_review | approved | completed`
  - tags/category (for filters), images (optional)
- Organization
  - name, slug, description, contact, website, logo
- Signup (volunteer intent)
  - event (reference), name, email, phone (optional), timestamp, status: `received | confirmed | cancelled`
- Sponsorship (business meal donation intent)
  - organization/business name, contact email, mealsCount, date, pickup/delivery location, notes, status

## Pages & Routes (Next.js)
- `/events` — list approved upcoming events
  - Filter segmented button (e.g., All / Food / Elderly / Youth)
  - Simple card stack for events
- `/events/[slug]` — single event details
  - “Volunteer” CTA → minimalist sign‑up form (server action)
  - Confirmation page after submit
- `/organizations` — list organizations
- `/organizations/[slug]` — organization profile with related events
- Optional: `/sponsor` — minimalist form for meal‑sponsorship intent

## Queries & Types
- GROQ queries under `sanity/queries/event.ts` & `organization.ts` for:
  - Events list (approved + upcoming)
  - Single event by slug
  - Organizations list
  - Related events by organization
- Run `npx sanity typegen generate` to keep TypeScript types in sync.

## Studio Workflow (Approval)
- Editors create/modify events in Studio;
- Set `status` to `pending_review` → reviewer toggles to `approved` → only `approved` events display in the site.
- When event ends, set `completed` for archival pages.

## Volunteer Sign‑up (Server Action)
- Minimal fields: name, email, optional phone.
- Server action writes a `Signup` document linked to the `Event`.
- Optional: Resend email to volunteer (thanks) and to coordinators (new signup alert).
- Rate‑limit and basic validation; no dashboards.

## UI Components
- Segmented button for `/events` filters (reuse Schema UI patterns).
- Minimalist event sign‑up page (calm UI, clear consent copy).
- Simple card stack for event listing.

## Security & Config
- Use a dedicated write token for server actions (`SANITY_API_WRITE_TOKEN`) stored only in `.env.local` (server‑only usage), keep existing read token for preview.
- Confirm CORS for `http://localhost:3000` only.
- No client‑side exposure of write token; only used inside server actions.

## Implementation Steps
1. Housekeeping
   - Optionally move app from `Helping-Hand-Website` into root `HelpingHand` (if desired).
   - Verify `.env.local` and tokens; add `SANITY_API_WRITE_TOKEN` for server writes.
2. Schemas
   - Add `Event`, `Organization`, `Signup`, `Sponsorship` documents in `sanity/schemas/documents/` and register in `sanity/schema.ts`.
3. Queries & Types
   - Implement event/organization queries; run typegen.
4. Pages
   - Create `/events` and `/events/[slug]` with SSR data fetching; add segmented filters and card stack.
   - Create simple sign‑up form (server action) + thank‑you page.
   - Add `/organizations` and `/organizations/[slug]` listing.
5. Studio UX
   - Ensure status field visibility and default flows; optional simple action to set `approved`.
6. Notifications (optional, minimal)
   - Integrate Resend for a single transactional email on signup.
7. Verification
   - Seed sample content, run dev, verify: list, detail, submit, Studio approval.

## Deliverables
- New schemas, queries, and typed models
- `/events`, `/events/[slug]`, `/organizations`, `/organizations/[slug]`, `/sponsor` (optional)
- Minimalist volunteer sign‑up workflow with server action and confirmation
- Studio flow for event approval

## Acceptance Criteria
- Browsing events shows only `approved` future events.
- Event page renders details and submits a signup that appears in Studio.
- Organizations listing and detail pages render from Sanity.
- Studio approval toggles control visibility; no errors at `/studio` or app routes.

## Next Action
Reply “Proceed” and I’ll implement the schemas, queries, pages, sign‑up flow, and optional email, then run and verify locally. 