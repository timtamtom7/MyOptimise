# Detailed Technical Plan: Implementing the Guide

This document outlines the step-by-step technical plan to transform the Optimise platform into the Strategist/Editor model described in `guide.md`.

## Phase 1: Foundation & Data Structure (The "Brief" Engine)
**Goal:** Create the database structures needed to support the new "Assembly Line" workflow.

1.  **New User Role: `EDITOR`**
    *   Update database schema (Prisma/Supabase) to include `EDITOR` role.
    *   Ensure `EDITOR` permissions are highly restricted (cannot see financials, client lists, or strategy docs).
2.  **New Data Object: `BRIEF`**
    *   Create a `Brief` table in the database.
    *   **Fields:**
        *   `Title` (String)
        *   `Hook` (String)
        *   `Script` (Text)
        *   `VisualDirection` (Text)
        *   `AssetsURL` (Link to cloud storage)
        *   `Status` (Draft -> Assigned -> In Review -> Client Review -> Approved -> Scheduled)
        *   `AssignedTo` (Relation to Editor)
        *   `CreatedBy` (Relation to Strategist)
        *   `Price` (Decimal, for pay-per-deliverable tracking)
3.  **New Data Object: `DELIVERABLE`**
    *   The actual file uploaded by the Editor linked to a `Brief`.
    *   Supports versioning (V1, V2, Final).

## Phase 2: The Strategist Workspace (The "Architect" View)
**Goal:** Give Strategists the tools to research and create Briefs efficiently.

1.  **AI Research Assistant Integration**
    *   Build the "Research" Tab.
    *   Connect to AI API (OpenAI/Anthropic).
    *   **Features:**
        *   *Trend Finder:* Input Niche -> Output Top 5 Content Pillars.
        *   *Hook Generator:* Input Topic -> Output 10 Viral Hooks.
    *   **Output:** One-click "Convert to Brief" button from AI suggestions.
2.  **The Brief Builder UI**
    *   A clean form to create a Brief.
    *   Fields for Hook, Script, Visuals.
    *   "Assign to Editor" dropdown (select specific Editor or "Open Pool").
3.  **Internal Review Dashboard**
    *   A Kanban board showing Briefs in "Internal Review."
    *   Video player to watch Editor uploads.
    *   Feedback box (comments sent back to Editor).
    *   "Approve for Client" button.

## Phase 3: The Editor Workspace (The "Builder" View)
**Goal:** A stripped-down, focused interface for execution.

1.  **The "Job Board"**
    *   A simple list of assigned Briefs.
    *   Status indicators (New, In Progress, Feedback Received).
2.  **The Workspace Detail View**
    *   When clicking a job:
        *   Read-only view of the Brief (Hook, Script, Visuals).
        *   Download button for Assets.
        *   **Upload Portal:** Drag-and-drop zone for the finished video file.
3.  **Payment Tracker (Personal)**
    *   Simple view: "Jobs Completed this Month" -> "Estimated Pay."

## Phase 4: The Client Experience (The "Quiet" View)
**Goal:** Simplify client interaction and enforce platform usage.

1.  **Approval Queue**
    *   A gallery view of "Pending Approvals."
    *   Simple "Approve" or "Request Changes" buttons.
    *   Comment threads linked specifically to that content piece.
2.  **Service Request Portal**
    *   "Request Add-on" button (e.g., "I need an Email Blast").
    *   Creates a ticket for the Strategist.
3.  **Live Analytics Dashboard**
    *   Integrate Social Media APIs (Instagram, LinkedIn, etc.).
    *   Auto-populate charts: Reach, Engagement, Follower Growth.
    *   Remove manual monthly reporting needs.

## Phase 5: The Admin Command Center (The "Owner" View)
**Goal:** High-level oversight and automation.

1.  **The "God Mode" Dashboard**
    *   **Pipeline Health:** How many briefs are stuck? Which Editor is slow?
    *   **Client Health:** Who hasn't posted in 3 days? (Red Flag Alerts).
2.  **AI Oversight Logs**
    *   As requested in the master spec: A log of all AI usage by Strategists to ensure quality.
3.  **Financial Automation**
    *   **Editor Payouts:** Auto-calculate total due to Editors based on completed Briefs.
    *   **Client Invoicing:** Auto-generate invoices based on active subscriptions + approved add-ons.

## Execution Order (Immediate Next Steps)
To achieve this without breaking the current live site:

1.  **Database Migration:** Add `Brief` and `Editor` schemas.
2.  **Editor View Construction:** Build the `client-view.tsx` equivalent for Editors (`editor-view.tsx`).
3.  **Strategist Brief Tool:** Build the form to create data for the Editor view.
4.  **Connect the Pipes:** Ensure a Brief created by a Strategist appears in the Editor's view.
