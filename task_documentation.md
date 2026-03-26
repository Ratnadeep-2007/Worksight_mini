# WorkSight: Project Documentation & Integration Guide

This document provides a complete, technical overview of the **WorkSight** project. It is designed to give another context or agent (like an Antigravity instance) a full understanding of the system's architecture, data models, logic, and features, facilitating easy integration with other projects.

## 1. Executive Summary

**WorkSight** is a "Hierarchy-Aware Workstream Intelligence System" currently in **Phase 1**. Its primary objective is to convert private, informal natural language updates (e.g., "I finished the audit" or "I'm blocked on the firewall") into structured, queryable organizational knowledge (Tasks, Blockers, Statuses) without relying on manual forms.

The user inputs a message in a chat-like interface, and an intelligence engine interprets the syntax, extracts meaning, logs data to a database, and generates project metrics.

---

## 2. Technical Stack & Architecture

WorkSight is built on a modern, decoupled web architecture:

### Frontend
- **Framework:** React with Vite.
- **Styling:** Tailwind CSS and Lucide React icons.
- **Routing:** `react-router-dom` driving a Single Page Application (SPA).
- **Core Views:**
  - `Login.jsx`: Handles role-based authentication.
  - `ChatInterface.jsx`: The primary workspace where users send natural language updates.
  - `AdminDashboard.jsx`: A high-level view showing aggregated task metrics, project health, and system-wide activities.
- **State Management & Network:** Basic React hooks and `axios` for REST API communication.

### Backend
- **Framework:** FastAPI (Python). 
- **Database:** SQLite (for Phase 1 prototype) via SQLAlchemy ORM.
- **Authentication:** JWT (JSON Web Tokens) with a Bearer token implementation (`auth.py`). 
- **Roles:** Hardcoded role logic mapping `Admin`, `User` (Member), and `Viewer`.

---

## 3. Intelligence Engine (`rules.py`)

The core innovation of Phase 1 is the rule-based entity and intent extraction logic, replacing complex UI with intelligent chat parsing. It currently uses Regex and Keyword matching but is structured to easily integrate an LLM later.

### Intent Classes:
1.  **`QUERY`**: Triggered by keywords like "what", "show", "status", "pending". Example: *"How many pending tasks are there?"*
2.  **`BLOCKER`**: Triggered by "blocked by", "stuck on". Flags a task as stuck.
3.  **`CREATE_COMMITMENT`**: Parses future-tense commitments like *"I will commit to testing by Friday."*
4.  **`UPDATE_STATUS`**: Updates tasks based on verbs like "done", "finished", "working on".
5.  **`CREATE_TASK`**: The default fallback. Creates new work items, parses due dates ("by Monday"), and assignments ("@john").

### Contextual Understanding
The engine maintains context by querying the database for the user's *most recent active task*. If a user says "I am blocked", the engine attaches the new `Blocker` record to their last known `IN_PROGRESS` or `TODO` task.

---

## 4. Database Schema (`models.py`)

The relational database uses SQLAlchemy and defines the following core models:

-   **`User`**: (`id`, `name`, `email`, `hashed_password`, `role`). Handles user profiles and auth.
-   **`Workstream`**: (`id`, `name`, `description`). Represents a project, goal, or broad initiative.
-   **`WorkstreamUser`**: Junction table for Many-to-Many relationships between Users and Workstreams.
-   **`Task`**: (`id`, `description`, `status`, `owner_id`, `workstream_id`, `due_date`). The foundational unit of work. Statuses include `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`.
-   **`Commitment`**: Hooks onto a `Task`, storing loose timeframes (`by Friday`) and a boolean `is_fulfilled`.
-   **`Blocker`**: Hooks onto a `Task`. If a blocker `is_active`, the parent task is marked as `BLOCKED`.
-   **`ChatMessage`**: A raw log of every message sent into the system by users.

---

## 5. Core API Endpoints (`main.py`)

The backend exposes separated endpoints to enforce role-based access control directly at the API layer:

- **`POST /token`**: Auth exchange for JWTs. Auto-provisions users in the prototype.
- **`POST /admin/message`**: Processes chat updates for Admins. Can run global queries and create tasks for anyone.
- **`POST /member/message`**: Processes chat updates for Users. Scoped to personal tasks and updates.
- **`POST /viewer/message`**: Read-only endpoint. Can process queries but cannot write `Task` or `Status` modifications.
- **`GET /admin/dashboard`**: Fetches real-time statistics (total, completed, blocked tasks) and a list of all active elements.

---

## 6. Integration Opportunities

When expanding WorkSight or merging it with another project, there are three key integration vectors:

1.  **The Intelligence Provider**: The `rules.py` module is a mock layer. Integration with an LLM (OpenAI, Gemini) would involve rewriting `classify()` and `extract_*()` functions to process natural language dynamically via LLM prompting arrays instead of Regex.
2.  **External Input Channels**: Because the backend accepts raw text via API endpoints (`/message`), it is trivial to ingest messages from external data layers like Microsoft Teams, Slack APIs, or Email webhooks.
3.  **Third-Party Action Webhooks**: When the engine creates a `Task` or modifies a `Status` to `DONE`, hooks can be created in the ORM to fire events outwards (e.g., updating a JIRA board via their API based on the conversational input from WorkSight).
