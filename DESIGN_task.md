# WorkSight Design Specification

## ⚠️ Phase 1 Constraints
- **No AI/ML Models**: Pure rule-based logic only.
- **Local Database**: SQLite / Postgres.
- **Architecture**: `rules.py` module for parsing to allow future swap with `nlp_pipeline.py`.
- **Chat**: Input mechanism only, not a communication tool.

## 🔗 Logical Relationship Between Admin and Member

### 1. Core Relationship Model
WorkSight follows a **Collaborative Workflow** model where every role interacts with the system via chat.

**Roles:**
- **Admin** = Workstream Controller
- **Member** = Workstream Contributor
- **Viewer** = Workstream Observer

Everyone interacts with the same system via chat, but each chat is private, and the system merges all structured information into a shared, role-aware workstream intelligence layer.

### 2. Logical Flow Between Admin and Member

**Step-by-Step Relationship Logic**
1. **Admin creates a workstream**
   - Defines purpose, scope, and goals.  
   - Example: “Exam Cell – Odd Sem 2025”
2. **Admin assigns members**
   - Invites via email or invite link.
3. **Everyone contributes privately**
   - **Members** submit work updates, commitments, blockers.
   - **Admins** submit their own updates (e.g., "Reviewed documents") and queries.
   - **Viewers** (optional) ask questions.
4. **System extracts intelligence**
   - **Rule-Based Parser** (Phase 1) converts updates from *all* roles into: Tasks, Status changes, Commitments, Blockers.
   - Logic is isolated in `rules.py`.
5. **Shared intelligence is updated**
   - Structured task data is shared across the workstream.
   - Raw chat remains private.

### 3. Authority & Responsibility Separation

| Aspect | Admin | Member | Viewer |
| :--- | :--- | :--- | :--- |
| **Control** | Governs the workstream | Executes tasks | N/A |
| **Visibility** | Full aggregated intelligence | Personal + summary | Summary only |
| **Chat** | Private chat (Updates + Queries) | Private chat (Updates + Queries) | Private chat (Queries only) |
| **Decision power** | Yes | No | No |

---

## 🧠 FEATURES BY ROLE

### 4. Admin Features

**A. Workstream Management**
- Create / edit / archive workstreams
- Invite members and assign roles

**B. Private Chat & Updates**
- **Give Updates**: E.g., “Reviewed question papers for all divisions”.
- **Query Chatbot**:
  - “What is the status of this workstream?”
  - “Show overdue commitments this week.”
  - “Any conflicting updates?”

**C. Intelligence & Oversight**
- View structured task summaries
- See pending and overdue commitments
- Resolve conflicts flagged by the system

**D. Reporting & Analytics**
- Weekly reports
- Commitment performance reports

### 5. Member (Regular User) Features

**A. Private Chat & Updates**
- **Give Updates**: Send work updates, commitments, blockers in natural language.
- **Query Chatbot**:
  - “What are my tasks/commitments?”
  - “What is the overall workstream status?” (within limits)

**B. Task Awareness**
- View: Tasks assigned to them
- View: Overall workstream progress

### 6. Viewer (Optional Role)

**Capabilities**
- **Chat**: Can interact with the chatbot to ask questions (e.g., “What is the status?”).
- **Updates**: Typically NO updates allowed.
- **Dashboard**: Read-only access to dashboards and summaries.

---

## 📊 Feature Comparison Table

| Feature | Admin | Member | Viewer |
| :--- | :---: | :---: | :---: |
| Create workstreams | ✅ | ❌ | ❌ |
| Invite users | ✅ | ❌ | ❌ |
| Private chat | ✅ | ✅ | ✅ |
| Submit updates | ✅ | ✅ | ❌ |
| View own tasks | ✅ | ✅ | ❌ |
| View workstream summary | ✅ | ✅ | ✅ |
| View conflicts | ✅ | ❌ | ❌ |
| Query chatbot | Full | Limited | Summary-only |

### 7. One-Line Relationship Summary
Everyone interacts via private chat; the system aggregates updates into a shared intelligence layer relative to the user's role.
