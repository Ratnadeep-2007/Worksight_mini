# WorkSight – Predictive HR Engine

> AI-powered employee burnout detection through **Profile Drift Analysis** using the Gemini API.

WorkSight compares an employee's **Baseline DNA** (who they were at hire) against their **Current Digital Exhaust** (how they work now) to identify misalignments that lead to burnout, disengagement, and turnover.

---

## 🖼️ Screenshots

| Dashboard | Baseline DNA | XAI Results |
|:---------:|:------------:|:-----------:|
| Dark-side themed overview with metric cards, architecture diagram, and privacy-first design | Big Five personality sliders, cognitive scores, and engagement data | Animated burnout score ring, SHAP reasoning tags, and intervention tactics |

---

## 🏗️ Four-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│  Layer 1 — Baseline DNA (Recruitment Silo)      │
│  Big Five Traits · Cognitive Scores · Sentiment  │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 2 — Digital Exhaust (Operational Silo)   │
│  Meeting Density · Login Patterns · Task Velocity│
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 3 — Communication (Metadata Silo)        │
│  Msg Frequency · Response Latency · Network Map  │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│  Layer 4 — Profile Drift Intelligence (Gemini)  │
│  Drift Detection · SHAP Tags · Intervention      │
└─────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **Profile Drift Detection** — Measures the gap between recruitment personality and current work behavior
- **Burnout Probability Scoring** — AI-generated 0–100% risk score with Low/Medium/High/Critical levels
- **Explainable AI (XAI)** — SHAP-style reasoning tags showing the top 3 stressors with percentage impact weights
- **Intervention Tactics** — Human-led management actions suggested by the AI (e.g., "Implement a Digital Sunset")
- **Privacy-First Design** — No raw message content processed; only metadata patterns are analyzed
- **Dark-Side Theme** — Premium UI with deep blacks, violet/cyan neon accents, glassmorphism, and micro-animations
- **Pre-loaded Demo** — One-click "Alex Chen" scenario to test the full flow instantly

---

## 📁 Project Structure

```
mini_project/
├── index.html          # Main SPA — sidebar navigation, 5 panels, modals
├── style.css           # Dark-side theme — glassmorphism, animations
├── README.md           # This file
└── js/
    ├── app.js          # Navigation controller, settings, orchestration
    ├── gemini.js       # Gemini API integration (system prompt + API call)
    ├── dashboard.js    # XAI results rendering (score ring, SHAP tags)
    └── sampleData.js   # Pre-loaded "Alex Chen" demo data
```

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox)
- [Node.js](https://nodejs.org/) (for the local dev server)
- A [Gemini API Key](https://aistudio.google.com/apikey)

### Run Locally

```bash
# Navigate to the project directory
cd mini_project

# Start a local server
npx serve . -l 3000
```

Open **http://localhost:3000** in your browser.

### Configure API Key

1. Click **API Settings** (gear icon) in the sidebar
2. Paste your Gemini API key
3. Click **Save & Close**

The key is stored in your browser's `localStorage` only — it is never sent anywhere except the Gemini API endpoint.

---

## 📖 How to Use

1. **Load Demo Data** — Click **"Load Demo (Alex)"** to populate all three input silos with a sample High-Focus Developer scenario
2. **Or Enter Data Manually** — Fill in the Baseline DNA, Digital Exhaust, and Communication panels with real employee data
3. **Analyze** — Click **"Analyze Drift"** to send the data to Gemini
4. **Review Results** — The XAI Results panel displays:
   - 🎯 **Burnout Risk Score** — Animated ring with percentage
   - 📊 **Profile Drift Summary** — How current reality differs from baseline
   - 🔍 **SHAP Reasoning Tags** — Top 3 stressors with impact weights
   - 🛡️ **Intervention Tactic** — Recommended management action

---

## 🤖 Gemini System Prompt

The AI is instructed to act as the **WorkSight Predictive HR Engine** with a strict four-step process:

| Step | Action |
|------|--------|
| **1. Drift Analysis** | Compare Baseline DNA against Operational Exhaust |
| **2. Risk Scoring** | Calculate Burnout Probability (0–100%) |
| **3. SHAP Explainability** | Identify top 3 stressors with % impact weights |
| **4. Intervention** | Suggest a human-led management tactic |

Output is strict JSON: `burnout_risk_score`, `risk_level`, `profile_drift_summary`, `xai_reasoning_tags`, `intervention_tactic`.

---

## 🔒 Privacy & Security

| Principle | Implementation |
|-----------|---------------|
| **No raw content** | Only metadata patterns are analyzed — never private message text |
| **Client-side only** | No backend server, no database — everything runs in your browser |
| **Local key storage** | API key stored in `localStorage`, sent only to Google's Gemini API |
| **Manager-safe UI** | Dashboard shows risk levels and reasoning tags, never raw employee data |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **AI Engine** | Google Gemini API (2.0 Flash) |
| **Design** | Custom dark-side theme with CSS variables |
| **Typography** | Inter + JetBrains Mono (Google Fonts) |
| **Dev Server** | `npx serve` (zero-config static server) |

---

## 📄 License

This project is for educational and research purposes.
