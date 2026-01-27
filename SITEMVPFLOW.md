# MVP FLOW: Site Architecture & Design Plan

**Vision:** A highly professional, luxury, and distraction-free workflow interface for Strategists, Editors, and Clients. The design prioritizes clarity, focus, and elegance, separating the "production factory" from the "business administration" of the main app.

---

## 1. Design System: "Silent Luxury"

The aesthetic is minimal, typographic, and content-first. It relies on whitespace and subtle interactions rather than dense navigation or heavy colors.

### **Typography**
*   **Headings:** `Instrument Serif` (via `font-display`). Elegant, editorial, authoritative. Used for page titles, section headers, and key metrics.
*   **Body/UI:** `Inter` (via `font-sans`). Clean, legible, neutral. Used for inputs, buttons, and dense data.

### **Color Palette**
*   **Backgrounds:**
    *   Light: `bg-slate-50` (Paper-like warmth, not harsh white).
    *   Dark: `bg-slate-950` (Deep charcoal, not pure black).
*   **Surface:**
    *   Light: `bg-white` with `shadow-sm` or `border-slate-100`.
    *   Dark: `bg-slate-900` with `border-slate-800`.
*   **Accents:**
    *   **Action:** Deep Black (`text-slate-900`) / Pure White (`text-white`).
    *   **Status:** Muted pastels (e.g., `bg-emerald-50 text-emerald-700` for success). No neon or high-saturation alerts.

### **Interaction Principles**
*   **Focus:** One primary action per screen when possible.
*   **Feedback:** Instant server-side validation with smooth client-side state updates.
*   **Motion:** Subtle `duration-200` fades and slides. No bouncy or aggressive animations.

---

## 2. Site Architecture (`/flow`)

The Flow app exists in a parallel route group, isolated from the main dashboard's layout and navigation.

**Root:** `/flow` (Smart Redirector based on User Role)

### **A. Manager / Strategist Flow** (`/flow/manager`)
*Concept: "The Strategy Deck"*
*   **Purpose:** High-level oversight, planning, and quality control.
*   **Key Views:**
    1.  **The Deck (Dashboard):** A grid of active Client Campaigns.
    2.  **Campaign View:**
        *   **Strategy Tab:** Text-heavy, editorial view of the strategy (Hook, Pillars, Tone).
        *   **Briefing Board:** Create/Edit brief cards. Drag-and-drop to "Ready for Editor".
        *   **Review Queue:** List of submitted deliverables requiring approval before client view.
    3.  **Create Brief Modal:** A focused, step-by-step wizard to ensure quality briefs.

### **B. Editor Flow** (`/flow/editor`) — *Phase 1 Implemented*
*Concept: "The Job Board"*
*   **Purpose:** Execution and delivery. Zero admin noise.
*   **Key Views:**
    1.  **Job Board:**
        *   **Available Jobs:** List of unassigned briefs with price/deadline.
        *   **My Active Jobs:** Work currently in progress.
    2.  **Job Detail (Modal/Slide-over):**
        *   Clear requirements (Script, Visuals).
        *   **Submission Portal:** Simple URL input + Notes.
    3.  **History:** List of completed/paid jobs.

### **C. Client Flow** (`/flow/client`)
*Concept: "The Approval Stream"*
*   **Purpose:** Frictionless review and approval.
*   **Key Views:**
    1.  **The Stream:** A vertical feed of deliverables ready for review.
    2.  **Review Mode:**
        *   Video Player / Image Viewer (Center).
        *   **Action Bar:** "Approve" (One click) or "Request Changes" (Simple text input).
    3.  **Archive:** Searchable gallery of approved assets.

---

## 3. Implementation Plan

### **Phase 1: Editor Flow (Completed ✅)**
*   [x] Route isolation (`/flow/editor`).
*   [x] Job Board UI (Available/Assigned).
*   [x] Claim/Submit Actions.
*   [x] Status Updates.

### **Phase 2: Manager Flow (Next 🚧)**
*   [ ] **Dashboard:** Fetch all active campaigns from Sanity.
*   [ ] **Campaign View:** Display Strategy fields + Briefs list.
*   [ ] **Briefing Tool:** Simplified form to create `deliverable` documents.
*   [ ] **Review Interface:** View submitted links, "Approve for Client" or "Return to Editor".

### **Phase 3: Client Flow**
*   [ ] **Stream UI:** Fetch deliverables with status `client_review`.
*   [ ] **Review Actions:** Connect `approveDeliverable` and `rejectDeliverable` actions.
*   [ ] **Mobile Optimization:** Ensure approvals work perfectly on phone screens.

---

## 4. Technical Guidelines
*   **Data Fetching:** Use existing Sanity GROQ queries (refactored into `sanity/lib/fetch.ts` where needed).
*   **State Management:** Rely on Server Actions + `revalidatePath` for data freshness.
*   **Components:** Build new, specific components in `components/flow/*` to avoid polluting the main app's component library.
*   **Auth:** Reuse `lib/auth.ts` and middleware; ensure strict role-based redirects in `/flow/page.tsx`.
