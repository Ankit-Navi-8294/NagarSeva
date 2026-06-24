# 🏛️ NagarSeva — AI-Powered Civic Issue Platform

> *"NagarSeva" means "Service to the City" in Kannada/Hindi.*
> A hyperlocal community issue reporting and resolution platform for Indian cities, starting with **Belagavi, Karnataka**.

---

## 🌟 What is NagarSeva?

NagarSeva is a **full-stack, AI-powered civic tech web application** that empowers citizens to report, track, and resolve community problems — potholes, broken streetlights, water leakages, garbage overflow, and more.

Instead of a citizen making a helpless phone call that goes nowhere, NagarSeva creates a **transparent, data-driven pipeline** where:
1. A citizen reports an issue with a photo + GPS location
2. **AI automatically classifies** the issue type, severity, and responsible department
3. The issue gets **tracked publicly** on a live map
4. Other citizens **upvote** to increase priority
5. **AI agents autonomously monitor** resolution time and escalate if deadlines are missed
6. Ward officers receive **automated weekly reports** on civic performance

---

## 🎯 The Problem We're Solving

India's cities face massive civic infrastructure challenges:
- Citizens don't know **where to report** issues
- Reports are **lost in bureaucracy** with no tracking
- **Duplicate complaints** waste administrative bandwidth  
- Ward officers have **no data visibility** to prioritize work
- Issues with **no political pressure** are ignored indefinitely

NagarSeva fixes all of this with automation and AI.

---

## 🤖 The 5 AI Agents (The Heart of the Project)

This is what makes NagarSeva truly unique. The platform runs **5 autonomous AI agents** powered by **Google Gemini 1.5 Pro**:

### Agent 1 — Vision Classifier 📸
**Trigger:** Every time a citizen submits a report  
**What it does:**
- Receives the photo and description from the citizen
- Uses **Gemini Vision** to analyze the image
- Automatically identifies: `Issue Type` (Pothole / Water Leak / Broken Light / etc.), `Severity` (1-5 scale), `Responsible Department` (PWD / BMC / BESCOM), `Confidence Score`
- Routes the issue to the correct department with zero human intervention

**Example output:**
```json
{
  "type": "Pothole",
  "severity": 4,
  "department": "PWD (Public Works Department)",
  "confidence": 0.91
}
```

---

### Agent 2 — Duplicate Merger 🔀
**Trigger:** Runs every 5 minutes automatically  
**What it does:**
- Scans all open issues in the database
- Uses **Haversine distance** to find issues within 100 meters of each other
- Uses **Gemini text-embedding-004** to compute semantic similarity of descriptions
- If two issues are about the same thing in the same area → **automatically merges them** and consolidates upvotes
- Prevents the same pothole from being reported 20 times separately

**Why it matters:** Cleaner data = better prioritization for ward officers.

---

### Agent 3 — SLA Watchdog ⏱️
**Trigger:** Runs every 2 minutes automatically  
**What it does:**
- Checks every open issue against defined SLA targets:
  - **Critical (Severity 5):** Must be resolved in 24 hours
  - **High (Severity 4):** 48 hours
  - **Medium (Severity 3):** 72 hours
  - **Low (Severity 1-2):** 7 days
- If an issue has **breached its deadline** → auto-escalates it (changes status to "Escalated", notifies department head)
- Logs all SLA violations for the weekly audit report

**Why it matters:** Issues can no longer be silently ignored.

---

### Agent 4 — Predictive Hotspot Forecaster 🗺️
**Trigger:** Runs every 30 minutes (weekly in production)  
**What it does:**
- Analyzes multi-year historical issue data (by ward, by season, by category)
- Feeds raw trend data to **Gemini** with a civic analyst prompt
- Gemini generates a **natural language forecast**:
  > *"Ward 12 has shown a consistent 45% spike in Pothole reports during June-August over the last 3 years. High risk of road deterioration expected this monsoon season. Recommend preventive maintenance before June 15."*
- Forecasts are saved to Firestore and displayed on the public dashboard

**Why it matters:** Shifts civic maintenance from **reactive → proactive**.

---

### Agent 5 — Weekly Digest Generator 📧
**Trigger:** Runs every 30 minutes (every Monday 8 AM in production)  
**What it does:**
- Scrapes the last 7 days of civic activity from Firestore
- Computes key metrics: Issues Opened, Resolved, Average Resolution Time, Category Breakdown, SLA Compliance Rate
- Sends the raw JSON to **Gemini** which autonomously drafts a **professional Markdown report** for the Ward Officer
- Highlights critical "Areas of Concern" based on the numbers
- Saves the digest to the `weekly_digests` collection

**Example digest excerpt:**
> **Week of June 17–24, 2026 | Ward 12 Report**
> 🔴 Area of Concern: 8 pothole complaints opened, only 2 resolved (75% SLA breach rate). Immediate action required.

---

## 🗺️ Google Maps Integration

The platform features a **live civic heatmap** powered by Google Maps:
- **Issue Clustering:** Dozens of issues in the same area are grouped into a numbered cluster bubble, preventing map clutter
- **Severity Heatmap:** Red zones = dangerous high-severity areas, Green = safe zones. Color intensity updates in real-time as new issues come in
- **Interactive Markers:** Click any marker to see the photo, AI classification, upvote count, and current status

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React PWA)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Login   │ │   Home   │ │  Report  │ │  Map View  │ │
│  │  (OTP)   │ │  Feed    │ │  Form    │ │  Heatmap   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────┐
│                  BACKEND (FastAPI / Python)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              APScheduler (Background)             │   │
│  │  Agent 2 (5m) │ Agent 3 (2m) │ Agent 4/5 (30m)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  POST /issues ──► Agent 1 (Vision Classifier)            │
│  POST /agents/sla-watchdog ──► Agent 3                   │
│  POST /agents/duplicate-merger ──► Agent 2               │
│  POST /agents/predictive-engine ──► Agent 4              │
│  POST /agents/weekly-digest ──► Agent 5                  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      DATA LAYER                          │
│                                                          │
│   Firebase Auth    │  Firestore DB   │  Firebase Storage │
│   (Phone OTP)      │  (Issues,       │  (Photo uploads)  │
│                    │   Digests,      │                   │
│                    │   Forecasts)    │                   │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   GOOGLE AI LAYER                        │
│                                                          │
│   Gemini 1.5 Pro Vision  │  text-embedding-004           │
│   (Image Classification) │  (Semantic Similarity)        │
│   (Digest Generation)    │  (Duplicate Detection)        │
│   (Hotspot Forecasting)  │                               │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite (PWA) |
| Styling | Vanilla CSS (design tokens, glassmorphism) |
| Routing | React Router v7 |
| Maps | Google Maps JavaScript API + Heatmap Library |
| Auth | Firebase Authentication (Phone OTP) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Backend | Python 3.11 + FastAPI |
| AI/ML | Google Gemini 1.5 Pro + text-embedding-004 |
| Scheduling | APScheduler (background agents) |
| Deployment Ready | Docker + Google Cloud Run |

---

## 🚀 How to Run Locally (Demo)

### Step 1: Start the Backend
```bash
cd backend
venv\Scripts\activate           # Windows
uvicorn main:app --reload
# → Backend live at http://127.0.0.1:8000
# → Swagger UI at http://127.0.0.1:8000/docs
# → All 5 AI Agents start running in background automatically!
```

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
# → App live at http://localhost:5173
```

### Step 3: Use the App
1. Open `http://localhost:5173`
2. Click **[DEV] Bypass Login** (for local demo, skips phone OTP)
3. Browse the **Home Feed** → tap **Report** to submit an issue
4. Go to **Map** to see the live heatmap and clustered markers
5. Go to `http://127.0.0.1:8000/docs` to directly trigger any AI agent

---

## 📊 Hackathon Evaluation Alignment

| Criteria | How NagarSeva Addresses It |
|---|---|
| **Problem Solving (20%)** | Solves a real, painful problem affecting millions of Indians — broken civic accountability |
| **Agentic Depth (20%)** | 5 fully autonomous AI agents (Vision, Dedup, SLA, Predictive, Digest) running on schedules |
| **Innovation (20%)** | Proactive AI forecasting + automatic escalation — not just a simple reporting form |
| **Google Technologies (15%)** | Gemini 1.5 Pro, text-embedding-004, Firebase Auth/Firestore/Storage, Google Maps API |
| **Product Experience (10%)** | PWA, mobile-first UI, offline capability, gamified civic points |
| **Technical Implementation (10%)** | Clean FastAPI + React architecture, Docker-ready, Firestore, proper error handling |
| **Completeness (5%)** | Auth → Report → Map → Agent Pipeline → Dashboard → Digest. All flows functional. |

---

## 💡 How to Explain This to Anyone

### The 30-Second Elevator Pitch
> *"NagarSeva is like Zomato for civic problems. Instead of ordering food, citizens report potholes, broken lights, or water leaks. But instead of a delivery person, Google's AI automatically reads the photo, decides which government department should fix it, tracks the deadline, and sends the ward officer a weekly performance report — all without any human doing the routing."*

### For Technical Judges
> *"We built a multi-agent agentic system where each autonomous agent has a distinct responsibility in the civic issue lifecycle. Agent 1 handles intake and classification using Gemini Vision. Agent 2 runs continuous deduplication using vector embeddings and spatial indexing. Agent 3 enforces SLA compliance through scheduled polling. Agents 4 and 5 handle predictive analytics and automated reporting using Gemini's generative capabilities. The entire backend is event-driven and cloud-native, designed for Google Cloud Run deployment."*

### For Non-Technical Judges/Friends
> *"Imagine you see a giant pothole and want to report it. Right now, you don't know who to call, and even if you do, nothing happens. With NagarSeva, you just open the app, take a photo, and tap Submit. The AI reads the photo, figures out it's a pothole, and tells the Roads Department about it. If they don't fix it in 48 hours, the app automatically escalates it to the department head. Every Monday, the ward officer gets a neat report telling them how their team performed. The AI also predicts where new potholes are likely to appear before monsoon — so the government can fix roads before they break!"*

---

## 📁 Project Structure

```
civic/
├── frontend/                   # React PWA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Phone OTP auth
│   │   │   ├── Home.tsx        # Issue feed
│   │   │   ├── Report.tsx      # Issue reporting form
│   │   │   ├── MapViewer.tsx   # Google Maps + Heatmap
│   │   │   ├── Profile.tsx     # Civic points + badges
│   │   │   └── Impact.tsx      # City-wide stats dashboard
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Firebase Auth provider
│   │   └── lib/
│   │       └── firebase.ts     # Firebase config
│   └── .env.local              # API keys (not committed)
│
└── backend/                    # FastAPI Python server
    ├── main.py                 # App entry point + APScheduler
    ├── app/
    │   ├── api/
    │   │   ├── issues.py       # CRUD endpoints for issues
    │   │   └── agents.py       # Agent trigger endpoints
    │   ├── services/
    │   │   ├── agent_vision.py     # Agent 1: Gemini Vision
    │   │   ├── agent_duplicate.py  # Agent 2: Dedup + Merge
    │   │   ├── agent_sla.py        # Agent 3: SLA Watchdog
    │   │   ├── agent_predictive.py # Agent 4: Forecaster
    │   │   └── agent_digest.py     # Agent 5: Weekly Report
    │   ├── models/
    │   │   └── issue.py        # Pydantic data models
    │   └── core/
    │       └── config.py       # Firebase initialization
    ├── Dockerfile              # For Google Cloud Run
    ├── requirements.txt        # Python dependencies
    └── .env                    # Secrets (not committed)
```

---

*Built with ❤️ for Belagavi, Karnataka — and every city that deserves better civic services.*
