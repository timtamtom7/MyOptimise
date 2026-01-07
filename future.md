# Future Roadmap: The My Optimise Internal Operating System
**Version 4.0 – The "God Mode" Technical Bible**

---

## 1. Executive Summary & Core Philosophy

This document serves as the master blueprint for transforming "My Optimise" from a dashboard into a fully autonomous **Agency Operating System**. The strategic objective is to eliminate reliance on fragmented external tools—specifically **Gain.app** for scheduling, generic CRMs for sales, and manual tools for reporting—by building a unified, pixel-perfect, and "God Mode" controlled environment.

The core philosophy of this system is **Intentional Granularity**. Unlike traditional SaaS platforms that offer rigid tiers (e.g., "Admin" vs. "User"), My Optimise will operate on an **Attribute-Based Access Control (ABAC)** model. This means the "Admin" (God Mode) has the absolute power to toggle specific, granular capabilities for *any* individual account, regardless of their primary role. This allows for fluid role definitions—an employee can be a "Junior Designer" but have temporary "Sales Access" to close a specific lead, or a "Client" can be given "Beta Access" to a new analytics feature.

This system is designed to be the *only* tab open on an employee's computer.

---

## 2. Technical Architecture & Stack

To support high-frequency real-time collaboration and pixel-perfect rendering, the technical stack is chosen for speed, type safety, and scalability.

### 2.1. Core Stack
*   **Framework**: Next.js 14+ (App Router) – Utilizing Server Actions for mutations and React Server Components (RSC) for data fetching.
*   **Database**: Supabase (PostgreSQL) – Leveraging Row Level Security (RLS) as the first line of defense.
*   **ORM**: Drizzle ORM or Prisma (typed raw SQL preference for complex queries).
*   **State Management**:
    *   *Server State*: TanStack Query (React Query) v5 – For aggressive caching, optimistic updates, and background revalidation.
    *   *Client State*: Zustand – For managing ephemeral UI states like "Modal Open," "Sidebar Collapsed," or "Video Player Volume."
*   **Styling**: Tailwind CSS + Framer Motion – For layout and complex micro-interactions (e.g., layout transitions when dragging calendar items).
*   **Realtime**: Supabase Realtime – For presence indicators ("John is typing...") and instant state updates (Approval status changes).

### 2.2. Critical Infrastructure Decisions
*   **PDF Generation**: We will not use client-side PDF libraries (which are flaky). We will deploy a microservice (or use a provider like Browshot/Vercel OG) running **Puppeteer/Playwright** to "screenshot" a specifically designed React page. This ensures PDFs look exactly like the web view.
*   **Image Processing**: Sharp.js (via Edge Functions) for on-the-fly resizing and optimization of user uploads.
*   **Video Processing**: FFmpeg (via WASM or a dedicated worker) to generate thumbnails and ensure codec compatibility (H.264/AAC) for web playback.
*   **Asset Previewing**: For non-web files (PSD, AI, PDF), we will utilize a cloud conversion pipeline (e.g., Cloudinary or a dedicated Lambda) to generate high-res `.png` previews so clients can approve designs without needing Adobe software.

---

## 3. The "God Mode" Permission Architecture (ABAC)

To achieve the "zero percent unintentional detail" standard, the permission system must be the bedrock of the database. We are moving away from simple `role` strings to a capability-based registry.

### 3.1. Database Schema: `user_capabilities`

Instead of a fixed column, we will use a dedicated table (or a JSONB column on the profile) to store capabilities.

```typescript
// Interface for the Capability Matrix
interface UserCapabilities {
  // Content & Approvals
  'content.view_drafts': boolean;      // Can see items in 'Draft' state
  'content.create': boolean;           // Can upload new content
  'content.delete': boolean;           // Can delete items (dangerous)
  'content.approve_internal': boolean; // Can move from 'Internal Review' -> 'Client Review'
  'content.approve_client': boolean;   // Can move from 'Client Review' -> 'Scheduled' (Client role)

  // Communication
  'chat.internal_access': boolean;     // Can chat with team
  'chat.client_access': boolean;       // Can chat with clients (Restricted for juniors)
  'chat.ghost_mode': boolean;          // Can view threads without triggering "Read" receipts (Admin)

  // Sales & Growth
  'sales.access': boolean;             // Can access the CRM module
  'sales.lead_gen': boolean;           // Can use the credit-based Lead Finder
  'sales.contracts': boolean;          // Can sign legal agreements

  // Admin & Financials
  'analytics.view_financials': boolean; // See sensitive money data (ROAS, Spend)
  'admin.impersonate': boolean;         // The "God Mode" view-as ability
  'admin.billing': boolean;             // Can change subscription plans
}
```

### 3.2. The Mixing Board UI
The Admin Dashboard will feature a "User Management" screen that resembles a sound engineer's mixing board.
*   **Visuals**: Rows of users, columns of toggle switches.
*   **Bulk Actions**: "Apply 'Senior Manager' Template to these 3 users" (sets a predefined batch of toggles).
*   **Overrides**: If a user has a "Manager" role but the admin *unchecks* `chat.client_access`, the specific override takes precedence.

---

## 4. Module A: The "Gain Killer" (Content Engine)

This is the most critical functional requirement: replacing Gain.app. To do this, we cannot just "build a scheduler." We must build a **Content Experience Platform** that clients *love* to use.

### 4.1. The "Pixel-Perfect" Native Preview Engine
Clients do not approve "text and an image." They approve "an Instagram Post." The preview must be indistinguishable from the real app.

*   **Reverse-Engineering Strategy**:
    *   **Instagram**:
        *   *Font*: San Francisco (iOS) / Roboto (Android).
        *   *Layout*: 60px Header with Avatar + Username. 100% width image. Action bar (Heart, Comment, Share, Save) with exact SVG paths.
        *   *Carousel*: CSS Scroll Snap with pagination dots overlay.
        *   *Truncation*: Logic to truncate captions after 125 characters with a "... more" button.
    *   **TikTok**:
        *   *Overlay UI*: Right-side action buttons (Heart, Comment, Bookmark, Share) with exact drop-shadows.
        *   *Bottom Gradient*: The subtle black gradient at the bottom to make text readable.
        *   *Music Ticker*: An animated marquee showing the audio track name.
    *   **LinkedIn**:
        *   *Professional UI*: "Promoted" tag handling. "See translation" button simulation.

### 4.2. The Approval Workflow (State Machine)
The lifecycle of a post is a strict state machine (FSM) to prevent errors.

**States:**
1.  **DRAFT (Gray)**:
    *   Employee uploads raw assets (PSD, MP4).
    *   *Validation*: System checks aspect ratios (4:5 for IG Feed, 9:16 for Reels).
2.  **INTERNAL_REVIEW (Orange)**:
    *   Manager notification triggered.
    *   **Annotation Mode**: The manager clicks *directly on the image* (x,y coordinates). A numbered pin appears. The comment thread is linked to that pin. "Move this logo 10px right."
3.  **CLIENT_REVIEW (Yellow)**:
    *   **The Magic Link**: `optimise.com/review/token?exp=7d`. No login required.
    *   *Client View*: A distraction-free "Deck View". Left side: Post Preview. Right side: Approval Controls.
    *   *Actions*: "Approve", "Request Changes" (opens comment box), "Reject".
4.  **SCHEDULED (Green)**:
    *   Post is locked. Syncs with the publishing queue.
5.  **PUBLISHED (Blue)**:
    *   Link to live post is scraped and stored.

### 4.3. The Visual Calendar
*   **Drag-and-Drop**: Implementing `dnd-kit` or `react-beautiful-dnd`.
    *   *Logic*: Moving a post from 10am to 2pm updates the DB. Moving it to a past date triggers a validation error ("Cannot schedule in the past").
*   **Timezone Intelligence**: All times are stored in UTC. The UI renders in the *viewer's* timezone, but the "Scheduled Time" is explicitly shown in the *Account's Target Timezone* (e.g., "Posting at 9:00 AM EST").
*   **Asset Drawer**: A sidebar containing "Unscheduled Drafts." Managers can drag drafts onto the calendar to schedule them.
*   **Event Layer**: External API (e.g., Holidays API) to overlay "National Pizza Day" or "Black Friday" onto the grid as prompts.

---

## 5. Module B: Sales & CRM (The Growth Engine)

We are creating a dedicated ecosystem for the "Hunter" (Salesperson) and "Closer" roles.

### 5.1. The "Sales" Account Type
An account designated as "Sales" sees a completely different interface. They do not see "Content" or "Approvals." They see **The Pipeline**.

### 5.2. Lead Generation & Scraping
*   **Lead Finder Tool**: An internal interface wrapping Google Places / Maps API.
    *   *Query*: "Estate Agents in Manchester".
    *   *Enrichment*: The system fetches the website, then a secondary scraper visits the website to extract emails (regex search for `mailto:`), phone numbers, and social links.
    *   *Deduplication*: Checks against existing `Accounts` and `Leads` to prevent double-pitching.

### 5.3. The Pipeline Board (Kanban)
*   **Columns**: `Cold` -> `Contacted` -> `Discovery Call` -> `Proposal Sent` -> `Negotiation` -> `Won` -> `Lost`.
*   **Automation Triggers**:
    *   *Move to 'Contacted'*: Opens the Email Composer with the "Cold Outreach Template #1" pre-filled.
    *   *Move to 'Proposal Sent'*: System generates a trackable Proposal PDF link. We track when they open it.
    *   *Stale Logic*: Cards turn red if they haven't moved in 7 days.
*   **AI Transcription**: Integration with OpenAI Whisper. Salespeople can upload a recording of a Discovery Call, and the system generates a summary, action items, and sentiment analysis to attach to the Lead card.

### 5.4. The "Closer" Workflow (Lead-to-Client Conversion)
This is the "One Click Onboarding" magic.
1.  Salesperson drags card to **"Won"**.
2.  **Modal**: "Confirm Details for Contract".
3.  **System Action**:
    *   Converts `Lead` row to `Account` row.
    *   Generates Stripe Customer ID.
    *   Sends "Welcome Packet" email with Magic Link.
    *   **Permissions**: Revokes Salesperson access (optional), grants Manager access.
    *   **Slack/Discord Webhook**: "🚨 NEW CLIENT SIGNED: [Name] ($3k/mo) 🚨" - Celebrate the win!

---

## 6. Module C: Analytics & The "Slide Generator"

Clients pay for results. Our reporting must be beautiful, automated, and undeniable.

### 6.1. Data Ingestion Layer (ETL)
*   **Connectors**:
    *   **Meta Graph API**: `access_token` management is crucial. We need a "Re-connect" flow for when tokens expire.
    *   **Google Analytics 4**: Data API (v1beta).
    *   **Shopify**: Read-only access to `orders` for ROAS calculation.
*   **Storage**: Daily aggregation. We don't need realtime precision for reports. We store `daily_stats` rows: `date | impressions | clicks | spend | revenue`.

### 6.2. The "Slide Generator" (Automated Reporting)
*   **The Problem**: Building monthly PDF reports is tedious.
*   **The Solution**: Headless Browser Rendering.
    *   **Step 1**: React component `<MonthlyReport data={...} />` renders a beautiful, print-ready layout (A4 aspect ratio).
    *   **Step 2**: User clicks "Generate PDF".
    *   **Step 3**: Server spins up a Puppeteer instance, navigates to the render URL (protected by secret), waits for charts to animate, and snaps a PDF.
    *   **Step 4**: PDF is uploaded to Supabase Storage and attached to the Client Portal.
*   **The "Human Touch"**: Managers can inject "Executive Summaries" (text blocks) between the auto-generated charts before final generation.

---

## 7. Module D: Finance & Client Portal

### 7.1. The Client Dashboard
When a client logs in (or clicks a link), they enter their **Brand Home**.
*   **The Header**: Shows their current package (e.g., "Growth Tier - $3,000/mo").
*   **Brand Assets**: A dedicated tab for "Brand Guidelines," "Logos" (SVG/PNG), and "Fonts". Clients can upload their assets here, and they become immediately available in the Editor for employees.
*   **Upsell Engine**:
    *   **"Request Upgrade"**: A glossy UI showing available add-ons.
    *   *Logic*: Clicking isn't just an email. It creates a "Lead" in the Sales Pipeline for an "Upsell Opportunity" so the team can follow up professionally.

### 7.2. Invoicing & Payments
*   **Stripe Connect**:
    *   *Subscription*: We manage the `price_id` and `product_id` in Supabase.
    *   *Webhooks*: `invoice.payment_failed` triggers an email to the client and a notification to the Manager ("Chase payment for Client X").
    *   *Portal*: Embedded Stripe Customer Portal for them to update card details without us touching PCI data.

---

## 8. Module E: Communication & The "Gatekeeper"

Communication is dangerous. One wrong message from a junior employee can lose a client.

### 8.1. The Gatekeeper Logic
*   **Role**: `Junior Employee`.
*   **Action**: Types a reply to a client DM. Hits "Send".
*   **System**:
    *   Message status: `pending_approval`.
    *   Not visible to Client.
    *   Manager Notification: "Review draft reply to [Client Name]".
*   **Manager Action**:
    *   Manager sees the draft. Edits "thx" to "Thank you!".
    *   Manager clicks "Approve & Send".
    *   **Client sees**: Message from "The Optimise Team" (or the employee's name, depending on setting).

### 8.2. Contextual Chat
*   **Threaded Context**: Chat isn't just a room. It's an overlay.
    *   *Scenario*: Client is looking at "Post #123". They click "Comment".
    *   *Result*: The chat thread is tagged `ref:post_123`.
    *   *Manager View*: When reading the message, the system displays a thumbnail of Post #123 next to it so they know *exactly* what is being discussed.

---

## 9. Implementation Phases

### Phase 1: Foundation & "Gain" Core (Weeks 1-6)
*   Database Schema Refactor (Capabilities, Teams, Organizations).
*   Authentication Hardening (Magic Links, Session Security).
*   **The Preview Engine**: Building the CSS replicas of IG/TikTok.
*   **The Calendar**: Drag-and-drop mechanics.

### Phase 2: The Client Loop (Weeks 7-10)
*   **Approval State Machine**: Linking the "Approve" button to DB status.
*   **Annotation System**: Image coordinate commenting.
*   **Client Portal**: The "Brand Home" dashboard.

### Phase 3: The Growth Engine (Weeks 11-14)
*   **Sales Pipeline**: Kanban board and Lead object.
*   **Lead Scraper**: Google Places integration.
*   **Contract Generation**: PDF automation for agreements.

### Phase 4: Intelligence & Finance (Weeks 15+)
*   **Analytics Aggregation**: Meta/GA4 Connectors.
*   **Slide Generator**: Puppeteer service.
*   **Billing**: Stripe Webhooks and Invoicing.

---

## 10. Conclusion

This roadmap describes a system that is not just a tool, but a competitive advantage. By owning the entire workflow—from the first cold call to the final monthly report—My Optimise becomes an asset that increases the valuation of the agency itself. It reduces churn by providing a superior client experience, increases revenue through easy upsells, and reduces costs by eliminating third-party SaaS subscriptions.

**Every detail here is intentional.** From the pixel-perfect CSS of a preview to the specific permission toggle for a junior designer, the system is built for control, speed, and quality.
