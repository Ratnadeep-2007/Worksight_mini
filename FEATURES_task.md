# WorkSight Features Guide

This guide details the specific features and chat capabilities available for each user role in the WorkSight system.

## 🛡️ Admin

**Role**: Workstream Controller / Manager
**Chat Access**: ✅ Yes (Private Workstream Chat)
**Primary Goal**: Oversee health, progress, and resolve conflicts.

### 1. Admin Private Chat
Admins have a private chat for each workstream (e.g., “Exam Cell – Odd Sem 2025”) to interact with the system.

- **Give Updates**: Submits high-level updates that are processed by **Rule-Based Logic** (Phase 1).
    - *Example*: "Reviewed question papers for all divisions."
    - *Result*: System logs this as a completed task for the Admin or a general workstream update.
- **Ask the Chatbot**: Full visibility queries.
    - *Query*: "What is the status of this workstream?"
    - *Query*: "Show overdue commitments this week."
    - *Query*: "Any conflicting updates?"

### 2. Workstream Management
- **Create Workstreams**: Define goals and scope (e.g., "Website Redesign").
- **Invite Members**: Add contributors via email or link.
- **Role Assignment**: Designate members as Contributors or Viewers.

### 3. Intelligence Dashboard
- **Aggregated View**: See all tasks, commitments, and blockers extracted from member chats.
- **Conflict Resolution**: View and resolve conflicting status updates flagged by the system.
- **Reporting**: Generate weekly summaries and performance reports.

---

## 👤 Regular User (Member)

**Role**: Contributor
**Chat Access**: ✅ Yes (Private Workstream Chat)
**Primary Goal**: Execute tasks and report progress.

### 1. Member Private Chat
Members have a private chat to submit their daily work, which is the specialized input channel for the system.

- **Send Work Updates**: Natural language reporting.
    - *Message*: "Completed the login API and started working on the dashboard."
    - *Result*: System marks "Login API" as DONE and "Dashboard" as IN_PROGRESS.
- **Commitments & Blockers**:
    - *Message*: "I will finish the report by Friday." (Commitment logged)
    - *Message*: "Blocked on database access permissions." (Blocker flagged)

### 2. Personal Intelligence
- **Ask the Chatbot**:
    - "What are my pending tasks?"
    - "Show my commitments for this week."
- **Workstream Awareness**:
    - "What is the overall status?" (Restricted high-level view)
    - *Note*: Cannot see private performance metrics of other members.

---

## 👁️ Viewer (Optional)

**Role**: Observer (e.g., HOD, Auditor)
**Chat Access**: ⚠️ Limited (Queries Only)
**Primary Goal**: Monitor status without interfering.

### 1. Viewer Chat (Optional)
Viewers may have a chat interface primarily for asking questions.
- **Capabilities**:
    - Ask: "Is the exam schedule finalized?"
    - Ask: "Show me the current progress summary."
- **Restrictions**:
    - **No Updates**: Cannot submit task updates or change statuses.
    - **Read-Only**: Messages are for information retrieval only.

### 2. Dashboards
- **Read-Only Views**: Access to the same high-level status boards as Admins but without edit rights.
- **Transparency**: See overall progress bars, health scores, and public milestones.

---

## ⚙️ System-Wide Capabilities (All Roles)

### 1. Rule-Based Parser (Phase 1) & Shared Knowledge Base
- **Concept**: Everyone interacts with the same system via private chat.
- **Mechanism**: The system merges structured information (Tasks, Dates, Statuses) from ALL private chats using a **Rule-Based Parser** (Logic in `rules.py`).
- **Privacy**: Raw messages remain private to the sender; only the *extracted data* becomes part of the shared state.

### 2. Role-Aware Responses
- The chatbot knows who is asking.
- **Admin asks "Status?"** → Gets full detailed breakdown including blockers and sensitive delays.
- **Member asks "Status?"** → Gets team-wide progress summary and their own specific blocking items.
- **Viewer asks "Status?"** → Gets a high-level executive summary.
