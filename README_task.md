# WorkSight: Hierarchy-Aware Workstream Intelligence System

WorkSight converts private, informal natural language updates into structured, queryable organizational knowledge without hallucination.

## 🚀 Quick Start

### Option 1: One-Click Start (Windows)
Double-click the `start.bat` file in the project directory. This will automatically:
1.  Start the Backend Server (Port 8000)
2.  Start the Frontend Server (Port 5173)

### Option 2: Manual Start

**1. Backend**
```powershell
backend\venv\Scripts\python -m uvicorn main:app --reload --app-dir backend
```

**2. Frontend**
```powershell
cd frontend
npm run dev
```

## 🔑 Login Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Member** | `member@worksight.ai` | `password` | Chat Interface |
| **Admin** | `admin@worksight.ai` | `password` | Admin Dashboard |
| **Viewer** | `viewer@worksight.ai` | `password` | Read-only Access |

_Note: New sign-ups default to the **Member** role._

## 🛠️ Features

*   **Private User Chat**: Submit updates like "I finished the audit" naturally without forms.
*   **Rule-Based Intent Classification**: Automatically categorizes user input into intents (Status Updates, Blockers, Commitments, Queries).
*   **Task & Status Extraction**: Automatically tags tasks as TODO, IN_PROGRESS, DONE, or BLOCKED using NLP matching (Phase 1).
*   **Automated Blockers**: Identifies workflow bottlenecks when a user mentions being stuck or blocked.
*   **Commitment Tracking**: Detects and extracts due dates (e.g., "by Friday") tying them directly to tasks.
*   **Contextual Understanding**: Updates are contextually tied to the user's most relevant active tasks.
*   **Role-Based Access Control**: Different views and capabilities for Members, Admins, and Viewers.
*   **Admin Dashboard**: View aggregated health scores, system-wide task lists, blockers, and project statuses.

## 🏗️ System Design & Architecture

WorkSight is designed as a modern web application separated into a React frontend and a Python backend.

*   **Frontend**: 
    *   Built with **React** and **Vite**.
    *   Responsive, modern UI styled using **Tailwind CSS** and Lucide Icons.
    *   Communicates with the backend via RESTful APIs using Axios.
*   **Backend**: 
    *   Powered by **FastAPI** (Python), providing high-performance async API endpoints.
    *   Uses **SQLite** for lightweight data persistence (Phase 1) managed via SQLAlchemy ORM.
    *   Implements role-based route protection and JWT authentication.
*   **Intelligence Engine**: 
    *   Currently utilizes a rule-based extraction system as a foundation before migrating to an LLM-based approach. 
    *   Uses keyword matching and string parsing for intent classification and entity extraction.

## ❓ Troubleshooting

**"Port 5173 is in use"**
- Vite will automatically try the next port (5174, 5175, etc.).
- Check your terminal output to see which URL to open.

**"No module named dotenv"**
- Run `pip install -r backend/requirements.txt` to install missing dependencies.
