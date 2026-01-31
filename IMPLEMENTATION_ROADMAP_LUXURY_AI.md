# Luxury Strategy & AI Implementation Roadmap

This roadmap outlines the comprehensive plan to elevate the MyOptimise platform to a luxury standard, enhance AI capabilities, and streamline the workflow to minimize editor back-and-forth.

## Phase 1: Core Luxury UI & Context Experience (Immediate Priority)
**Goal:** Transform the "Context" and "Plan" tabs into a premium, visually stunning experience that feels like a high-end strategy tool.

- [ ] **Context Tab Redesign**
    - [ ] Implement deep blue/slate luxury theme (slate-950 backgrounds, slate-900 cards).
    - [ ] Increase whitespace (padding-16, gap-8) to remove cramping.
    - [ ] Add subtle background gradients (blue/indigo blurs) for depth.
    - [ ] Style inputs with rounded-xl corners, soft borders, and focus rings.
- [ ] **Strategic Pillars UX**
    - [ ] Add numbered badges (01, 02, 03) to pillars.
    - [ ] Hide delete buttons by default (show on hover).
    - [ ] Add "recommended count" helper text.
- [ ] **AI Context Suggestions**
    - [ ] Add "AI Suggestion" labels (uppercase, tracking-wider).
    - [ ] Implement inline suggestion cards for Audience & Tone.
    - [ ] Add "Apply" and "Refresh" actions with clear icons.
    - [ ] Fix Dark Mode visibility issues for all text.

## Phase 2: The "Editor-Ready" AI Plan (High Impact)
**Goal:** Ensure every deliverable is 100% ready for production before it leaves the strategy phase.

- [ ] **Plan Tab Overhaul**
    - [ ] Create "Generate Full Plan with AI" hero section (large gradient button).
    - [ ] Add "Manual Build" secondary path.
- [ ] **AI Double-Check System**
    - [ ] Implement `checkAllDeliverables` logic to scan the entire plan.
    - [ ] **Backend:** Validate for clarity, no blanks, specific visual direction, and asset links.
    - [ ] **Frontend:** Display "Verified" (Green Shield) or "Needs Review" (Amber Alert) chips on each item.
    - [ ] **Tooltips:** Show specific issues (e.g., "Missing visual reference") and suggestions.
- [ ] **Deliverable Card UI**
    - [ ] Redesign deliverable cards to match luxury theme.
    - [ ] Add platform icons/badges.
    - [ ] Ensure full readability of content without excessive clicking.

## Phase 3: Client-Facing Luxury Presentation
**Goal:** Replace basic slides with "Canva-level" beautiful, minimal templates.

- [ ] **Slide Template System**
    - [ ] Create layouts: Title, Split (Image/Text), Quote, Grid, Stats.
    - [ ] Implement "Midnight Luxury" theme (dark mode default).
    - [ ] Add Framer Motion transitions (fade/scale) between slides.
- [ ] **Presentation Features**
    - [ ] Keyboard navigation (Arrow keys).
    - [ ] "Strategy Context" summary slide (auto-generated).
    - [ ] "Competitor Landscape" slide.
    - [ ] "Deliverables Plan" overview slide.

## Phase 4: Strategy Approval Workflow
**Goal:** Formalize the client sign-off process to trigger production.

- [ ] **Approval Logic**
    - [ ] Add "Approve Strategy" button for clients.
    - [ ] Add "Request Changes" workflow with feedback form.
    - [ ] Lock strategy fields after approval.
- [ ] **Notifications**
    - [ ] Notify manager on client approval.
    - [ ] Notify editor when brief is ready (post-approval).

## Phase 5: AI Research & Data Sync
**Goal:** Power the strategy with real-world competitor data.

- [ ] **Competitor Analysis**
    - [ ] Scrape meta tags/og:images from competitor URLs.
    - [ ] Sync competitor data into "Context" suggestions.
    - [ ] Use competitor tone to inform "Tone of Voice" suggestions.
- [ ] **Asset Management**
    - [ ] Auto-link brand assets (logos, fonts) to briefs.
    - [ ] "Scorecard" for deliverable completeness.

## Technical Architecture & Codebase

### Key Files
- `components/flow/manager/campaign-strategy-tab.tsx`: Main UI for Context/Plan.
- `components/flow/client/strategy-presentation.tsx`: Client-facing slide deck.
- `app/actions/research-tools.ts`: AI logic (Quality Check, Content Gen).
- `app/actions/campaigns.ts`: Database mutations (Save, Approve).

### AI Logic (DeepSeek)
- **Quality Check:** System prompt to act as "Senior Editor" checking for ambiguity.
- **Plan Gen:** System prompt to generate comprehensive deliverables based on pillars.
- **Research:** System prompt to analyze URLs and extract strategic insights.
