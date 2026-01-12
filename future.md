# Future Roadmap

## The "Must Dos" (Critical Gaps)

1.  **Unified "Content Ops" Workflow**
    *   **The Problem:** Currently, "Tasks" and "Content" are separate islands. If a client requests a revision on a post, no task is automatically created for the editor.
    *   **The Fix:** Create a trigger (Server Action) that automatically generates a `workItem` when a Post status changes to `changes_requested`.
    *   **Goal:** "One click to request changes -> One task in the employee's inbox."

2.  **Real-Time / Robust Messaging**
    *   **The Problem:** The current messaging system relies on page reloads (`revalidatePath`). It feels static.
    *   **The Fix:** Implement **Supabase Realtime** or Sanity Live Content for the chat interface so messages appear instantly.
    *   **The Want:** Add "Contextual Chat" — allowing threads to be pinned to specific Documents (e.g., "Chat about Invoice #1024" or "Chat about Post #55").

3.  **Automated Client Onboarding**
    *   **The Problem:** `convertLeadToClient` creates an account but only *simulates* the Welcome Packet and Stripe setup (via `console.log`).
    *   **The Fix:**
        *   Integrate a real email provider (Resend is installed) to send the login credentials.
        *   (Optional) Integrate Stripe API to actually create the customer record.

4.  **The "Client Headquarters" (Dashboard Polish)**
    *   **The Problem:** The client dashboard is functional but basic. The "Approvals" flow is the most valuable part and needs to be rock-solid.
    *   **The Fix:** Ensure the **Public Approval Link** (no-login required) works perfectly for mobile users, as that's how most clients will approve social posts.

## The "Nice to Haves"

*   **AI Sales Assistant:** The `processCallRecording` action is currently mocked with a 2-second delay. Implementing OpenAI Whisper + GPT-4o here would be a huge "wow" factor for the Sales CRM.
*   **Financial Analytics:** The Analytics tab is likely using mock data. Connecting this to real Stripe data or Sanity Invoice records would make the "Business OS" claim real.
