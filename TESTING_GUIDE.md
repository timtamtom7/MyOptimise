# MyOptimise System Capabilities & Testing Guide

## System Overview
MyOptimise is an organization management dashboard designed for agencies or service providers. It handles task management, client services, support tickets, user administration, and internal messaging.

## User Roles & Capabilities

### 1. Owner
**Capabilities:** Full system access.
- **Tasks:** Create, Update, Delete, Assign, View All.
- **Users:** Invite, Remove, Update, Impersonate.
- **System:** Manage Feature Flags, View Audit Logs.
- **Financials:** View Invoices.
- **Services:** Manage Client Services.

### 2. Manager
**Capabilities:** High-level operational access.
- **Tasks:** Create, Update, Assign, View All.
- **Users:** Can often manage employees/clients (depending on specific configuration).
- **Services:** Manage Client Services.
- **Support:** Manage Support Tickets.

### 3. Employee
**Capabilities:** Execution-focused access.
- **Tasks:** View assigned tasks, Update status of assigned tasks.
- **Messages:** Participate in threads.
- **Support:** View/Respond to assigned tickets.

### 4. Client
**Capabilities:** Restricted access to own data.
- **Services:** View own service metrics.
- **Support:** Create/View own support tickets.
- **Financials:** View own invoices.

---

## Core Features & Testing Scenarios

### 1. Task Management (`/dashboard/admin` -> Tasks Tab)
*Components: `TasksTab`, `TaskBoard` (in separate view)*
- **Active Tasks**: View list of open tasks.
    - *Test*: Verify priority colors (Red/High, Orange/Medium, Blue/Low).
    - *Test*: Verify status badges.
- **Create Task**:
    - *Test*: Click "New Task" or "Create New" tab.
    - *Test*: Fill form (Title, Priority, Due Date, Assignee) and submit.
    - *Test*: **Assignee Selection**: Verify you can select an organization member from the dropdown.
    - *Test*: Verify task appears in "Active" list with the correct assignee.
- **Update Task**:
    - *Test*: Change status dropdown (Todo -> In Progress). Verify update persists.
- **Unassigned Tasks**:
    - *Test*: View tasks with no assignee.
    - *Test*: Assign a user via dropdown. Verify it moves to their queue.

### 2. User Management (`/dashboard/admin` -> Accounts Tab)
- **List Users**: View all accounts.
- **Invite User**:
    - *Test*: Invite a Google Account (Email, Role).
- **Impersonate**:
    - *Test*: Click "Impersonate" on a user.
    - *Test*: Verify view changes to their perspective.
    - *Test*: Click "Stop Impersonation" to return.

### 3. Services (`/dashboard/admin` -> Services Tab)
- **Client Services**: Track social media or web services (Instagram, Website, etc.).
- **Metrics**: View impressions, engagement, etc.
    - *Test*: Verify metric formatting (e.g., "1.2M", "50%").

### 4. Support (`/dashboard/admin` -> Support Tab)
- **Client Requests**: View incoming requests.
- **Actions**: Assign request, reply to request.

### 5. Messages (`/dashboard/admin` -> Messages Tab)
- **Threads**: View conversation threads.
- **Direct Messages**: Start a DM with an employee.

### 6. System Administration
- **Feature Flags**: Toggle system features on/off.
- **Audit Logs**: View history of actions (who did what).

---

## Known Issues & Debugging
- **Tasks Tab Crash**: 
    - *Symptom*: Clicking "Tasks" tab may cause a crash with `useInsertionEffect` error.
    - *Potential Cause*: Interaction between Radix UI Tabs and Styled Components/React 18+.
    - *Fix Status*: Attempted fix by ensuring Client Component boundaries.
